export interface ProductoUnidad {
  id_unidad_producto: number;
  id_producto: number;
  nombre_unidad: string;
  cantidad_unidades: number;
  es_editable: boolean;
}

export interface Producto {
  id_producto: number;
  codigo_barras?: string | null;
  nombre_producto: string;
  id_marca?: number | null;
  id_linea?: number | null;
  precio: number;
  precio_compra?: number;
  stock_actual: number;
  stock_minimo: number;
  estado: boolean;
  nombre_marca?: string | null;
  nombre_linea?: string | null;
  unidades?: ProductoUnidad[];
}
