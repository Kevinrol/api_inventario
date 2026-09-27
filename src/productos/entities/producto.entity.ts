export class Producto {
  id_producto: number;
  codigo_barras?: string;
  nombre_producto: string;
  id_marca?: number;
  id_linea?: number;
  precio_minorista: number;
  precio_mayorista: number;
  stock_actual: number;
  stock_minimo: number;
  estado: boolean;
}
