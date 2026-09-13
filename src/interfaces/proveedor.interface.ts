export enum EstadoProveedor {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo'
}

export interface Proveedor {
  id?: number;
  nit: string;
  nombre: string;
  razon_social: string;
  telefono_contacto?: string | null;
  linea_productos?: string | null;
  tipo_pago?: string | null;
  estado?: string | EstadoProveedor | null;
}