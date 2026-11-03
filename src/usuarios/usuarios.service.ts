import {
  Injectable,
  Inject,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import {
  JwtPayload,
  LoginRequest,
  LoginResponse,
  RolUsuario,
  Usuario,
  UsuarioAutenticado,
} from '../interfaces/usuario.interface';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.provider';
import * as bcrypt from 'bcryptjs';
import { createHmac } from 'node:crypto';

@Injectable()
export class UsuariosService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async create(
    createUsuarioDto: CreateUsuarioDto,
  ): Promise<Omit<Usuario, 'password_hash'>> {
    const { password, ...resto } = createUsuarioDto;

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    try {
      const [inserted] = await this.knex('usuarios')
        .insert({
          ...resto,
          username: resto.username.trim(),
          password_hash,
          estado: resto.estado !== undefined ? resto.estado : true,
        })
        .returning('id_usuario');

      const id_usuario =
        typeof inserted === 'object' ? inserted.id_usuario : inserted;

      const newUsuario = await this.findOne(id_usuario, true);
      if (!newUsuario)
        throw new NotFoundException('Error al crear el usuario');
      return newUsuario;
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new BadRequestException(
          'El nombre de usuario (username) ya está registrado.',
        );
      }
      throw error;
    }
  }

  async findAll(filtros?: {
    rol?: RolUsuario;
    incluirInactivos?: boolean;
  }): Promise<Omit<Usuario, 'password_hash'>[]> {
    const query = this.knex<Usuario>('usuarios').select(
      'id_usuario',
      'nombre_completo',
      'username',
      'rol',
      'turno',
      'estado',
    );

    if (!filtros?.incluirInactivos) {
      query.where({ estado: true });
    }
    if (filtros?.rol) {
      query.andWhere({ rol: filtros.rol });
    }

    return query.orderBy('id_usuario', 'asc');
  }

  async findOne(
    id_usuario: number,
    incluirInactivos = false,
  ): Promise<Omit<Usuario, 'password_hash'> | null> {
    const query = this.knex<Usuario>('usuarios')
      .where({ id_usuario })
      .select(
        'id_usuario',
        'nombre_completo',
        'username',
        'rol',
        'turno',
        'estado',
      );

    if (!incluirInactivos) {
      query.andWhere({ estado: true });
    }

    const usuario = await query.first();
    return usuario || null;
  }

  async update(
    id_usuario: number,
    updateUsuarioDto: UpdateUsuarioDto,
  ): Promise<Omit<Usuario, 'password_hash'>> {
    const usuario = await this.findOne(id_usuario, true);
    if (!usuario)
      throw new NotFoundException(`Usuario con ID ${id_usuario} no encontrado`);

    const dataToUpdate: any = { ...updateUsuarioDto };
    if (typeof dataToUpdate.username === 'string') {
      dataToUpdate.username = dataToUpdate.username.trim();
    }

    // Si se envía una nueva contraseña, hashearla
    if (dataToUpdate.password) {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.password_hash = await bcrypt.hash(
        dataToUpdate.password,
        salt,
      );
      delete dataToUpdate.password;
    } else {
      delete dataToUpdate.password;
    }

    try {
      await this.knex('usuarios').where({ id_usuario }).update(dataToUpdate);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new BadRequestException(
          'El nombre de usuario (username) ya está registrado.',
        );
      }
      throw error;
    }

    const updated = await this.findOne(id_usuario, true);
    if (!updated)
      throw new NotFoundException(`Usuario con ID ${id_usuario} no encontrado`);
    return updated;
  }

  async remove(id_usuario: number): Promise<Omit<Usuario, 'password_hash'>> {
    const usuario = await this.findOne(id_usuario, true);
    if (!usuario)
      throw new NotFoundException(`Usuario con ID ${id_usuario} no encontrado`);

    if (usuario.rol === RolUsuario.SUPER_ADMIN) {
      throw new BadRequestException(
        'No se puede dar de baja al Super Administrador.',
      );
    }

    // Soft delete: actualizar el estado a falso en lugar de borrar físicamente
    await this.knex('usuarios').where({ id_usuario }).update({ estado: false });

    return { ...usuario, estado: false };
  }

  // ponytail: HS256 RFC 7519 JWT via node:crypto, add guard when server-side route enforcement is required
  async login({ username, password }: LoginRequest): Promise<LoginResponse> {
    const row = await this.knex<Usuario>('usuarios')
      .where({ username: username.trim(), estado: true })
      .first();

    if (
      !row ||
      row.id_usuario == null ||
      !(await bcrypt.compare(password, row.password_hash))
    ) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    const usuario: UsuarioAutenticado = {
      id_usuario: row.id_usuario,
      nombre_completo: row.nombre_completo,
      username: row.username,
      rol: row.rol,
      turno: row.turno,
      estado: row.estado,
    };

    const nowSec = Math.floor(Date.now() / 1000);
    const payload: JwtPayload = {
      sub: usuario.id_usuario,
      username: usuario.username,
      rol: usuario.rol,
      iat: nowSec,
      exp: nowSec + 12 * 3600,
    };

    const headerB64 = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    ).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );
    const secret = process.env.JWT_SECRET || 'tofor-edustock-jwt-secret';
    const signature = createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    return {
      access_token: `${headerB64}.${payloadB64}.${signature}`,
      usuario,
    };
  }
}
