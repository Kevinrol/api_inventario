export enum TipoCliente {
  MAYORISTA = 'Mayorista',
  MINORISTA = 'Minorista',
  GENERAL = 'General',
}

export interface Cliente {
  id_cliente?: number;
  razon_social_nombre: string;
  nit_ci: string;
  telefono?: string | null;
  direccion?: string | null;
  tipo_cliente: TipoCliente | string;
  estado: boolean;
}
