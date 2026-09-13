export enum RolUsuario {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  VENDEDOR = 'VENDEDOR',
}

export enum TurnoUsuario {
  MANANA = 'mañana',
  TARDE = 'tarde',
  TIEMPO_COMPLETO = 'tiempo_completo',
}

export interface Usuario {
  id_usuario?: number;
  nombre_completo: string;
  username: string;
  password_hash: string;
  rol: RolUsuario;
  turno?: TurnoUsuario;
  estado: boolean;
}
