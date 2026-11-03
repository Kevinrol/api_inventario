import { Producto as IProducto } from '../../interfaces/producto.interface';

export class Producto implements IProducto {
  id_producto: number;
  codigo_barras?: string | null;
  nombre_producto: string;
  id_marca?: number | null;
  id_linea?: number | null;
  precio: number;
  stock_actual: number;
  stock_minimo: number;
  estado: boolean;
  nombre_marca?: string | null;
  nombre_linea?: string | null;
}
