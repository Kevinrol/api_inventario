import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreatePedidoProveedorDto } from './dto/create-pedido-proveedor.dto';
import { UpdatePedidoProveedorDto } from './dto/update-pedido-proveedor.dto';
import { RecibirPedidoProveedorDto } from './dto/recibir-pedido-proveedor.dto';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.provider';
import {
  PedidoProveedor,
  EstadoPedido,
} from '../interfaces/pedido-proveedor.interface';
import { EstadoCompra } from '../interfaces/compra-proveedor.interface';

@Injectable()
export class PedidosProveedorService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  private parsePedido(row: any): PedidoProveedor {
    if (!row) return row;
    return {
      ...row,
      total_pedido: Number(row.total_pedido ?? 0),
    };
  }

  private handleDatabaseError(error: any): never {
    if (error?.code === 'P0001') {
      throw new BadRequestException(
        error.message || 'Error de validación en las líneas del pedido.',
      );
    }
    if (error?.code === '23503' && error?.constraint === 'fk_compras_pedido') {
      throw new BadRequestException(
        'El proveedor de la compra no coincide con el proveedor del pedido.',
      );
    }
    throw error;
  }

  async create(createDto: CreatePedidoProveedorDto): Promise<PedidoProveedor> {
    const { detalles, ...pedidoInfo } = createDto;

    return await this.knex.transaction(async (trx) => {
      // 1. Validar existencia y estado de proveedor y usuario
      const proveedor = await trx('proveedores')
        .where({ id_proveedor: pedidoInfo.id_proveedor, estado: true })
        .first();
      if (!proveedor) {
        throw new BadRequestException(
          `El proveedor con ID ${pedidoInfo.id_proveedor} no existe o está inactivo.`,
        );
      }

      const usuario = await trx('usuarios')
        .where({ id_usuario: pedidoInfo.id_usuario, estado: true })
        .first();
      if (!usuario) {
        throw new BadRequestException(
          `El usuario con ID ${pedidoInfo.id_usuario} no existe o está inactivo.`,
        );
      }

      // 2. Calcular subtotales y total acumulado
      let totalCalculado = 0;
      const detallesAInsertar: any[] = [];

      for (const item of detalles) {
        const producto = await trx('productos')
          .where({ id_producto: item.id_producto })
          .first();
        if (!producto) {
          throw new NotFoundException(
            `Producto con ID ${item.id_producto} no encontrado.`,
          );
        }

        const desc = item.porcentaje_descuento
          ? Number(item.porcentaje_descuento)
          : 0;
        const precioUnitario = Number(item.precio_unitario_compra);
        const subtotal = Number(
          (
            item.cantidad_solicitada *
            precioUnitario *
            (1 - desc / 100)
          ).toFixed(2),
        );
        totalCalculado = Number((totalCalculado + subtotal).toFixed(2));

        detallesAInsertar.push({
          id_producto: item.id_producto,
          cantidad_solicitada: item.cantidad_solicitada,
          unidad_venta: item.unidad_venta,
          precio_unitario_compra: precioUnitario,
          porcentaje_descuento: desc,
          subtotal,
          nombre_producto: producto.nombre_producto,
        });
      }

      // 3. Insertar maestro siempre con estado Pendiente
      const [pedidoInsertado] = await trx('pedidos_proveedor')
        .insert({
          id_proveedor: pedidoInfo.id_proveedor,
          id_usuario: pedidoInfo.id_usuario,
          fecha_pedido: pedidoInfo.fecha_pedido
            ? new Date(pedidoInfo.fecha_pedido)
            : new Date(),
          fecha_entrega_estimada: pedidoInfo.fecha_entrega_estimada || null,
          total_pedido: totalCalculado,
          estado_pedido: EstadoPedido.PENDIENTE,
          comprobante_url: pedidoInfo.comprobante_url || null,
        })
        .returning('*');

      // 4. Insertar detalles
      const detallesFinales: any[] = [];
      for (const d of detallesAInsertar) {
        const [detInsertado] = await trx('detalle_pedidos_proveedor')
          .insert({
            id_pedido: pedidoInsertado.id_pedido,
            id_producto: d.id_producto,
            cantidad_solicitada: d.cantidad_solicitada,
            unidad_venta: d.unidad_venta,
            precio_unitario_compra: d.precio_unitario_compra,
            porcentaje_descuento: d.porcentaje_descuento,
            subtotal: d.subtotal,
          })
          .returning('*');

        detallesFinales.push({
          ...detInsertado,
          cantidad_recibida: 0,
          cantidad_pendiente: Number(detInsertado.cantidad_solicitada),
          precio_unitario_compra: Number(detInsertado.precio_unitario_compra),
          porcentaje_descuento: Number(detInsertado.porcentaje_descuento),
          subtotal: Number(detInsertado.subtotal),
          nombre_producto: d.nombre_producto,
        });
      }

      return {
        ...this.parsePedido(pedidoInsertado),
        detalles: detallesFinales,
      };
    });
  }

  async findAll(filtros?: {
    estado_pedido?: string;
    id_proveedor?: number;
    id_usuario?: number;
    desde?: string;
    hasta?: string;
  }): Promise<PedidoProveedor[]> {
    const query = this.knex('pedidos_proveedor')
      .leftJoin(
        'proveedores',
        'pedidos_proveedor.id_proveedor',
        'proveedores.id_proveedor',
      )
      .leftJoin(
        'usuarios',
        'pedidos_proveedor.id_usuario',
        'usuarios.id_usuario',
      )
      .select(
        'pedidos_proveedor.*',
        'proveedores.razon_social as razon_social_proveedor',
        'usuarios.nombre_completo as nombre_usuario',
      )
      .orderBy('pedidos_proveedor.fecha_pedido', 'desc');

    if (filtros?.estado_pedido) {
      query.where('pedidos_proveedor.estado_pedido', filtros.estado_pedido);
    }
    if (filtros?.id_proveedor) {
      query.where('pedidos_proveedor.id_proveedor', filtros.id_proveedor);
    }
    if (filtros?.id_usuario) {
      query.where('pedidos_proveedor.id_usuario', filtros.id_usuario);
    }
    if (filtros?.desde) {
      query.where('pedidos_proveedor.fecha_pedido', '>=', filtros.desde);
    }
    if (filtros?.hasta) {
      query.where('pedidos_proveedor.fecha_pedido', '<=', filtros.hasta);
    }

    const rows = await query;
    return rows.map((r) => this.parsePedido(r));
  }

  async findOne(id_pedido: number): Promise<PedidoProveedor> {
    const pedido = await this.knex('pedidos_proveedor')
      .leftJoin(
        'proveedores',
        'pedidos_proveedor.id_proveedor',
        'proveedores.id_proveedor',
      )
      .leftJoin(
        'usuarios',
        'pedidos_proveedor.id_usuario',
        'usuarios.id_usuario',
      )
      .select(
        'pedidos_proveedor.*',
        'proveedores.razon_social as razon_social_proveedor',
        'usuarios.nombre_completo as nombre_usuario',
      )
      .where('pedidos_proveedor.id_pedido', id_pedido)
      .first();

    if (!pedido) {
      throw new NotFoundException(`Pedido con ID ${id_pedido} no encontrado.`);
    }

    const detalles = await this.knex('detalle_pedidos_proveedor as dp')
      .leftJoin('productos as p', 'dp.id_producto', 'p.id_producto')
      .leftJoin(
        this.knex('detalle_compras_proveedores')
          .select('id_detalle_pedido')
          .sum('cantidad_recibida as recibido')
          .whereNotNull('id_detalle_pedido')
          .groupBy('id_detalle_pedido')
          .as('r'),
        'dp.id_detalle_pedido',
        'r.id_detalle_pedido',
      )
      .select(
        'dp.*',
        'p.nombre_producto',
        this.knex.raw('COALESCE(r.recibido, 0)::int as cantidad_recibida'),
      )
      .where('dp.id_pedido', id_pedido)
      .orderBy('dp.id_detalle_pedido', 'asc');

    return {
      ...this.parsePedido(pedido),
      detalles: detalles.map((d) => {
        const solicitada = Number(d.cantidad_solicitada);
        const recibida = Number(d.cantidad_recibida ?? 0);
        return {
          ...d,
          cantidad_solicitada: solicitada,
          cantidad_recibida: recibida,
          cantidad_pendiente: Math.max(0, solicitada - recibida),
          precio_unitario_compra: Number(d.precio_unitario_compra),
          porcentaje_descuento: Number(d.porcentaje_descuento),
          subtotal: Number(d.subtotal),
        };
      }),
    };
  }

  async update(
    id_pedido: number,
    updateDto: UpdatePedidoProveedorDto,
  ): Promise<PedidoProveedor> {
    const pedido = await this.findOne(id_pedido);
    if (pedido.estado_pedido === EstadoPedido.CANCELADO) {
      throw new BadRequestException(
        `No se puede modificar un pedido en estado "${pedido.estado_pedido}".`,
      );
    }

    const soloComprobante =
      updateDto.fecha_entrega_estimada === undefined &&
      updateDto.estado_pedido === undefined;

    if (pedido.estado_pedido === EstadoPedido.RECIBIDO && !soloComprobante) {
      throw new BadRequestException(
        `No se puede modificar un pedido en estado "${pedido.estado_pedido}".`,
      );
    }

    if (
      updateDto.estado_pedido &&
      pedido.estado_pedido === EstadoPedido.PARCIAL
    ) {
      throw new BadRequestException(
        'No se puede cambiar manualmente el estado de un pedido con recepción parcial.',
      );
    }

    const datosActualizar: Partial<UpdatePedidoProveedorDto> = {};
    if (updateDto.fecha_entrega_estimada !== undefined) {
      datosActualizar.fecha_entrega_estimada = updateDto.fecha_entrega_estimada;
    }
    if (updateDto.estado_pedido !== undefined) {
      datosActualizar.estado_pedido = updateDto.estado_pedido;
    }
    if (updateDto.comprobante_url !== undefined) {
      datosActualizar.comprobante_url = updateDto.comprobante_url;
    }

    if (Object.keys(datosActualizar).length > 0) {
      await this.knex('pedidos_proveedor')
        .where({ id_pedido })
        .update(datosActualizar);
    }

    return this.findOne(id_pedido);
  }

  async recibir(
    id_pedido: number,
    recibirDto?: RecibirPedidoProveedorDto | number,
  ) {
    const dto: RecibirPedidoProveedorDto =
      typeof recibirDto === 'number'
        ? { id_usuario: recibirDto }
        : (recibirDto ?? {});

    try {
      return await this.knex.transaction(async (trx) => {
        const pedido = await trx('pedidos_proveedor')
          .where({ id_pedido })
          .forUpdate()
          .first();
        if (!pedido) {
          throw new NotFoundException(
            `Pedido con ID ${id_pedido} no encontrado.`,
          );
        }

        if (pedido.estado_pedido === EstadoPedido.RECIBIDO) {
          throw new BadRequestException(
            `El pedido con ID ${id_pedido} ya fue recibido completamente.`,
          );
        }

        if (pedido.estado_pedido === EstadoPedido.CANCELADO) {
          throw new BadRequestException(
            `No se puede recibir un pedido cancelado.`,
          );
        }

        const detallesPedido = await trx('detalle_pedidos_proveedor as dp')
          .leftJoin(
            trx('detalle_compras_proveedores')
              .select('id_detalle_pedido')
              .sum('cantidad_recibida as recibido')
              .whereNotNull('id_detalle_pedido')
              .groupBy('id_detalle_pedido')
              .as('r'),
            'dp.id_detalle_pedido',
            'r.id_detalle_pedido',
          )
          .select(
            'dp.*',
            trx.raw('COALESCE(r.recibido, 0)::int as cantidad_recibida'),
          )
          .where('dp.id_pedido', id_pedido)
          .orderBy('dp.id_detalle_pedido', 'asc');

        if (!detallesPedido || detallesPedido.length === 0) {
          throw new BadRequestException(
            `El pedido no contiene detalles para recibir.`,
          );
        }

        // Preparar qué cantidad se va a recibir por cada línea
        const lineasARecibir: Array<{
          id_detalle_pedido: number;
          id_producto: number;
          cantidad_recibida: number;
          precio_costo_unitario: number;
          subtotal: number;
        }> = [];

        if (dto.detalles && dto.detalles.length > 0) {
          for (const item of dto.detalles) {
            const lineaPedido = detallesPedido.find((dp) =>
              item.id_detalle_pedido != null
                ? Number(dp.id_detalle_pedido) === Number(item.id_detalle_pedido)
                : Number(dp.id_producto) === Number(item.id_producto),
            );

            if (!lineaPedido) {
              throw new BadRequestException(
                `La línea o producto indicado no pertenece al pedido #${id_pedido}.`,
              );
            }

            const pendiente =
              Number(lineaPedido.cantidad_solicitada) -
              Number(lineaPedido.cantidad_recibida ?? 0);

            if (item.cantidad_recibida > pendiente) {
              throw new BadRequestException(
                `La línea #${lineaPedido.id_detalle_pedido} solo tiene ${pendiente} unidad(es) pendiente(s) por recibir.`,
              );
            }

            const desc = Number(lineaPedido.porcentaje_descuento ?? 0);
            const precioEfectivo = Number(
              (
                Number(lineaPedido.precio_unitario_compra) *
                (1 - desc / 100)
              ).toFixed(2),
            );
            const subtotal = Number(
              (item.cantidad_recibida * precioEfectivo).toFixed(2),
            );

            lineasARecibir.push({
              id_detalle_pedido: Number(lineaPedido.id_detalle_pedido),
              id_producto: Number(lineaPedido.id_producto),
              cantidad_recibida: Number(item.cantidad_recibida),
              precio_costo_unitario: precioEfectivo,
              subtotal,
            });
          }
        } else {
          // Recibir automáticamente todo lo pendiente (saltando líneas ya completas)
          for (const dp of detallesPedido) {
            const pendiente =
              Number(dp.cantidad_solicitada) -
              Number(dp.cantidad_recibida ?? 0);
            if (pendiente <= 0) continue;

            const desc = Number(dp.porcentaje_descuento ?? 0);
            const precioEfectivo = Number(
              (Number(dp.precio_unitario_compra) * (1 - desc / 100)).toFixed(2),
            );
            const subtotal = Number((pendiente * precioEfectivo).toFixed(2));

            lineasARecibir.push({
              id_detalle_pedido: Number(dp.id_detalle_pedido),
              id_producto: Number(dp.id_producto),
              cantidad_recibida: pendiente,
              precio_costo_unitario: precioEfectivo,
              subtotal,
            });
          }
        }

        if (lineasARecibir.length === 0) {
          throw new BadRequestException(
            `El pedido #${id_pedido} no tiene unidades pendientes por recibir.`,
          );
        }

        const totalPagado = Number(
          lineasARecibir
            .reduce((acc, l) => acc + l.subtotal, 0)
            .toFixed(2),
        );

        // 1. Crear la compra asociada en compras_proveedores
        const usuarioFinal = dto.id_usuario || pedido.id_usuario;
        const [compraInsertada] = await trx('compras_proveedores')
          .insert({
            id_pedido: pedido.id_pedido,
            id_proveedor: pedido.id_proveedor,
            id_usuario: usuarioFinal,
            fecha_recepcion: new Date(),
            total_pagado: totalPagado,
            estado: EstadoCompra.COMPLETADA,
            comprobante_url: dto.comprobante_url || null,
          })
          .returning('*');

        // 2. Insertar detalles de compra (con id_detalle_pedido) e incrementar stock_actual
        // Nota: el trigger de BD actualiza automáticamente estado_pedido a Parcial o Recibido
        const detallesCompraInsertados: any[] = [];
        for (const l of lineasARecibir) {
          const [detCompra] = await trx('detalle_compras_proveedores')
            .insert({
              id_compra: compraInsertada.id_compra,
              id_detalle_pedido: l.id_detalle_pedido,
              id_producto: l.id_producto,
              cantidad_recibida: l.cantidad_recibida,
              precio_costo_unitario: l.precio_costo_unitario,
              subtotal: l.subtotal,
            })
            .returning('*');

          await trx('productos')
            .where({ id_producto: l.id_producto })
            .increment('stock_actual', l.cantidad_recibida);

          detallesCompraInsertados.push({
            ...detCompra,
            precio_costo_unitario: Number(detCompra.precio_costo_unitario),
            subtotal: Number(detCompra.subtotal),
          });
        }

        const pedidoActualizado = await trx('pedidos_proveedor')
          .where({ id_pedido })
          .first();

        return {
          mensaje: `Pedido #${id_pedido} procesado (${pedidoActualizado?.estado_pedido ?? 'Recibido'}). Compra #${compraInsertada.id_compra} generada y stock actualizado.`,
          estado_pedido: pedidoActualizado?.estado_pedido,
          compra: {
            ...compraInsertada,
            total_pagado: Number(compraInsertada.total_pagado),
            detalles: detallesCompraInsertados,
          },
        };
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id_pedido: number): Promise<PedidoProveedor> {
    const pedido = await this.findOne(id_pedido);
    if (
      pedido.estado_pedido === EstadoPedido.RECIBIDO ||
      pedido.estado_pedido === EstadoPedido.PARCIAL
    ) {
      throw new BadRequestException(
        `No se puede cancelar un pedido en estado "${pedido.estado_pedido}" porque ya tiene mercadería ingresada en stock.`,
      );
    }

    await this.knex('pedidos_proveedor').where({ id_pedido }).update({
      estado_pedido: EstadoPedido.CANCELADO,
    });

    return {
      ...pedido,
      estado_pedido: EstadoPedido.CANCELADO,
    };
  }
}
