import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { AjusteStockDto } from './dto/ajuste-stock.dto';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.provider';
import { Producto } from '../interfaces/producto.interface';

@Injectable()
export class ProductosService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  private parseProducto(row: any): Producto {
    if (!row) return row;
    return {
      ...row,
      precio: Number(row.precio ?? 0),
      stock_actual: Number(row.stock_actual ?? 0),
      stock_minimo: Number(row.stock_minimo ?? 0),
    };
  }

  /** Normaliza texto para comparar: minúsculas, sin acentos, espacios colapsados. */
  private normalizarTexto(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  private async buscarDuplicado(
    dto: CreateProductoDto | UpdateProductoDto,
    excluirId?: number,
  ): Promise<void> {
    // 1. Código de barras: único entre todos (incluye inactivos)
    const codigo = dto.codigo_barras?.trim();
    if (codigo) {
      const query = this.knex('productos')
        .whereRaw('btrim(codigo_barras) = ?', [codigo]);
      if (excluirId) query.whereNot('id_producto', excluirId);
      const existente = await query.first('id_producto');
      if (existente) {
        throw new ConflictException(
          `Ya existe un producto con el código de barras ${codigo}.`,
        );
      }
    }

    // 2. Nombre normalizado + marca + línea: solo activos
    if (dto.nombre_producto) {
      const query = this.knex('productos')
        .where('estado', true)
        .whereRaw('COALESCE(id_marca, 0) = ?', [dto.id_marca ?? 0])
        .whereRaw('COALESCE(id_linea, 0) = ?', [dto.id_linea ?? 0]);
      if (excluirId) query.whereNot('id_producto', excluirId);

      const candidatos = await query.select('id_producto', 'nombre_producto');
      const buscado = this.normalizarTexto(dto.nombre_producto);
      if (candidatos.some((c) => this.normalizarTexto(c.nombre_producto) === buscado)) {
        throw new ConflictException(
          'Ya existe un producto con ese nombre para la misma marca y línea.',
        );
      }
    }
  }

  async create(createProductoDto: CreateProductoDto): Promise<Producto> {
    await this.buscarDuplicado(createProductoDto);

    try {
      const [inserted] = await this.knex('productos')
        .insert(createProductoDto)
        .returning('*');
      return (
        (await this.findOne(inserted.id_producto)) ||
        this.parseProducto(inserted)
      );
    } catch (error: any) {
      if (error.code === '23505') {
        const detalle = String(error.detail ?? '');
        const mensaje = detalle.includes('codigo_barras')
          ? 'Ya existe un producto con ese código de barras.'
          : 'Ya existe un producto con ese nombre para la misma marca y línea.';
        throw new ConflictException(mensaje);
      }
      throw error;
    }
  }

  async findAll(
    incluirInactivos = false,
    codigo_barras?: string,
  ): Promise<Producto[]> {
    const query = this.knex('productos')
      .leftJoin('marcas', 'productos.id_marca', 'marcas.id_marca')
      .leftJoin(
        'lineas_productos',
        'productos.id_linea',
        'lineas_productos.id_linea',
      )
      .select(
        'productos.*',
        'marcas.nombre_marca',
        'lineas_productos.nombre_linea',
      )
      .orderBy('productos.id_producto', 'desc');

    if (!incluirInactivos) {
      query.where('productos.estado', true);
    }
    if (codigo_barras) {
      query.where('productos.codigo_barras', codigo_barras);
    }

    const rows = await query;
    return rows.map((r) => this.parseProducto(r));
  }

  async getBajoStock(): Promise<Producto[]> {
    const rows = await this.knex('productos')
      .leftJoin('marcas', 'productos.id_marca', 'marcas.id_marca')
      .leftJoin(
        'lineas_productos',
        'productos.id_linea',
        'lineas_productos.id_linea',
      )
      .select(
        'productos.*',
        'marcas.nombre_marca',
        'lineas_productos.nombre_linea',
      )
      .where('productos.estado', true)
      .andWhereRaw('productos.stock_actual <= productos.stock_minimo')
      .orderBy('productos.stock_actual', 'asc');

    return rows.map((r) => this.parseProducto(r));
  }

  async findOne(id_producto: number): Promise<Producto> {
    const row = await this.knex('productos')
      .leftJoin('marcas', 'productos.id_marca', 'marcas.id_marca')
      .leftJoin(
        'lineas_productos',
        'productos.id_linea',
        'lineas_productos.id_linea',
      )
      .select(
        'productos.*',
        'marcas.nombre_marca',
        'lineas_productos.nombre_linea',
      )
      .where('productos.id_producto', id_producto)
      .first();

    if (!row)
      throw new NotFoundException(
        `Producto con ID ${id_producto} no encontrado`,
      );
    return this.parseProducto(row);
  }

  async update(
    id_producto: number,
    updateProductoDto: UpdateProductoDto,
  ): Promise<Producto> {
    const actual = await this.findOne(id_producto);

    const nombreCambio =
      updateProductoDto.nombre_producto !== undefined &&
      this.normalizarTexto(updateProductoDto.nombre_producto) !==
        this.normalizarTexto(actual.nombre_producto);
    const marcaCambio =
      updateProductoDto.id_marca !== undefined &&
      (updateProductoDto.id_marca ?? 0) !== (actual.id_marca ?? 0);
    const lineaCambio =
      updateProductoDto.id_linea !== undefined &&
      (updateProductoDto.id_linea ?? 0) !== (actual.id_linea ?? 0);
    const cambioClave = nombreCambio || marcaCambio || lineaCambio;

    if (updateProductoDto.codigo_barras !== undefined || cambioClave) {
      await this.buscarDuplicado(
        {
          codigo_barras: updateProductoDto.codigo_barras,
          nombre_producto: cambioClave
            ? (updateProductoDto.nombre_producto ?? actual.nombre_producto)
            : undefined,
          id_marca:
            updateProductoDto.id_marca !== undefined
              ? updateProductoDto.id_marca
              : actual.id_marca,
          id_linea:
            updateProductoDto.id_linea !== undefined
              ? updateProductoDto.id_linea
              : actual.id_linea,
        } as CreateProductoDto,
        id_producto,
      );
    }

    try {
      await this.knex('productos')
        .where({ id_producto })
        .update(updateProductoDto);

      return this.findOne(id_producto);
    } catch (error: any) {
      if (error.code === '23505') {
        const detalle = String(error.detail ?? '');
        const mensaje = detalle.includes('codigo_barras')
          ? 'Ya existe un producto con ese código de barras.'
          : 'Ya existe un producto con ese nombre para la misma marca y línea.';
        throw new ConflictException(mensaje);
      }
      throw error;
    }
  }

  async ajustarStock(id: number, dto: AjusteStockDto): Promise<Producto> {
    return this.knex.transaction(async (trx) => {
      const actual = await trx('productos')
        .where({ id_producto: id })
        .forUpdate()
        .first();

      if (!actual) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
      }

      const anterior = Number(actual.stock_actual ?? 0);
      const nuevo =
        dto.tipo === 'ENTRADA'
          ? anterior + dto.cantidad
          : dto.tipo === 'SALIDA'
            ? anterior - dto.cantidad
            : dto.cantidad;

      if (nuevo < 0) {
        throw new BadRequestException(
          `Stock insuficiente para "${actual.nombre_producto}". Disponible: ${anterior}, solicitado: ${dto.cantidad}.`,
        );
      }

      await trx('productos')
        .where({ id_producto: id })
        .update({ stock_actual: nuevo });

      const row = await trx('productos')
        .leftJoin('marcas', 'productos.id_marca', 'marcas.id_marca')
        .leftJoin(
          'lineas_productos',
          'productos.id_linea',
          'lineas_productos.id_linea',
        )
        .select(
          'productos.*',
          'marcas.nombre_marca',
          'lineas_productos.nombre_linea',
        )
        .where('productos.id_producto', id)
        .first();

      return this.parseProducto(row);
    });
  }

  async remove(id_producto: number): Promise<Producto> {
    const producto = await this.findOne(id_producto);
    await this.knex('productos')
      .where({ id_producto })
      .update({ estado: false });
    return { ...producto, estado: false };
  }
}
