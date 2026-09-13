import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { UpdateMarcaDto } from './dto/update-marca.dto';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.provider';
import { Marca } from './entities/marca.entity';

@Injectable()
export class MarcasService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async create(createMarcaDto: CreateMarcaDto): Promise<Marca> {
    try {
      const [inserted] = await this.knex('marcas').insert(createMarcaDto).returning('*');
      return inserted;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException(`La marca '${createMarcaDto.nombre_marca}' ya existe.`);
      }
      throw error;
    }
  }

  async findAll(): Promise<Marca[]> {
    return this.knex<Marca>('marcas').select('*');
  }

  async findOne(id_marca: number): Promise<Marca> {
    const marca = await this.knex<Marca>('marcas').where({ id_marca }).first();
    if (!marca) throw new NotFoundException(`Marca con ID ${id_marca} no encontrada`);
    return marca;
  }

  async update(id_marca: number, updateMarcaDto: UpdateMarcaDto): Promise<Marca> {
    const marca = await this.findOne(id_marca);
    if (!marca) throw new NotFoundException(`Marca con ID ${id_marca} no encontrada`);
    
    try {
      const [updated] = await this.knex('marcas')
        .where({ id_marca })
        .update(updateMarcaDto)
        .returning('*');
      return updated;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException(`La marca '${updateMarcaDto.nombre_marca}' ya existe.`);
      }
      throw error;
    }
  }

  async remove(id_marca: number): Promise<void> {
    const marca = await this.findOne(id_marca);
    if (!marca) throw new NotFoundException(`Marca con ID ${id_marca} no encontrada`);
    await this.knex('marcas').where({ id_marca }).delete();
  }
}
