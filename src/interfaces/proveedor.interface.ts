export enum EstadoProveedor {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo'
}

export interface Proveedor {
  id?: number;
  nombre?: string | null;
  nit: string;
  razon_social: string;
  telefono_contacto?: string | null;
  empresa?: string | null;
  tipo_pago?: string | null;
  estado?: string | EstadoProveedor | null;
}