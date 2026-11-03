import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.provider';
import { Cliente } from '../interfaces/cliente.interface';

@Injectable()
export class ClientesService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async create(createClienteDto: CreateClienteDto): Promise<Cliente> {
    try {
      const [inserted] = await this.knex('clientes')
        .insert({
          ...createClienteDto,
          estado:
            createClienteDto.estado !== undefined
              ? createClienteDto.estado
              : true,
        })
        .returning('*');

      return inserted;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException(
          `El cliente con NIT/CI ${createClienteDto.nit_ci} ya existe.`,
        );
      }
      throw error;
    }
  }

  async findAll(q?: string, incluirInactivos = false): Promise<Cliente[]> {
    const query = this.knex<Cliente>('clientes')
      .select('*')
      .orderBy('id_cliente', 'desc');

    if (!incluirInactivos) {
      query.where('estado', true);
    }

    if (q) {
      query.where((builder) => {
        builder
          .whereILike('razon_social_nombre', `%${q}%`)
          .orWhereILike('nit_ci', `%${q}%`);
      });
    }

    return query;
  }

  async findOne(id_cliente: number): Promise<Cliente> {
    const cliente = await this.knex<Cliente>('clientes')
      .where({ id_cliente })
      .first();
    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${id_cliente} no encontrado`);
    }
    return cliente;
  }

  async update(
    id_cliente: number,
    updateClienteDto: UpdateClienteDto,
  ): Promise<Cliente> {
    await this.findOne(id_cliente);

    try {
      await this.knex('clientes')
        .where({ id_cliente })
        .update(updateClienteDto);
      return this.findOne(id_cliente);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException(`Conflicto de duplicidad en cliente.`);
      }
      throw error;
    }
  }

  async remove(id_cliente: number): Promise<Cliente> {
    const cliente = await this.findOne(id_cliente);
    await this.knex('clientes').where({ id_cliente }).update({ estado: false });
    return { ...cliente, estado: false };
  }
}
