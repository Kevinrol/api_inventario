import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.provider';
import { Producto } from './entities/producto.entity';

@Injectable()
export class ProductosService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async create(createProductoDto: CreateProductoDto): Promise<Producto> {
    try {
      const [inserted] = await this.knex('productos').insert(createProductoDto).returning('*');
      return inserted;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException(`El producto ya existe (código de barras duplicado).`);
      }
      throw error;
    }
  }

  async findAll(): Promise<Producto[]> {
    return this.knex<Producto>('productos').select('*');
  }

  async findOne(id_producto: number): Promise<Producto> {
    const producto = await this.knex<Producto>('productos').where({ id_producto }).first();
    if (!producto) throw new NotFoundException(`Producto con ID ${id_producto} no encontrado`);
    return producto;
  }

  async update(id_producto: number, updateProductoDto: UpdateProductoDto): Promise<Producto> {
    const producto = await this.findOne(id_producto);
    if (!producto) throw new NotFoundException(`Producto con ID ${id_producto} no encontrado`);
    
    try {
      const [updated] = await this.knex('productos')
        .where({ id_producto })
        .update(updateProductoDto)
        .returning('*');
      return updated;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException(`Conflicto de unicidad (código de barras duplicado).`);
      }
      throw error;
    }
  }

  async remove(id_producto: number): Promise<void> {
    const producto = await this.findOne(id_producto);
    if (!producto) throw new NotFoundException(`Producto con ID ${id_producto} no encontrado`);
    await this.knex('productos').where({ id_producto }).delete();
  }
}
