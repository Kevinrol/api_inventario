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
  precio_costo_unitario: number;
  subtotal: number;
  nombre_producto?: string;
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
  nombre_usuario?: string;
}
