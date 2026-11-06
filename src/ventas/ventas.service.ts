import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.provider';
import {
  Venta,
  MetodoPago,
  EstadoPagoVenta,
  TipoVenta,
} from '../interfaces/venta.interface';
import { TipoCliente } from '../interfaces/cliente.interface';

const MENSAJE_CREDITO_MAYORISTA =
  'Las ventas a crédito solo están permitidas para clientes mayoristas registrados.';

@Injectable()
export class VentasService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  /**
   * Una venta a crédito exige un cliente registrado y de tipo Mayorista.
   * Las ventas generales (sin cliente) y los minoristas solo pueden ser al contado.
   */
  private validarCreditoMayorista(
    tipoVenta: string,
    cliente?: { tipo_cliente?: string } | null,
  ): void {
    if (tipoVenta !== TipoVenta.CREDITO) return;
    if (!cliente || cliente.tipo_cliente !== TipoCliente.MAYORISTA) {
      throw new BadRequestException(MENSAJE_CREDITO_MAYORISTA);
    }
  }

  private parseVenta(row: any): Venta {
    if (!row) return row;
    return {
      ...row,
      monto_total: Number(row.monto_total ?? 0),
      monto_descuento: Number(row.monto_descuento ?? 0),
      monto_efectivo:
        row.monto_efectivo !== null && row.monto_efectivo !== undefined
          ? Number(row.monto_efectivo)
          : null,
      monto_cambio:
        row.monto_cambio !== null && row.monto_cambio !== undefined
          ? Number(row.monto_cambio)
          : null,
    };
  }

  async create(createVentaDto: CreateVentaDto): Promise<Venta> {
    const { detalles, ...ventaInfo } = createVentaDto;

    return await this.knex.transaction(async (trx) => {
      // 1. Validar que el usuario exista y esté activo
      const usuario = await trx('usuarios')
        .where({ id_usuario: ventaInfo.id_usuario, estado: true })
        .first();
      if (!usuario) {
        throw new BadRequestException(
          `El usuario con ID ${ventaInfo.id_usuario} no existe o está inactivo.`,
        );
      }

      // 2. Validar cliente si fue proporcionado
      let cliente: any = null;
      if (ventaInfo.id_cliente) {
        cliente = await trx('clientes')
          .where({ id_cliente: ventaInfo.id_cliente, estado: true })
          .first();
        if (!cliente) {
          throw new BadRequestException(
            `El cliente con ID ${ventaInfo.id_cliente} no existe o está inactivo.`,
          );
        }
      }

      // 2.1. El crédito solo está permitido para clientes mayoristas registrados
      this.validarCreditoMayorista(ventaInfo.tipo_venta, cliente);

      // 3. Validar stock y preparar detalles con precios oficiales del servidor
      let montoTotalCalculado = 0;
      const detallesAInsertar: any[] = [];

      for (const item of detalles) {
        const producto = await trx('productos')
          .where({ id_producto: item.id_producto, estado: true })
          .forUpdate()
          .first();

        if (!producto) {
          throw new NotFoundException(
            `Producto con ID ${item.id_producto} no encontrado o está inactivo.`,
          );
        }

        const stockDisponible = Number(producto.stock_actual ?? 0);
        if (stockDisponible < item.cantidad) {
          throw new BadRequestException(
            `Stock insuficiente para el producto "${producto.nombre_producto}". Disponible: ${stockDisponible}, Solicitado: ${item.cantidad}`,
          );
        }

        const precioAplicado = Number(producto.precio ?? 0);
        const subtotal = Number((precioAplicado * item.cantidad).toFixed(2));
        montoTotalCalculado = Number(
          (montoTotalCalculado + subtotal).toFixed(2),
        );

        detallesAInsertar.push({
          id_producto: item.id_producto,
          cantidad: item.cantidad,
          precio_aplicado: precioAplicado,
          subtotal,
          nombre_producto: producto.nombre_producto,
        });
      }

      const montoDescuento = Number(ventaInfo.monto_descuento ?? 0);
      if (montoDescuento < 0 || montoDescuento > montoTotalCalculado) {
        throw new BadRequestException(
          `El descuento (${montoDescuento}) no puede ser negativo ni mayor al subtotal (${montoTotalCalculado}).`,
        );
      }
      montoTotalCalculado = Number(
        (montoTotalCalculado - montoDescuento).toFixed(2),
      );

      // 4. Gestión de método de pago y vuelto
      let montoEfectivo: number | null = null;
      let montoCambio: number | null = null;
      let estadoPago = ventaInfo.estado_pago || EstadoPagoVenta.PENDIENTE;

      if (ventaInfo.metodo_pago === MetodoPago.EFECTIVO) {
        if (
          ventaInfo.monto_efectivo === undefined ||
          ventaInfo.monto_efectivo === null
        ) {
          throw new BadRequestException(
            `Para pagos en Efectivo se debe especificar 'monto_efectivo'.`,
          );
        }
        if (ventaInfo.monto_efectivo < montoTotalCalculado) {
          throw new BadRequestException(
            `El monto en efectivo (${ventaInfo.monto_efectivo}) es menor al total de la venta (${montoTotalCalculado}).`,
          );
        }
        montoEfectivo = Number(ventaInfo.monto_efectivo);
        montoCambio = Number((montoEfectivo - montoTotalCalculado).toFixed(2));
        estadoPago = EstadoPagoVenta.PAGADO;
      } else {
        // En QR o Transferencia, si no se especifica, por defecto es Pendiente hasta confirmar comprobante
        if (!ventaInfo.estado_pago) {
          estadoPago = EstadoPagoVenta.PENDIENTE;
        }
      }

      // 5. Insertar venta maestra
      const [ventaInsertada] = await trx('ventas')
        .insert({
          id_usuario: ventaInfo.id_usuario,
          id_cliente: ventaInfo.id_cliente || null,
          fecha_hora: ventaInfo.fecha_hora
            ? new Date(ventaInfo.fecha_hora)
            : new Date(),
          tipo_venta: ventaInfo.tipo_venta,
          metodo_pago: ventaInfo.metodo_pago,
          monto_total: montoTotalCalculado,
          monto_descuento: montoDescuento,
          monto_efectivo: montoEfectivo,
          monto_cambio: montoCambio,
          estado_pago: estadoPago,
        })
        .returning('*');

      // 6. Insertar detalle de venta y descontar stock
      const detallesFinales: any[] = [];
      for (const d of detallesAInsertar) {
        const [detInsertado] = await trx('detalle_ventas')
          .insert({
            id_venta: ventaInsertada.id_venta,
            id_producto: d.id_producto,
            cantidad: d.cantidad,
            precio_aplicado: d.precio_aplicado,
            subtotal: d.subtotal,
          })
          .returning('*');

        // Descontar del stock
        await trx('productos')
          .where({ id_producto: d.id_producto })
          .decrement('stock_actual', d.cantidad);

        detallesFinales.push({
          ...detInsertado,
          precio_aplicado: Number(detInsertado.precio_aplicado),
          subtotal: Number(detInsertado.subtotal),
          nombre_producto: d.nombre_producto,
        });
      }

      return {
        ...this.parseVenta(ventaInsertada),
        detalles: detallesFinales,
      };
    });
  }

  async findAll(filtros?: {
    desde?: string;
    hasta?: string;
    id_usuario?: number;
    id_cliente?: number;
    estado_pago?: string;
    metodo_pago?: string;
  }): Promise<Venta[]> {
    const query = this.knex('ventas')
      .leftJoin('usuarios', 'ventas.id_usuario', 'usuarios.id_usuario')
      .leftJoin('clientes', 'ventas.id_cliente', 'clientes.id_cliente')
      .select(
        'ventas.*',
        'usuarios.nombre_completo as nombre_usuario',
        'clientes.razon_social_nombre as nombre_cliente',
        'clientes.nit_ci as nit_cliente',
        'clientes.tipo_cliente as tipo_cliente',
      )
      .orderBy('ventas.fecha_hora', 'desc');

    if (filtros?.desde) {
      query.where('ventas.fecha_hora', '>=', filtros.desde);
    }
    if (filtros?.hasta) {
      query.where('ventas.fecha_hora', '<=', filtros.hasta);
    }
    if (filtros?.id_usuario) {
      query.where('ventas.id_usuario', filtros.id_usuario);
    }
    if (filtros?.id_cliente) {
      query.where('ventas.id_cliente', filtros.id_cliente);
    }
    if (filtros?.estado_pago) {
      query.where('ventas.estado_pago', filtros.estado_pago);
    }
    if (filtros?.metodo_pago) {
      query.where('ventas.metodo_pago', filtros.metodo_pago);
    }

    const rows = await query;
    return rows.map((r) => this.parseVenta(r));
  }

  async findOne(id_venta: number): Promise<Venta> {
    const venta = await this.knex('ventas')
      .leftJoin('usuarios', 'ventas.id_usuario', 'usuarios.id_usuario')
      .leftJoin('clientes', 'ventas.id_cliente', 'clientes.id_cliente')
      .select(
        'ventas.*',
        'usuarios.nombre_completo as nombre_usuario',
        'clientes.razon_social_nombre as nombre_cliente',
        'clientes.nit_ci as nit_cliente',
        'clientes.tipo_cliente as tipo_cliente',
      )
      .where('ventas.id_venta', id_venta)
      .first();

    if (!venta) {
      throw new NotFoundException(`Venta con ID ${id_venta} no encontrada`);
    }

    const detalles = await this.knex('detalle_ventas')
      .leftJoin(
        'productos',
        'detalle_ventas.id_producto',
        'productos.id_producto',
      )
      .select(
        'detalle_ventas.*',
        'productos.nombre_producto',
        'productos.codigo_barras',
      )
      .where('detalle_ventas.id_venta', id_venta);

    return {
      ...this.parseVenta(venta),
      detalles: detalles.map((d) => ({
        ...d,
        precio_aplicado: Number(d.precio_aplicado),
        subtotal: Number(d.subtotal),
      })),
    };
  }

  async update(
    id_venta: number,
    updateVentaDto: UpdateVentaDto,
  ): Promise<Venta> {
    await this.knex.transaction(async (trx) => {
      const venta = await trx('ventas').where({ id_venta }).forUpdate().first();

      if (!venta) {
        throw new NotFoundException(`Venta con ID ${id_venta} no encontrada`);
      }

      if (venta.estado_pago === EstadoPagoVenta.ANULADO) {
        throw new BadRequestException(
          `La venta con ID ${id_venta} está anulada y no puede editarse. Registra una nueva venta si es necesario.`,
        );
      }

      if (updateVentaDto.estado_pago === EstadoPagoVenta.ANULADO) {
        throw new BadRequestException(
          'Para anular una venta usa la acción "Anular": el stock debe restituirse y no se hace desde la edición.',
        );
      }

      let clienteActualizado: any = null;
      if (
        updateVentaDto.id_cliente !== undefined &&
        updateVentaDto.id_cliente !== null
      ) {
        clienteActualizado = await trx('clientes')
          .where({ id_cliente: updateVentaDto.id_cliente, estado: true })
          .first();
        if (!clienteActualizado) {
          throw new BadRequestException(
            `El cliente con ID ${updateVentaDto.id_cliente} no existe o está inactivo.`,
          );
        }
      }

      // Una venta a crédito no puede quedar asociada a un cliente minorista,
      // general o sin cliente al momento de editarla.
      if (venta.tipo_venta === TipoVenta.CREDITO) {
        const idClienteFinal =
          updateVentaDto.id_cliente !== undefined
            ? updateVentaDto.id_cliente
            : venta.id_cliente;

        const clienteFinal =
          clienteActualizado ??
          (idClienteFinal != null
            ? await trx('clientes')
                .where({ id_cliente: idClienteFinal })
                .first()
            : null);

        this.validarCreditoMayorista(venta.tipo_venta, clienteFinal);
      }

      // Subtotal real de la venta a partir de sus líneas. Si no hay líneas
      // (datos históricos), se reconstruye desde el total y el descuento.
      const suma = await trx('detalle_ventas')
        .where({ id_venta })
        .sum({ subtotal: 'subtotal' })
        .first();
      let subtotal = Number(suma?.subtotal ?? 0);
      if (subtotal <= 0) {
        subtotal =
          Number(venta.monto_total ?? 0) + Number(venta.monto_descuento ?? 0);
      }
      subtotal = Number(subtotal.toFixed(2));

      const montoDescuento =
        updateVentaDto.monto_descuento !== undefined
          ? Number(updateVentaDto.monto_descuento)
          : Number(venta.monto_descuento ?? 0);

      if (montoDescuento > subtotal) {
        throw new BadRequestException(
          `El descuento (${montoDescuento}) no puede ser mayor al subtotal de la venta (${subtotal}).`,
        );
      }

      const montoTotal = Number((subtotal - montoDescuento).toFixed(2));

      let montoEfectivo: number | null = null;
      let montoCambio: number | null = null;

      if (venta.metodo_pago === MetodoPago.EFECTIVO) {
        if (updateVentaDto.monto_efectivo !== undefined) {
          montoEfectivo = Number(updateVentaDto.monto_efectivo);
        } else if (
          venta.monto_efectivo !== null &&
          venta.monto_efectivo !== undefined
        ) {
          montoEfectivo = Number(venta.monto_efectivo);
        }

        if (montoEfectivo === null) {
          throw new BadRequestException(
            'La venta en efectivo no tiene un monto entregado registrado.',
          );
        }

        if (montoEfectivo < montoTotal) {
          throw new BadRequestException(
            `El monto entregado (${montoEfectivo}) es menor al nuevo total de la venta (${montoTotal}).`,
          );
        }

        montoCambio = Number((montoEfectivo - montoTotal).toFixed(2));
      }

      const cambios: Record<string, unknown> = {
        monto_descuento: montoDescuento,
        monto_total: montoTotal,
        monto_efectivo: montoEfectivo,
        monto_cambio: montoCambio,
      };

      if (updateVentaDto.id_cliente !== undefined) {
        cambios.id_cliente = updateVentaDto.id_cliente;
      }
      if (updateVentaDto.estado_pago !== undefined) {
        cambios.estado_pago = updateVentaDto.estado_pago;
      }

      await trx('ventas').where({ id_venta }).update(cambios);
    });

    return this.findOne(id_venta);
  }

  async remove(id_venta: number): Promise<Venta> {
    return await this.knex.transaction(async (trx) => {
      const venta = await trx('ventas').where({ id_venta }).first();
      if (!venta) {
        throw new NotFoundException(`Venta con ID ${id_venta} no encontrada.`);
      }

      if (venta.estado_pago === EstadoPagoVenta.ANULADO) {
        throw new BadRequestException(
          `La venta con ID ${id_venta} ya ha sido anulada anteriormente.`,
        );
      }

      // 1. Soft delete: marcar estado_pago como Anulado
      await trx('ventas')
        .where({ id_venta })
        .update({ estado_pago: EstadoPagoVenta.ANULADO });

      // 2. Reponer el stock de los productos vendidos
      const detalles = await trx('detalle_ventas').where({ id_venta });
      for (const d of detalles) {
        await trx('productos')
          .where({ id_producto: d.id_producto })
          .increment('stock_actual', d.cantidad);
      }

      const ventaActualizada = await this.findOne(id_venta);
      return ventaActualizada;
    });
  }
}
