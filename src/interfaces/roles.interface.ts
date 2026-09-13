export enum RolNombre {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  EMPLEADO = 'empleado',
}

export interface Rol {
  id?: number;
  nombre: string | RolNombre;
}