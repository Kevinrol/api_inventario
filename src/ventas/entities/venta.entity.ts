import {
  Venta,
  DetalleVenta,
  TipoVenta,
  MetodoPago,
  EstadoPagoVenta,
} from '../../interfaces/venta.interface';

export class VentaEntity implements Venta {
  id_venta?: number;
  id_usuario: number;
  id_cliente?: number | null;
  fecha_hora: string | Date;
  tipo_venta: TipoVenta | string;
  metodo_pago: MetodoPago | string;
  monto_total: number;
  monto_efectivo?: number | null;
  monto_cambio?: number | null;
  estado_pago: EstadoPagoVenta | string;
  detalles?: DetalleVenta[];
  nombre_usuario?: string;
  nombre_cliente?: string;
}
