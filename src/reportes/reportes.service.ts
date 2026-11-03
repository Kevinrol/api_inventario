import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.provider';
import { EstadoPagoVenta } from '../interfaces/venta.interface';
import { EstadoCompra } from '../interfaces/compra-proveedor.interface';

@Injectable()
export class ReportesService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async getVentasResumen(desde?: string, hasta?: string) {
    const baseQuery = this.knex('ventas').whereNot(
      'estado_pago',
      EstadoPagoVenta.ANULADO,
    );

    if (desde) baseQuery.where('fecha_hora', '>=', desde);
    if (hasta) baseQuery.where('fecha_hora', '<=', hasta);

    // 1. Totales generales
    const totalRow = await baseQuery
      .clone()
      .sum('monto_total as total_recaudado')
      .count('id_venta as cantidad_ventas')
      .first();

    // 2. Desglose por método de pago
    const porMetodo = await baseQuery
      .clone()
      .select('metodo_pago')
      .sum('monto_total as total')
      .count('id_venta as cantidad')
      .groupBy('metodo_pago');

    // 3. Desglose por vendedor / usuario
    const porVendedor = await baseQuery
      .clone()
      .join('usuarios', 'ventas.id_usuario', 'usuarios.id_usuario')
      .select('usuarios.id_usuario', 'usuarios.nombre_completo as vendedor')
      .sum('ventas.monto_total as total')
      .count('ventas.id_venta as cantidad')
      .groupBy('usuarios.id_usuario', 'usuarios.nombre_completo')
      .orderBy('total', 'desc');

    return {
      total_recaudado: Number(totalRow?.total_recaudado ?? 0),
      cantidad_ventas: Number(totalRow?.cantidad_ventas ?? 0),
      por_metodo_pago: porMetodo.map((m: any) => ({
        metodo_pago: m.metodo_pago,
        total: Number(m.total ?? 0),
        cantidad: Number(m.cantidad ?? 0),
      })),
      por_vendedor: porVendedor.map((v: any) => ({
        id_usuario: v.id_usuario,
        vendedor: v.vendedor,
        total: Number(v.total ?? 0),
        cantidad: Number(v.cantidad ?? 0),
      })),
    };
  }

  async getTopProductos(limit = 10, desde?: string, hasta?: string) {
    const query = this.knex('detalle_ventas')
      .join('ventas', 'detalle_ventas.id_venta', 'ventas.id_venta')
      .join('productos', 'detalle_ventas.id_producto', 'productos.id_producto')
      .whereNot('ventas.estado_pago', EstadoPagoVenta.ANULADO)
      .select(
        'productos.id_producto',
        'productos.nombre_producto',
        'productos.codigo_barras',
      )
      .sum('detalle_ventas.cantidad as unidades_vendidas')
      .sum('detalle_ventas.subtotal as total_generado')
      .groupBy(
        'productos.id_producto',
        'productos.nombre_producto',
        'productos.codigo_barras',
      )
      .orderBy('unidades_vendidas', 'desc')
      .limit(limit);

    if (desde) query.where('ventas.fecha_hora', '>=', desde);
    if (hasta) query.where('ventas.fecha_hora', '<=', hasta);

    const rows = await query;
    return rows.map((r: any) => ({
      id_producto: r.id_producto,
      nombre_producto: r.nombre_producto,
      codigo_barras: r.codigo_barras,
      unidades_vendidas: Number(r.unidades_vendidas ?? 0),
      total_generado: Number(r.total_generado ?? 0),
    }));
  }

  async getComprasResumen(desde?: string, hasta?: string) {
    const baseQuery = this.knex('compras_proveedores').whereNot(
      'estado',
      EstadoCompra.ANULADA,
    );

    if (desde) baseQuery.where('fecha_recepcion', '>=', desde);
    if (hasta) baseQuery.where('fecha_recepcion', '<=', hasta);

    const totalRow = await baseQuery
      .clone()
      .sum('total_pagado as total_invertido')
      .count('id_compra as cantidad_compras')
      .first();

    const porProveedor = await baseQuery
      .clone()
      .join(
        'proveedores',
        'compras_proveedores.id_proveedor',
        'proveedores.id_proveedor',
      )
      .select(
        'proveedores.id_proveedor',
        'proveedores.razon_social as proveedor',
      )
      .sum('compras_proveedores.total_pagado as total')
      .count('compras_proveedores.id_compra as cantidad')
      .groupBy('proveedores.id_proveedor', 'proveedores.razon_social')
      .orderBy('total', 'desc');

    return {
      total_invertido: Number(totalRow?.total_invertido ?? 0),
      cantidad_compras: Number(totalRow?.cantidad_compras ?? 0),
      por_proveedor: porProveedor.map((p: any) => ({
        id_proveedor: p.id_proveedor,
        proveedor: p.proveedor,
        total: Number(p.total ?? 0),
        cantidad: Number(p.cantidad ?? 0),
      })),
    };
  }
}
