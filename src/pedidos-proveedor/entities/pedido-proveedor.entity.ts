import {
  PedidoProveedor,
  DetallePedidoProveedor,
  EstadoPedido,
} from '../../interfaces/pedido-proveedor.interface';

export class PedidoProveedorEntity implements PedidoProveedor {
  id_pedido?: number;
  id_proveedor: number;
  id_usuario: number;
  fecha_pedido: string | Date;
  fecha_entrega_estimada?: string | Date | null;
  total_pedido: number;
  estado_pedido: EstadoPedido | string;
  detalles?: DetallePedidoProveedor[];
  razon_social_proveedor?: string;
  nombre_usuario?: string;
}
