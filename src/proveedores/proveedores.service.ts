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
    const { marcas, lineas_productos, ...proveedorData } = createProveedoreDto;

    return this.knex.transaction(async (trx) => {
      const [inserted] = await trx('proveedores')
        .insert(proveedorData)
        .returning('id_proveedor');
        
      const id_proveedor = typeof inserted === 'object' ? inserted.id_proveedor : inserted;

      if (marcas && marcas.length > 0) {
        for (const nombre_marca of marcas) {
          let marca = await trx('marcas').where({ nombre_marca }).first();
          if (!marca) {
            const [insertedMarca] = await trx('marcas').insert({ nombre_marca }).returning('id_marca');
            marca = { id_marca: typeof insertedMarca === 'object' ? insertedMarca.id_marca : insertedMarca };
          }
          await trx('proveedor_marcas').insert({ id_proveedor, id_marca: marca.id_marca });
        }
      }

      if (lineas_productos && lineas_productos.length > 0) {
        for (const nombre_linea of lineas_productos) {
          let linea = await trx('lineas_productos').where({ nombre_linea }).first();
          if (!linea) {
            const [insertedLinea] = await trx('lineas_productos').insert({ nombre_linea }).returning('id_linea');
            linea = { id_linea: typeof insertedLinea === 'object' ? insertedLinea.id_linea : insertedLinea };
          }
          await trx('proveedor_lineas').insert({ id_proveedor, id_linea: linea.id_linea });
        }
      }

      return (await this.findOneTx(id_proveedor, trx))!;
    });
  }

  async findAll(): Promise<Proveedor[]> {
    const proveedores = await this.knex<Proveedor>('proveedores').where({ estado: true }).select('*');
    
    for (const p of proveedores) {
      if (p.id_proveedor) {
        const marcas = await this.knex('marcas')
          .join('proveedor_marcas', 'marcas.id_marca', 'proveedor_marcas.id_marca')
          .where('proveedor_marcas.id_proveedor', p.id_proveedor)
          .select('marcas.nombre_marca');
        p.marcas = marcas.map((m: any) => m.nombre_marca);

        const lineas = await this.knex('lineas_productos')
          .join('proveedor_lineas', 'lineas_productos.id_linea', 'proveedor_lineas.id_linea')
          .where('proveedor_lineas.id_proveedor', p.id_proveedor)
          .select('lineas_productos.nombre_linea');
        p.lineas_productos = lineas.map((l: any) => l.nombre_linea);
      }
    }
    
    return proveedores;
  }

  async findOne(id_proveedor: number): Promise<Proveedor | null> {
    return this.findOneTx(id_proveedor, this.knex);
  }

  private async findOneTx(id_proveedor: number, tx: Knex | Knex.Transaction): Promise<Proveedor | null> {
    const proveedor = await tx<Proveedor>('proveedores').where({ id_proveedor, estado: true }).first();
    if (!proveedor) return null;

    const marcas = await tx('marcas')
      .join('proveedor_marcas', 'marcas.id_marca', 'proveedor_marcas.id_marca')
      .where('proveedor_marcas.id_proveedor', id_proveedor)
      .select('marcas.nombre_marca');
    proveedor.marcas = marcas.map((m: any) => m.nombre_marca);

    const lineas = await tx('lineas_productos')
      .join('proveedor_lineas', 'lineas_productos.id_linea', 'proveedor_lineas.id_linea')
      .where('proveedor_lineas.id_proveedor', id_proveedor)
      .select('lineas_productos.nombre_linea');
    proveedor.lineas_productos = lineas.map((l: any) => l.nombre_linea);

    return proveedor;
  }

  async update(id_proveedor: number, updateProveedoreDto: UpdateProveedoreDto): Promise<Proveedor> {
    const proveedor = await this.findOne(id_proveedor);
    if (!proveedor) throw new NotFoundException(`Proveedor con ID ${id_proveedor} no encontrado`);

    const { marcas, lineas_productos, ...proveedorData } = updateProveedoreDto;

    return this.knex.transaction(async (trx) => {
      if (Object.keys(proveedorData).length > 0) {
        await trx('proveedores').where({ id_proveedor }).update(proveedorData);
      }

      if (marcas !== undefined) {
        await trx('proveedor_marcas').where({ id_proveedor }).delete();
        for (const nombre_marca of marcas) {
          let marca = await trx('marcas').where({ nombre_marca }).first();
          if (!marca) {
            const [insertedMarca] = await trx('marcas').insert({ nombre_marca }).returning('id_marca');
            marca = { id_marca: typeof insertedMarca === 'object' ? insertedMarca.id_marca : insertedMarca };
          }
          await trx('proveedor_marcas').insert({ id_proveedor, id_marca: marca.id_marca });
        }
      }

      if (lineas_productos !== undefined) {
        await trx('proveedor_lineas').where({ id_proveedor }).delete();
        for (const nombre_linea of lineas_productos) {
          let linea = await trx('lineas_productos').where({ nombre_linea }).first();
          if (!linea) {
            const [insertedLinea] = await trx('lineas_productos').insert({ nombre_linea }).returning('id_linea');
            linea = { id_linea: typeof insertedLinea === 'object' ? insertedLinea.id_linea : insertedLinea };
          }
          await trx('proveedor_lineas').insert({ id_proveedor, id_linea: linea.id_linea });
        }
      }

      return (await this.findOneTx(id_proveedor, trx))!;
    });
  }

  async remove(id_proveedor: number): Promise<Proveedor> {
    const proveedor = await this.findOne(id_proveedor);
    if (!proveedor) throw new NotFoundException(`Proveedor con ID ${id_proveedor} no encontrado`);
    await this.knex('proveedores').where({ id_proveedor }).update({ estado: false });
    return { ...proveedor, estado: false };
  }
}
