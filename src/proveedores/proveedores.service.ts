import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateProveedoreDto } from './dto/create-proveedore.dto';
import { UpdateProveedoreDto } from './dto/update-proveedore.dto';
import { Proveedor } from '../interfaces/proveedor.interface';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.provider';

@Injectable()
export class ProveedoresService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async create(createProveedoreDto: CreateProveedoreDto): Promise<Proveedor> {
    const [id] = await this.knex('proveedores').insert(createProveedoreDto);
    const newProveedor = await this.findOne(id);
    if (!newProveedor) throw new NotFoundException('Error al crear proveedor');
    return newProveedor;
  }

  async findAll(): Promise<Proveedor[]> {
    return this.knex<Proveedor>('proveedores').where({ estado: 'activo' }).select('*');
  }

  async findOne(id: number): Promise<Proveedor | null> {
    const proveedor = await this.knex<Proveedor>('proveedores').where({ id, estado: 'activo' }).first();
    return proveedor || null;
  }

  async update(id: number, updateProveedoreDto: UpdateProveedoreDto): Promise<Proveedor> {
    const proveedor = await this.findOne(id);
    if (!proveedor) throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
    await this.knex('proveedores').where({ id }).update(updateProveedoreDto);
    const updated = await this.findOne(id);
    return updated!;
  }

  async remove(id: number): Promise<Proveedor> {
    const proveedor = await this.findOne(id);
    if (!proveedor) throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
    await this.knex('proveedores').where({ id }).update({ estado: 'inactivo' });
    return { ...proveedor, estado: 'inactivo' };
  }
}
