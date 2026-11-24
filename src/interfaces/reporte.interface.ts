export interface ResumenPorMetodoPago {
  metodo_pago: string;
  total: number;
  cantidad: number;
}

export interface ResumenPorVendedor {
  id_usuario: number;
  vendedor: string;
  total: number;
  cantidad: number;
}

export interface ResumenPorTipoCliente {
  tipo_cliente: string;
  total: number;
  cantidad: number;
}

export interface VentaReporteItem {
  id_venta: number;
  fecha_hora: string | Date;
  vendedor: string;
  cliente: string;
  nit_cliente: string | null;
  tipo_cliente: string;
  tipo_venta: string;
  metodo_pago: string;
  estado_pago: string;
  monto_descuento: number;
  monto_total: number;
}

export interface ReporteVentasResponse {
  total_recaudado: number;
  total_descuentos: number;
  cantidad_ventas: number;
  ticket_promedio: number;
  por_metodo_pago: ResumenPorMetodoPago[];
  por_vendedor: ResumenPorVendedor[];
  por_tipo_cliente: ResumenPorTipoCliente[];
  ventas: VentaReporteItem[];
}

export interface TopProductoItem {
  id_producto: number;
  nombre_producto: string;
  codigo_barras: string | null;
  nombre_marca: string | null;
  nombre_linea: string | null;
  stock_actual: number;
  unidades_vendidas: number;
  total_generado: number;
}

export type EstadoStockReporte = 'AGOTADO' | 'BAJO' | 'NORMAL';

export interface ExistenciaProductoItem {
  id_producto: number;
  codigo_barras: string | null;
  nombre_producto: string;
  nombre_marca: string | null;
  nombre_linea: string | null;
  stock_actual: number;
  stock_minimo: number;
  precio: number;
  precio_compra: number;
  valor_total: number;
  estado_stock: EstadoStockReporte;
}

export interface ProductoFaltanteItem extends ExistenciaProductoItem {
  deficit: number;
}

export interface ReporteExistenciasResumen {
  total_productos: number;
  unidades_totales: number;
  valor_stock_venta: number;
  valor_stock_costo: number;
  cantidad_bajo_stock: number;
  cantidad_agotados: number;
}

export interface ReporteExistenciasResponse {
  resumen: ReporteExistenciasResumen;
  existencias: ExistenciaProductoItem[];
  mas_vendidos: TopProductoItem[];
  faltantes: ProductoFaltanteItem[];
}

export interface ResumenPorProveedor {
  id_proveedor: number;
  proveedor: string;
  nit: string | null;
  total: number;
  cantidad: number;
}

export interface CompraReporteItem {
  id_compra: number;
  id_pedido: number | null;
  fecha_recepcion: string | Date;
  id_proveedor: number;
  proveedor: string;
  nit_proveedor: string | null;
  receptor: string;
  items: number;
  unidades_totales: number;
  total_pagado: number;
  estado: string;
}

export interface ReporteAbastecimientoResponse {
  total_invertido: number;
  cantidad_compras: number;
  total_unidades_ingresadas: number;
  por_proveedor: ResumenPorProveedor[];
  compras: CompraReporteItem[];
}
