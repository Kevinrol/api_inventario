import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateLineasProductoDto } from './dto/create-lineas-producto.dto';
import { UpdateLineasProductoDto } from './dto/update-lineas-producto.dto';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.provider';
import { LineasProducto } from './entities/lineas-producto.entity';

@Injectable()
export class LineasProductosService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async create(createLineasProductoDto: CreateLineasProductoDto): Promise<LineasProducto> {
    try {
      const [inserted] = await this.knex('lineas_productos').insert(createLineasProductoDto).returning('*');
      return inserted;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException(`La línea de producto '${createLineasProductoDto.nombre_linea}' ya existe.`);
      }
      throw error;
    }
  }

  async findAll(): Promise<LineasProducto[]> {
    return this.knex<LineasProducto>('lineas_productos').select('*');
  }

  async findOne(id_linea: number): Promise<LineasProducto> {
    const linea = await this.knex<LineasProducto>('lineas_productos').where({ id_linea }).first();
    if (!linea) throw new NotFoundException(`Línea con ID ${id_linea} no encontrada`);
    return linea;
  }

  async update(id_linea: number, updateLineasProductoDto: UpdateLineasProductoDto): Promise<LineasProducto> {
    const linea = await this.findOne(id_linea);
    if (!linea) throw new NotFoundException(`Línea con ID ${id_linea} no encontrada`);
    
    try {
      const [updated] = await this.knex('lineas_productos')
        .where({ id_linea })
        .update(updateLineasProductoDto)
        .returning('*');
      return updated;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException(`La línea de producto '${updateLineasProductoDto.nombre_linea}' ya existe.`);
      }
      throw error;
    }
  }

  async remove(id_linea: number): Promise<void> {
    const linea = await this.findOne(id_linea);
    if (!linea) throw new NotFoundException(`Línea con ID ${id_linea} no encontrada`);
    await this.knex('lineas_productos').where({ id_linea }).delete();
  }
}
