export interface Usuario {
  id?: number;
  rol_id: number;
  nombre: string;
  contrasena_hash: string;
  turno?: string | null;
  estado?: string | null;
  fecha_registro?: Date | string | null;
  registrado_por?: number | null;
}
