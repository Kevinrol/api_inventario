export enum EstadoProveedor {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo'
}

export interface Proveedor {
  id_proveedor?: number;
  nit: string;
  razon_social: string;
  nombre_contacto?: string | null;
  telefono_contacto?: string | null;
  ciudad?: string | null;
  lineas_productos?: string[];
  marcas?: string[];
  estado: boolean;
}