import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { Rol } from '../interfaces/roles.interface';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.provider';

@Injectable()
export class RolesService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async create(createRolDto: CreateRolDto): Promise<Rol> {
    const [id] = await this.knex('roles').insert(createRolDto);
    const newRol = await this.findOne(id);
    if (!newRol) throw new NotFoundException('Error al crear el rol');
    return newRol;
  }

  async findAll(): Promise<Rol[]> {
    return this.knex<Rol>('roles').select('*');
  }

  async findOne(id: number): Promise<Rol | null> {
    const rol = await this.knex<Rol>('roles').where({ id }).first();
    return rol || null;
  }

  async update(id: number, updateRolDto: UpdateRolDto): Promise<Rol> {
    await this.knex('roles').where({ id }).update(updateRolDto);
    const updated = await this.findOne(id);
    if (!updated) throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    return updated;
  }

  async remove(id: number): Promise<Rol> {
    const rol = await this.findOne(id);
    if (!rol) throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    await this.knex('roles').where({ id }).del();
    return rol;
  }
}
