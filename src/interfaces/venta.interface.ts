export enum TipoVenta {
  CONTADO = 'Contado',
  CREDITO = 'Credito',
}

export enum MetodoPago {
  EFECTIVO = 'Efectivo',
  QR = 'QR',
  TRANSFERENCIA = 'Transferencia',
}

export enum EstadoPagoVenta {
  PAGADO = 'Pagado',
  PENDIENTE = 'Pendiente',
  ANULADO = 'Anulado',
}

export interface DetalleVenta {
  id_detalle_venta?: number;
  id_venta?: number;
  id_producto: number;
  cantidad: number;
  precio_aplicado: number;
  subtotal: number;
  nombre_producto?: string;
  codigo_barras?: string;
}

export interface Venta {
  id_venta?: number;
  id_usuario: number;
  id_cliente?: number | null;
  fecha_hora: string | Date;
  tipo_venta: TipoVenta | string;
  metodo_pago: MetodoPago | string;
  monto_total: number;
  monto_descuento?: number;
  monto_efectivo?: number | null;
  monto_cambio?: number | null;
  estado_pago: EstadoPagoVenta | string;
  detalles?: DetalleVenta[];
  nombre_usuario?: string;
  nombre_cliente?: string;
  nit_cliente?: string;
  tipo_cliente?: string;
}
