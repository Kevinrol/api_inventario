import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.provider';
import { EstadoPagoVenta } from '../interfaces/venta.interface';
import { EstadoCompra } from '../interfaces/compra-proveedor.interface';
import {
  EstadoStockReporte,
  ExistenciaProductoItem,
  ProductoFaltanteItem,
  ReporteAbastecimientoResponse,
  ReporteExistenciasResponse,
  ReporteVentasResponse,
  TopProductoItem,
} from '../interfaces/reporte.interface';

const SOLO_FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export interface FiltrosReporteVentas {
  desde?: string;
  hasta?: string;
  tipo_cliente?: string;
  metodo_pago?: string;
  estado_pago?: string;
}

export interface FiltrosReporteExistencias {
  desde?: string;
  hasta?: string;
  limit?: number;
  id_marca?: number;
  id_linea?: number;
}

export interface FiltrosReporteCompras {
  desde?: string;
  hasta?: string;
  id_proveedor?: number;
}

@Injectable()
export class ReportesService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  /**
   * Aplica un filtro de rango inclusivo sobre columnas timestamp.
   * Si `hasta` viene como 'YYYY-MM-DD', se compara contra `< diaSiguiente`
   * para incluir todas las transacciones ocurridas durante ese día.
   */
  private aplicarRangoFechas(
    query: Knex.QueryBuilder,
    columna: string,
    desde?: string,
    hasta?: string,
  ): void {
    const desdeLimpio = desde?.trim();
    const hastaLimpio = hasta?.trim();

    if (desdeLimpio) {
      query.where(columna, '>=', desdeLimpio);
    }

    if (hastaLimpio) {
      if (SOLO_FECHA_REGEX.test(hastaLimpio)) {
        const [anio, mes, dia] = hastaLimpio.split('-').map(Number);
        const siguienteDia = new Date(Date.UTC(anio, mes - 1, dia + 1))
          .toISOString()
          .slice(0, 10);
        query.where(columna, '<', siguienteDia);
      } else {
        query.where(columna, '<=', hastaLimpio);
      }
    }
  }

  private clasificarStock(
    stockActual: number,
    stockMinimo: number,
  ): EstadoStockReporte {
    if (stockActual <= 0) return 'AGOTADO';
    if (stockActual <= stockMinimo) return 'BAJO';
    return 'NORMAL';
  }

  async getVentasResumen(
    filtros: FiltrosReporteVentas = {},
  ): Promise<ReporteVentasResponse> {
    const { desde, hasta, tipo_cliente, metodo_pago, estado_pago } = filtros;

    const baseQuery = this.knex('ventas')
      .leftJoin('clientes', 'ventas.id_cliente', 'clientes.id_cliente')
      .whereNot('ventas.estado_pago', EstadoPagoVenta.ANULADO);

    this.aplicarRangoFechas(baseQuery, 'ventas.fecha_hora', desde, hasta);

    const tipoClienteLimpio = tipo_cliente?.trim();
    if (tipoClienteLimpio) {
      baseQuery.whereRaw("COALESCE(clientes.tipo_cliente, 'General') = ?", [
        tipoClienteLimpio,
      ]);
    }

    const metodoPagoLimpio = metodo_pago?.trim();
    if (metodoPagoLimpio) {
      baseQuery.where('ventas.metodo_pago', metodoPagoLimpio);
    }

    const estadoPagoLimpio = estado_pago?.trim();
    if (estadoPagoLimpio && estadoPagoLimpio !== EstadoPagoVenta.ANULADO) {
      baseQuery.where('ventas.estado_pago', estadoPagoLimpio);
    }

    // 1. Totales generales
    const totalRow = await baseQuery
      .clone()
      .sum('ventas.monto_total as total_recaudado')
      .sum('ventas.monto_descuento as total_descuentos')
      .count('ventas.id_venta as cantidad_ventas')
      .first();

    // 2. Desglose por método de pago
    const porMetodo = await baseQuery
      .clone()
      .select('ventas.metodo_pago')
      .sum('ventas.monto_total as total')
      .count('ventas.id_venta as cantidad')
      .groupBy('ventas.metodo_pago')
      .orderBy('total', 'desc');

    // 3. Desglose por vendedor / usuario
    const porVendedor = await baseQuery
      .clone()
      .join('usuarios', 'ventas.id_usuario', 'usuarios.id_usuario')
      .select('usuarios.id_usuario', 'usuarios.nombre_completo as vendedor')
      .sum('ventas.monto_total as total')
      .count('ventas.id_venta as cantidad')
      .groupBy('usuarios.id_usuario', 'usuarios.nombre_completo')
      .orderBy('total', 'desc');

    // 4. Desglose por tipo de cliente (incluye ventas sin cliente como 'General')
    const porTipoCliente = await baseQuery
      .clone()
      .select(
        this.knex.raw(
          "COALESCE(clientes.tipo_cliente, 'General') as tipo_cliente",
        ),
      )
      .sum('ventas.monto_total as total')
      .count('ventas.id_venta as cantidad')
      .groupByRaw("COALESCE(clientes.tipo_cliente, 'General')")
      .orderBy('total', 'desc');

    // 5. Listado detallado de ventas para tabla y exportación
    const ventasRows = await baseQuery
      .clone()
      .join('usuarios', 'ventas.id_usuario', 'usuarios.id_usuario')
      .select(
        'ventas.id_venta',
        'ventas.fecha_hora',
        'usuarios.nombre_completo as vendedor',
        this.knex.raw(
          "COALESCE(clientes.razon_social_nombre, 'Venta General') as cliente",
        ),
        'clientes.nit_ci as nit_cliente',
        this.knex.raw(
          "COALESCE(clientes.tipo_cliente, 'General') as tipo_cliente",
        ),
        'ventas.tipo_venta',
        'ventas.metodo_pago',
        'ventas.estado_pago',
        'ventas.monto_descuento',
        'ventas.monto_total',
      )
      .orderBy('ventas.fecha_hora', 'desc');

    const totalRecaudado = Number(totalRow?.total_recaudado ?? 0);
    const totalDescuentos = Number(totalRow?.total_descuentos ?? 0);
    const cantidadVentas = Number(totalRow?.cantidad_ventas ?? 0);
    const ticketPromedio =
      cantidadVentas > 0
        ? Number((totalRecaudado / cantidadVentas).toFixed(2))
        : 0;

    return {
      total_recaudado: totalRecaudado,
      total_descuentos: totalDescuentos,
      cantidad_ventas: cantidadVentas,
      ticket_promedio: ticketPromedio,
      por_metodo_pago: porMetodo.map((m: any) => ({
        metodo_pago: m.metodo_pago,
        total: Number(m.total ?? 0),
        cantidad: Number(m.cantidad ?? 0),
      })),
      por_vendedor: porVendedor.map((v: any) => ({
        id_usuario: Number(v.id_usuario),
        vendedor: v.vendedor,
        total: Number(v.total ?? 0),
        cantidad: Number(v.cantidad ?? 0),
      })),
      por_tipo_cliente: porTipoCliente.map((t: any) => ({
        tipo_cliente: t.tipo_cliente,
        total: Number(t.total ?? 0),
        cantidad: Number(t.cantidad ?? 0),
      })),
      ventas: ventasRows.map((v: any) => ({
        id_venta: Number(v.id_venta),
        fecha_hora: v.fecha_hora,
        vendedor: v.vendedor,
        cliente: v.cliente,
        nit_cliente: v.nit_cliente ?? null,
        tipo_cliente: v.tipo_cliente,
        tipo_venta: v.tipo_venta,
        metodo_pago: v.metodo_pago,
        estado_pago: v.estado_pago,
        monto_descuento: Number(v.monto_descuento ?? 0),
        monto_total: Number(v.monto_total ?? 0),
      })),
    };
  }

  async getTopProductos(
    limit = 10,
    desde?: string,
    hasta?: string,
  ): Promise<TopProductoItem[]> {
    const limiteSeguro = Number.isFinite(limit) && limit > 0 ? limit : 10;

    const query = this.knex('detalle_ventas')
      .join('ventas', 'detalle_ventas.id_venta', 'ventas.id_venta')
      .join('productos', 'detalle_ventas.id_producto', 'productos.id_producto')
      .leftJoin('marcas', 'productos.id_marca', 'marcas.id_marca')
      .leftJoin(
        'lineas_productos',
        'productos.id_linea',
        'lineas_productos.id_linea',
      )
      .whereNot('ventas.estado_pago', EstadoPagoVenta.ANULADO)
      .select(
        'productos.id_producto',
        'productos.nombre_producto',
        'productos.codigo_barras',
        'productos.stock_actual',
        'marcas.nombre_marca',
        'lineas_productos.nombre_linea',
      )
      .sum('detalle_ventas.cantidad as unidades_vendidas')
      .sum('detalle_ventas.subtotal as total_generado')
      .groupBy(
        'productos.id_producto',
        'productos.nombre_producto',
        'productos.codigo_barras',
        'productos.stock_actual',
        'marcas.nombre_marca',
        'lineas_productos.nombre_linea',
      )
      .orderBy('unidades_vendidas', 'desc')
      .limit(limiteSeguro);

    this.aplicarRangoFechas(query, 'ventas.fecha_hora', desde, hasta);

    const rows = await query;
    return rows.map((r: any) => ({
      id_producto: Number(r.id_producto),
      nombre_producto: r.nombre_producto,
      codigo_barras: r.codigo_barras ?? null,
      nombre_marca: r.nombre_marca ?? null,
      nombre_linea: r.nombre_linea ?? null,
      stock_actual: Number(r.stock_actual ?? 0),
      unidades_vendidas: Number(r.unidades_vendidas ?? 0),
      total_generado: Number(r.total_generado ?? 0),
    }));
  }

  async getExistencias(
    filtros: FiltrosReporteExistencias = {},
  ): Promise<ReporteExistenciasResponse> {
    const { desde, hasta, limit = 15, id_marca, id_linea } = filtros;

    const productosQuery = this.knex('productos')
      .leftJoin('marcas', 'productos.id_marca', 'marcas.id_marca')
      .leftJoin(
        'lineas_productos',
        'productos.id_linea',
        'lineas_productos.id_linea',
      )
      .where('productos.estado', true)
      .select(
        'productos.id_producto',
        'productos.codigo_barras',
        'productos.nombre_producto',
        'productos.stock_actual',
        'productos.stock_minimo',
        'productos.precio',
        'productos.precio_compra',
        'marcas.nombre_marca',
        'lineas_productos.nombre_linea',
      )
      .orderBy('productos.nombre_producto', 'asc');

    if (id_marca) {
      productosQuery.where('productos.id_marca', id_marca);
    }
    if (id_linea) {
      productosQuery.where('productos.id_linea', id_linea);
    }

    const [productosRows, masVendidos] = await Promise.all([
      productosQuery,
      this.getTopProductos(limit, desde, hasta),
    ]);

    const existencias: ExistenciaProductoItem[] = productosRows.map((p: any) => {
      const stockActual = Number(p.stock_actual ?? 0);
      const stockMinimo = Number(p.stock_minimo ?? 0);
      const precio = Number(p.precio ?? 0);
      const precioCompra = Number(p.precio_compra ?? 0);

      return {
        id_producto: Number(p.id_producto),
        codigo_barras: p.codigo_barras ?? null,
        nombre_producto: p.nombre_producto,
        nombre_marca: p.nombre_marca ?? null,
        nombre_linea: p.nombre_linea ?? null,
        stock_actual: stockActual,
        stock_minimo: stockMinimo,
        precio,
        precio_compra: precioCompra,
        valor_total: Number((stockActual * precio).toFixed(2)),
        estado_stock: this.clasificarStock(stockActual, stockMinimo),
      };
    });

    const faltantes: ProductoFaltanteItem[] = existencias
      .filter((p) => p.stock_actual <= p.stock_minimo)
      .sort((a, b) => a.stock_actual - b.stock_actual)
      .map((p) => ({
        ...p,
        deficit: Math.max(0, p.stock_minimo - p.stock_actual),
      }));

    const unidadesTotales = existencias.reduce(
      (acc, p) => acc + p.stock_actual,
      0,
    );
    const valorStockVenta = Number(
      existencias.reduce((acc, p) => acc + p.valor_total, 0).toFixed(2),
    );
    const valorStockCosto = Number(
      existencias
        .reduce((acc, p) => acc + p.stock_actual * p.precio_compra, 0)
        .toFixed(2),
    );
    const cantidadAgotados = existencias.filter(
      (p) => p.estado_stock === 'AGOTADO',
    ).length;

    return {
      resumen: {
        total_productos: existencias.length,
        unidades_totales: unidadesTotales,
        valor_stock_venta: valorStockVenta,
        valor_stock_costo: valorStockCosto,
        cantidad_bajo_stock: faltantes.length,
        cantidad_agotados: cantidadAgotados,
      },
      existencias,
      mas_vendidos: masVendidos,
      faltantes,
    };
  }

  async getComprasResumen(
    filtros: FiltrosReporteCompras = {},
  ): Promise<ReporteAbastecimientoResponse> {
    const { desde, hasta, id_proveedor } = filtros;

    const baseQuery = this.knex('compras_proveedores').whereNot(
      'compras_proveedores.estado',
      EstadoCompra.ANULADA,
    );

    this.aplicarRangoFechas(
      baseQuery,
      'compras_proveedores.fecha_recepcion',
      desde,
      hasta,
    );

    if (id_proveedor) {
      baseQuery.where('compras_proveedores.id_proveedor', id_proveedor);
    }

    const totalRow = await baseQuery
      .clone()
      .sum('compras_proveedores.total_pagado as total_invertido')
      .count('compras_proveedores.id_compra as cantidad_compras')
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
        'proveedores.nit',
      )
      .sum('compras_proveedores.total_pagado as total')
      .count('compras_proveedores.id_compra as cantidad')
      .groupBy(
        'proveedores.id_proveedor',
        'proveedores.razon_social',
        'proveedores.nit',
      )
      .orderBy('total', 'desc');

    const comprasRows = await baseQuery
      .clone()
      .join(
        'proveedores',
        'compras_proveedores.id_proveedor',
        'proveedores.id_proveedor',
      )
      .join('usuarios', 'compras_proveedores.id_usuario', 'usuarios.id_usuario')
      .leftJoin(
        'detalle_compras_proveedores as det',
        'compras_proveedores.id_compra',
        'det.id_compra',
      )
      .select(
        'compras_proveedores.id_compra',
        'compras_proveedores.id_pedido',
        'compras_proveedores.fecha_recepcion',
        'proveedores.id_proveedor',
        'proveedores.razon_social as proveedor',
        'proveedores.nit as nit_proveedor',
        'usuarios.nombre_completo as receptor',
        'compras_proveedores.total_pagado',
        'compras_proveedores.estado',
      )
      .count('det.id_detalle_compra as items')
      .select(
        this.knex.raw(
          'COALESCE(SUM(COALESCE(det.unidades_totales, det.cantidad_recibida)), 0) as unidades_totales',
        ),
      )
      .groupBy(
        'compras_proveedores.id_compra',
        'compras_proveedores.id_pedido',
        'compras_proveedores.fecha_recepcion',
        'proveedores.id_proveedor',
        'proveedores.razon_social',
        'proveedores.nit',
        'usuarios.nombre_completo',
        'compras_proveedores.total_pagado',
        'compras_proveedores.estado',
      )
      .orderBy('compras_proveedores.fecha_recepcion', 'desc');

    const compras = comprasRows.map((c: any) => ({
      id_compra: Number(c.id_compra),
      id_pedido: c.id_pedido != null ? Number(c.id_pedido) : null,
      fecha_recepcion: c.fecha_recepcion,
      id_proveedor: Number(c.id_proveedor),
      proveedor: c.proveedor,
      nit_proveedor: c.nit_proveedor ?? null,
      receptor: c.receptor,
      items: Number(c.items ?? 0),
      unidades_totales: Number(c.unidades_totales ?? 0),
      total_pagado: Number(c.total_pagado ?? 0),
      estado: c.estado,
    }));

    const totalUnidadesIngresadas = compras.reduce(
      (acc, c) => acc + c.unidades_totales,
      0,
    );

    return {
      total_invertido: Number(totalRow?.total_invertido ?? 0),
      cantidad_compras: Number(totalRow?.cantidad_compras ?? 0),
      total_unidades_ingresadas: totalUnidadesIngresadas,
      por_proveedor: porProveedor.map((p: any) => ({
        id_proveedor: Number(p.id_proveedor),
        proveedor: p.proveedor,
        nit: p.nit ?? null,
        total: Number(p.total ?? 0),
        cantidad: Number(p.cantidad ?? 0),
      })),
      compras,
    };
  }
}
