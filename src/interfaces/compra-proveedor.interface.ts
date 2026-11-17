export enum EstadoCompra {
  COMPLETADA = 'Completada',
  ANULADA = 'Anulada',
}

export interface DetalleCompraProveedor {
  id_detalle_compra?: number;
  id_compra?: number;
  id_detalle_pedido?: number | null;
  id_producto: number;
  cantidad_recibida: number;
  unidad_compra?: string;
  factor_conversion?: number;
  unidades_totales?: number;
  precio_costo_unitario: number;
  subtotal: number;
  nombre_producto?: string;
  codigo_barras?: string | null;
  id_marca?: number | null;
  nombre_marca?: string | null;
  id_linea?: number | null;
  nombre_linea?: string | null;
}

export interface CompraProveedor {
  id_compra?: number;
  id_pedido?: number | null;
  id_proveedor: number;
  id_usuario: number;
  fecha_recepcion: string | Date;
  total_pagado: number;
  estado: EstadoCompra | string;
  comprobante_url?: string | null;
  detalles?: DetalleCompraProveedor[];
  razon_social_proveedor?: string;
  nit_proveedor?: string;
  nombre_usuario?: string;
}
