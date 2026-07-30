enum Roles {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  EMPLEADO = 'empleado' 
}
export interface Rol{
  id_rol : number;
  nombre_rol : Roles;
}