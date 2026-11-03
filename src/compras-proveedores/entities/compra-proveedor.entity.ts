import {
  CompraProveedor,
  DetalleCompraProveedor,
  EstadoCompra,
} from '../../interfaces/compra-proveedor.interface';

export class CompraProveedorEntity implements CompraProveedor {
  id_compra?: number;
  id_pedido?: number | null;
  id_proveedor: number;
  id_usuario: number;
  fecha_recepcion: string | Date;
  total_pagado: number;
  estado: EstadoCompra | string;
  detalles?: DetalleCompraProveedor[];
  razon_social_proveedor?: string;
  nombre_usuario?: string;
}
