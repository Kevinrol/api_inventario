import { Cliente, TipoCliente } from '../../interfaces/cliente.interface';

export class ClienteEntity implements Cliente {
  id_cliente?: number;
  razon_social_nombre: string;
  nit_ci: string;
  telefono?: string | null;
  direccion?: string | null;
  tipo_cliente: TipoCliente | string;
  estado: boolean;
}
