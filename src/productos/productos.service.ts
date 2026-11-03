import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.provider';
import { Producto } from '../interfaces/producto.interface';

@Injectable()
export class ProductosService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  private parseProducto(row: any): Producto {
    if (!row) return row;
    return {
      ...row,
      precio: Number(row.precio ?? 0),
      stock_actual: Number(row.stock_actual ?? 0),
      stock_minimo: Number(row.stock_minimo ?? 0),
    };
  }

  async create(createProductoDto: CreateProductoDto): Promise<Producto> {
    try {
      const [inserted] = await this.knex('productos')
        .insert(createProductoDto)
        .returning('*');
      return (
        (await this.findOne(inserted.id_producto)) ||
        this.parseProducto(inserted)
      );
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException(
          `El producto ya existe (código de barras duplicado).`,
        );
      }
      throw error;
    }
  }

  async findAll(
    incluirInactivos = false,
    codigo_barras?: string,
  ): Promise<Producto[]> {
    const query = this.knex('productos')
      .leftJoin('marcas', 'productos.id_marca', 'marcas.id_marca')
      .leftJoin(
        'lineas_productos',
        'productos.id_linea',
        'lineas_productos.id_linea',
      )
      .select(
        'productos.*',
        'marcas.nombre_marca',
        'lineas_productos.nombre_linea',
      )
      .orderBy('productos.id_producto', 'desc');

    if (!incluirInactivos) {
      query.where('productos.estado', true);
    }
    if (codigo_barras) {
      query.where('productos.codigo_barras', codigo_barras);
    }

    const rows = await query;
    return rows.map((r) => this.parseProducto(r));
  }

  async getBajoStock(): Promise<Producto[]> {
    const rows = await this.knex('productos')
      .leftJoin('marcas', 'productos.id_marca', 'marcas.id_marca')
      .leftJoin(
        'lineas_productos',
        'productos.id_linea',
        'lineas_productos.id_linea',
      )
      .select(
        'productos.*',
        'marcas.nombre_marca',
        'lineas_productos.nombre_linea',
      )
      .where('productos.estado', true)
      .andWhereRaw('productos.stock_actual <= productos.stock_minimo')
      .orderBy('productos.stock_actual', 'asc');

    return rows.map((r) => this.parseProducto(r));
  }

  async findOne(id_producto: number): Promise<Producto> {
    const row = await this.knex('productos')
      .leftJoin('marcas', 'productos.id_marca', 'marcas.id_marca')
      .leftJoin(
        'lineas_productos',
        'productos.id_linea',
        'lineas_productos.id_linea',
      )
      .select(
        'productos.*',
        'marcas.nombre_marca',
        'lineas_productos.nombre_linea',
      )
      .where('productos.id_producto', id_producto)
      .first();

    if (!row)
      throw new NotFoundException(
        `Producto con ID ${id_producto} no encontrado`,
      );
    return this.parseProducto(row);
  }

  async update(
    id_producto: number,
    updateProductoDto: UpdateProductoDto,
  ): Promise<Producto> {
    await this.findOne(id_producto);

    try {
      await this.knex('productos')
        .where({ id_producto })
        .update(updateProductoDto);

      return this.findOne(id_producto);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException(
          `Conflicto de unicidad (código de barras duplicado).`,
        );
      }
      throw error;
    }
  }

  async remove(id_producto: number): Promise<Producto> {
    const producto = await this.findOne(id_producto);
    await this.knex('productos')
      .where({ id_producto })
      .update({ estado: false });
    return { ...producto, estado: false };
  }
}
