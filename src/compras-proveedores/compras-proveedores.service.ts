import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateCompraProveedorDto } from './dto/create-compra-proveedor.dto';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.provider';

@Injectable()
export class ComprasProveedoresService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async create(createDto: CreateCompraProveedorDto) {
    const { detalles, ...compraInfo } = createDto;

    // Calcular total pagado sumando subtotales
    let totalPagado = 0;
    const detallesConSubtotal = detalles.map(d => {
      const subtotal = d.cantidad_recibida * d.precio_costo_unitario;
      totalPagado += subtotal;
      return { ...d, subtotal };
    });

    return await this.knex.transaction(async (trx) => {
      // 1. Insertar maestro (compra)
      const [compraInsertada] = await trx('compras_proveedores')
        .insert({
          ...compraInfo,
          total_pagado: totalPagado
        })
        .returning('*');

      // 2. Insertar detalles
      const detallesAInsertar = detallesConSubtotal.map(d => ({
        id_compra: compraInsertada.id_compra,
        id_producto: d.id_producto,
        cantidad_recibida: d.cantidad_recibida,
        precio_costo_unitario: d.precio_costo_unitario,
        subtotal: d.subtotal
      }));

      await trx('detalle_compras_proveedores').insert(detallesAInsertar);

      // 3. Actualizar stock_actual de cada producto
      for (const d of detallesAInsertar) {
        await trx('productos')
          .where({ id_producto: d.id_producto })
          .increment('stock_actual', d.cantidad_recibida);
      }

      return {
        ...compraInsertada,
        detalles: detallesAInsertar
      };
    });
  }

  async findAll() {
    return this.knex('compras_proveedores').select('*').orderBy('fecha_recepcion', 'desc');
  }

  async findOne(id_compra: number) {
    const compra = await this.knex('compras_proveedores').where({ id_compra }).first();
    if (!compra) throw new NotFoundException(`Compra con ID ${id_compra} no encontrada`);
    
    const detalles = await this.knex('detalle_compras_proveedores').where({ id_compra });
    
    return { ...compra, detalles };
  }
}
