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

export type UsuarioAutenticado = Omit<Usuario, 'password_hash'> & {
  id_usuario: number;
};

export interface LoginRequest {
  username: string;
  password: string;
}

export interface JwtPayload {
  sub: number;
  username: string;
  rol: RolUsuario;
  iat: number;
  exp: number;
}

export interface LoginResponse {
  access_token: string;
  usuario: UsuarioAutenticado;
}
