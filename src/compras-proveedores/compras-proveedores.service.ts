import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateCompraProveedorDto } from './dto/create-compra-proveedor.dto';
import { UpdateCompraProveedorDto } from './dto/update-compra-proveedor.dto';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.provider';
import {
  CompraProveedor,
  EstadoCompra,
} from '../interfaces/compra-proveedor.interface';
import { EstadoPedido } from '../interfaces/pedido-proveedor.interface';

@Injectable()
export class ComprasProveedoresService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  private parseCompra(row: any): CompraProveedor {
    if (!row) return row;
    return {
      ...row,
      total_pagado: Number(row.total_pagado ?? 0),
    };
  }

  private handleDatabaseError(error: any): never {
    if (error?.code === 'P0001') {
      throw new BadRequestException(
        error.message || 'Error de validación en las líneas de la compra.',
      );
    }
    if (error?.code === '23503' && error?.constraint === 'fk_compras_pedido') {
      throw new BadRequestException(
        'El proveedor de la compra no coincide con el proveedor del pedido.',
      );
    }
    throw error;
  }

  async create(createDto: CreateCompraProveedorDto): Promise<CompraProveedor> {
    const { detalles, ...compraInfo } = createDto;

    // 1. Validar que el proveedor y usuario existan y estén activos
    const proveedor = await this.knex('proveedores')
      .where({ id_proveedor: compraInfo.id_proveedor, estado: true })
      .first();
    if (!proveedor) {
      throw new BadRequestException(
        `El proveedor con ID ${compraInfo.id_proveedor} no existe o está inactivo.`,
      );
    }

    const usuario = await this.knex('usuarios')
      .where({ id_usuario: compraInfo.id_usuario, estado: true })
      .first();
    if (!usuario) {
      throw new BadRequestException(
        `El usuario con ID ${compraInfo.id_usuario} no existe o está inactivo.`,
      );
    }

    // 2. Calcular total pagado sumando subtotales
    let totalPagado = 0;
    const detallesConSubtotal = detalles.map((d) => {
      const subtotal = Number(
        (d.cantidad_recibida * d.precio_costo_unitario).toFixed(2),
      );
      totalPagado = Number((totalPagado + subtotal).toFixed(2));
      return { ...d, subtotal };
    });

    try {
      return await this.knex.transaction(async (trx) => {
        let mapaDetallePedidoPorProducto = new Map<number, number>();

        // Si viene id_pedido, validar que exista, que no esté Cancelado ni Recibido,
        // y preparar la búsqueda automática de id_detalle_pedido por id_producto
        if (compraInfo.id_pedido) {
          const pedido = await trx('pedidos_proveedor')
            .where({ id_pedido: compraInfo.id_pedido })
            .forUpdate()
            .first();

          if (!pedido) {
            throw new NotFoundException(
              `El pedido con ID ${compraInfo.id_pedido} no existe.`,
            );
          }

          if (
            pedido.estado_pedido === EstadoPedido.CANCELADO ||
            pedido.estado_pedido === EstadoPedido.RECIBIDO
          ) {
            throw new BadRequestException(
              `No se puede registrar una compra asociada a un pedido en estado "${pedido.estado_pedido}".`,
            );
          }

          const lineasPedido = await trx('detalle_pedidos_proveedor')
            .where({ id_pedido: compraInfo.id_pedido })
            .orderBy('id_detalle_pedido', 'asc');

          for (const lp of lineasPedido) {
            if (!mapaDetallePedidoPorProducto.has(Number(lp.id_producto))) {
              mapaDetallePedidoPorProducto.set(
                Number(lp.id_producto),
                Number(lp.id_detalle_pedido),
              );
            }
          }
        }

        // 1. Insertar maestro (compra)
        const [compraInsertada] = await trx('compras_proveedores')
          .insert({
            id_proveedor: compraInfo.id_proveedor,
            id_usuario: compraInfo.id_usuario,
            id_pedido: compraInfo.id_pedido || null,
            fecha_recepcion: compraInfo.fecha_recepcion
              ? new Date(compraInfo.fecha_recepcion)
              : new Date(),
            total_pagado: totalPagado,
            estado: EstadoCompra.COMPLETADA,
            comprobante_url: compraInfo.comprobante_url || null,
          })
          .returning('*');

        // 2. Insertar detalles (con id_detalle_pedido enviado o buscado por id_producto)
        const detallesAInsertar = detallesConSubtotal.map((d) => {
          const idDetallePedido =
            d.id_detalle_pedido ??
            (compraInfo.id_pedido
              ? (mapaDetallePedidoPorProducto.get(Number(d.id_producto)) ??
                null)
              : null);

          return {
            id_compra: compraInsertada.id_compra,
            id_detalle_pedido: idDetallePedido,
            id_producto: d.id_producto,
            cantidad_recibida: d.cantidad_recibida,
            precio_costo_unitario: d.precio_costo_unitario,
            subtotal: d.subtotal,
          };
        });

        const detallesInsertados = await trx('detalle_compras_proveedores')
          .insert(detallesAInsertar)
          .returning('*');

        // 3. Actualizar stock_actual de cada producto
        for (const d of detallesAInsertar) {
          await trx('productos')
            .where({ id_producto: d.id_producto })
            .increment('stock_actual', d.cantidad_recibida);
        }

        return {
          ...this.parseCompra(compraInsertada),
          detalles: detallesInsertados.map((d) => ({
            ...d,
            precio_costo_unitario: Number(d.precio_costo_unitario),
            subtotal: Number(d.subtotal),
          })),
        };
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findAll(filtros?: {
    id_proveedor?: number;
    id_usuario?: number;
    estado?: string;
    desde?: string;
    hasta?: string;
  }): Promise<CompraProveedor[]> {
    const query = this.knex('compras_proveedores')
      .leftJoin(
        'proveedores',
        'compras_proveedores.id_proveedor',
        'proveedores.id_proveedor',
      )
      .leftJoin(
        'usuarios',
        'compras_proveedores.id_usuario',
        'usuarios.id_usuario',
      )
      .select(
        'compras_proveedores.*',
        'proveedores.razon_social as razon_social_proveedor',
        'usuarios.nombre_completo as nombre_usuario',
      )
      .orderBy('compras_proveedores.fecha_recepcion', 'desc');

    if (filtros?.id_proveedor) {
      query.where('compras_proveedores.id_proveedor', filtros.id_proveedor);
    }
    if (filtros?.id_usuario) {
      query.where('compras_proveedores.id_usuario', filtros.id_usuario);
    }
    if (filtros?.estado) {
      query.where('compras_proveedores.estado', filtros.estado);
    }
    if (filtros?.desde) {
      query.where('compras_proveedores.fecha_recepcion', '>=', filtros.desde);
    }
    if (filtros?.hasta) {
      query.where('compras_proveedores.fecha_recepcion', '<=', filtros.hasta);
    }

    const rows = await query;
    return rows.map((r) => this.parseCompra(r));
  }

  async findOne(id_compra: number): Promise<CompraProveedor> {
    const compra = await this.knex('compras_proveedores')
      .leftJoin(
        'proveedores',
        'compras_proveedores.id_proveedor',
        'proveedores.id_proveedor',
      )
      .leftJoin(
        'usuarios',
        'compras_proveedores.id_usuario',
        'usuarios.id_usuario',
      )
      .select(
        'compras_proveedores.*',
        'proveedores.razon_social as razon_social_proveedor',
        'usuarios.nombre_completo as nombre_usuario',
      )
      .where('compras_proveedores.id_compra', id_compra)
      .first();

    if (!compra) {
      throw new NotFoundException(`Compra con ID ${id_compra} no encontrada`);
    }

    const detalles = await this.knex('detalle_compras_proveedores')
      .leftJoin(
        'productos',
        'detalle_compras_proveedores.id_producto',
        'productos.id_producto',
      )
      .select(
        'detalle_compras_proveedores.*',
        'productos.nombre_producto',
        'productos.codigo_barras',
      )
      .where('detalle_compras_proveedores.id_compra', id_compra);

    return {
      ...this.parseCompra(compra),
      detalles: detalles.map((d) => ({
        ...d,
        precio_costo_unitario: Number(d.precio_costo_unitario),
        subtotal: Number(d.subtotal),
      })),
    };
  }

  async update(
    id_compra: number,
    updateDto: UpdateCompraProveedorDto,
  ): Promise<CompraProveedor> {
    const compra = await this.findOne(id_compra);
    if (compra.estado === EstadoCompra.ANULADA) {
      throw new BadRequestException(
        'No se puede modificar una compra anulada.',
      );
    }
    try {
      await this.knex('compras_proveedores')
        .where({ id_compra })
        .update(updateDto);
      return this.findOne(id_compra);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id_compra: number): Promise<CompraProveedor> {
    return await this.knex.transaction(async (trx) => {
      const compra = await trx('compras_proveedores')
        .where({ id_compra })
        .first();
      if (!compra) {
        throw new NotFoundException(
          `Compra con ID ${id_compra} no encontrada.`,
        );
      }

      if (compra.estado === EstadoCompra.ANULADA) {
        throw new BadRequestException(
          `La compra con ID ${id_compra} ya ha sido anulada anteriormente.`,
        );
      }

      const detalles = await trx('detalle_compras_proveedores').where({
        id_compra,
      });

      // Verificar que el stock disponible permita revertir la compra sin dejar stock negativo
      for (const d of detalles) {
        const producto = await trx('productos')
          .where({ id_producto: d.id_producto })
          .forUpdate()
          .first();
        if (!producto) {
          throw new NotFoundException(
            `Producto con ID ${d.id_producto} no encontrado.`,
          );
        }

        const stockActual = Number(producto.stock_actual ?? 0);
        if (stockActual < d.cantidad_recibida) {
          throw new BadRequestException(
            `No se puede anular la compra: el producto "${producto.nombre_producto}" tiene stock actual de ${stockActual}, insuficiente para restar las ${d.cantidad_recibida} unidades ingresadas por esta compra.`,
          );
        }
      }

      // 1. Soft delete: marcar estado como Anulada
      await trx('compras_proveedores')
        .where({ id_compra })
        .update({ estado: EstadoCompra.ANULADA });

      // 2. Revertir el stock restando las unidades recibidas
      for (const d of detalles) {
        await trx('productos')
          .where({ id_producto: d.id_producto })
          .decrement('stock_actual', d.cantidad_recibida);
      }

      return await this.findOne(id_compra);
    });
  }
}
