export enum EstadoPedido {
  PENDIENTE = 'Pendiente',
  ENVIADO = 'Enviado',
  PARCIAL = 'Parcial',
  RECIBIDO = 'Recibido',
  CANCELADO = 'Cancelado',
}

export interface DetallePedidoProveedor {
  id_detalle_pedido?: number;
  id_pedido?: number;
  id_producto: number;
  cantidad_solicitada: number;
  cantidad_recibida?: number;
  cantidad_pendiente?: number;
  unidad_venta: string;
  precio_unitario_compra: number;
  porcentaje_descuento?: number;
  subtotal: number;
  nombre_producto?: string;
}

export interface PedidoProveedor {
  id_pedido?: number;
  id_proveedor: number;
  id_usuario: number;
  fecha_pedido: string | Date;
  fecha_entrega_estimada?: string | Date | null;
  total_pedido: number;
  estado_pedido: EstadoPedido | string;
  comprobante_url?: string | null;
  detalles?: DetallePedidoProveedor[];
  razon_social_proveedor?: string;
  nombre_usuario?: string;
}
