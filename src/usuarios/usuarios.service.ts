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

  async create(createUsuarioDto: CreateUsuarioDto): Promise<Omit<Usuario, 'password_hash'>> {
    const { password, ...resto } = createUsuarioDto;

    // Hashear la contraseña de forma segura
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [inserted] = await this.knex('usuarios').insert({
      ...resto,
      password_hash,
      estado: resto.estado !== undefined ? resto.estado : true,
    }).returning('id_usuario');

    const id_usuario = typeof inserted === 'object' ? inserted.id_usuario : inserted;

    const newUsuario = await this.findOne(id_usuario);
    if (!newUsuario) throw new NotFoundException('Error al crear el usuario');
    return newUsuario;
  }

  async findAll(): Promise<Omit<Usuario, 'password_hash'>[]> {
    // Solo listar usuarios activos y omitir password_hash por seguridad
    return this.knex<Usuario>('usuarios')
      .where({ estado: true })
      .select('id_usuario', 'nombre_completo', 'username', 'rol', 'turno', 'estado');
  }

  async findOne(id_usuario: number): Promise<Omit<Usuario, 'password_hash'> | null> {
    // Solo buscar si está activo
    const usuario = await this.knex<Usuario>('usuarios')
      .where({ id_usuario, estado: true })
      .select('id_usuario', 'nombre_completo', 'username', 'rol', 'turno', 'estado')
      .first();

    return usuario || null;
  }

  async update(id_usuario: number, updateUsuarioDto: UpdateUsuarioDto): Promise<Omit<Usuario, 'password_hash'>> {
    const usuario = await this.findOne(id_usuario);
    if (!usuario) throw new NotFoundException(`Usuario con ID ${id_usuario} no encontrado`);

    const dataToUpdate: any = { ...updateUsuarioDto };

    // Si se envía una nueva contraseña, hashearla
    if (dataToUpdate.password) {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.password_hash = await bcrypt.hash(dataToUpdate.password, salt);
      delete dataToUpdate.password;
    }

    await this.knex('usuarios').where({ id_usuario }).update(dataToUpdate);
    const updated = await this.findOne(id_usuario);
    if (!updated) throw new NotFoundException(`Usuario con ID ${id_usuario} no encontrado`);
    return updated;
  }

  async remove(id_usuario: number): Promise<Omit<Usuario, 'password_hash'>> {
    const usuario = await this.findOne(id_usuario);
    if (!usuario) throw new NotFoundException(`Usuario con ID ${id_usuario} no encontrado`);

    // Soft delete: actualizar el estado a falso en lugar de borrar físicamente
    await this.knex('usuarios').where({ id_usuario }).update({ estado: false });

    return { ...usuario, estado: false };
  }
}
