import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Usuario } from '../interfaces/usuario.interface';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.provider';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsuariosService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async create(createUsuarioDto: CreateUsuarioDto): Promise<Omit<Usuario, 'contrasena_hash'>> {
    const { contrasena, ...resto } = createUsuarioDto;

    // Hashear la contraseña de forma segura
    const salt = await bcrypt.genSalt(10);
    const contrasena_hash = await bcrypt.hash(contrasena, salt);

    const [id] = await this.knex('usuarios').insert({
      ...resto,
      contrasena_hash,
      estado: resto.estado || 'activo',
    });

    const newUsuario = await this.findOne(id);
    if (!newUsuario) throw new NotFoundException('Error al crear el usuario');
    return newUsuario;
  }

  async findAll(): Promise<Omit<Usuario, 'contrasena_hash'>[]> {
    // Soft delete: solo listar usuarios activos y omitir contrasena_hash por seguridad
    return this.knex<Usuario>('usuarios')
      .where({ estado: 'activo' })
      .select('id', 'rol_id', 'nombre', 'turno', 'estado', 'fecha_registro', 'registrado_por');
  }

  async findOne(id: number): Promise<Omit<Usuario, 'contrasena_hash'> | null> {
    // Soft delete: solo buscar si está activo
    const usuario = await this.knex<Usuario>('usuarios')
      .where({ id, estado: 'activo' })
      .select('id', 'rol_id', 'nombre', 'turno', 'estado', 'fecha_registro', 'registrado_por')
      .first();

    return usuario || null;
  }

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto): Promise<Omit<Usuario, 'contrasena_hash'>> {
    const usuario = await this.findOne(id);
    if (!usuario) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);

    const dataToUpdate: any = { ...updateUsuarioDto };

    // Si se envía una nueva contraseña, hashearla
    if (dataToUpdate.contrasena) {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.contrasena_hash = await bcrypt.hash(dataToUpdate.contrasena, salt);
      delete dataToUpdate.contrasena;
    }

    await this.knex('usuarios').where({ id }).update(dataToUpdate);
    const updated = await this.findOne(id);
    if (!updated) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    return updated;
  }

  async remove(id: number): Promise<Omit<Usuario, 'contrasena_hash'>> {
    const usuario = await this.findOne(id);
    if (!usuario) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);

    // Soft delete: actualizar el estado a 'inactivo' en lugar de borrar físicamente
    await this.knex('usuarios').where({ id }).update({ estado: 'inactivo' });

    return { ...usuario, estado: 'inactivo' };
  }
}
