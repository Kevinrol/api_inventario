import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateProductoDto, ProductoUnidadInputDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { AjusteStockDto } from './dto/ajuste-stock.dto';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.provider';
import { Producto, ProductoUnidad } from '../interfaces/producto.interface';

const UNIDADES_FIJAS: Record<string, number> = {
  unidad: 1,
  'media docena': 6,
  docena: 12,
};

@Injectable()
export class ProductosService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  private parseProducto(row: any): Producto {
    if (!row) return row;
    return {
      ...row,
      precio: Number(row.precio ?? 0),
      precio_compra: Number(row.precio_compra ?? 0),
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

  private validarPrecios(
    precioVenta?: number,
    precioCompra?: number,
  ): void {
    if (precioVenta !== undefined && precioVenta <= 0) {
      throw new BadRequestException('El precio de venta debe ser un número mayor a 0.');
    }
    if (precioCompra !== undefined && precioCompra <= 0) {
      throw new BadRequestException('El precio de compra debe ser un número mayor a 0.');
    }
    if (
      precioVenta !== undefined &&
      precioCompra !== undefined &&
      precioCompra > 0 &&
      precioCompra >= precioVenta
    ) {
      throw new BadRequestException(
        `El precio de compra (Bs ${precioCompra.toFixed(2)}) debe ser menor al precio de venta (Bs ${precioVenta.toFixed(2)}).`,
      );
    }
  }

  async create(createProductoDto: CreateProductoDto): Promise<Producto> {
    const { unidades, ...datosProducto } = createProductoDto;
    this.validarPrecios(
      datosProducto.precio !== undefined ? Number(datosProducto.precio) : undefined,
      datosProducto.precio_compra !== undefined ? Number(datosProducto.precio_compra) : undefined,
    );
    await this.buscarDuplicado(datosProducto);

    try {
      const idNuevo = await this.knex.transaction(async (trx) => {
        const [inserted] = await trx('productos')
          .insert(datosProducto)
          .returning('*');
        await this.sincronizarUnidades(inserted.id_producto, unidades ?? [], trx);
        return inserted.id_producto;
      });
      return await this.findOne(idNuevo);
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

  private async adjuntarUnidades(productos: Producto[]): Promise<Producto[]> {
    if (productos.length === 0) return productos;
    const ids = productos.map((p) => p.id_producto);
    const filas = await this.knex('producto_unidades')
      .whereIn('id_producto', ids)
      .orderBy([
        { column: 'cantidad_unidades', order: 'asc' },
        { column: 'id_unidad_producto', order: 'asc' },
      ]);

    const mapa = new Map<number, ProductoUnidad[]>();
    for (const f of filas) {
      const idProd = Number(f.id_producto);
      const lista = mapa.get(idProd) ?? [];
      lista.push({
        id_unidad_producto: Number(f.id_unidad_producto),
        id_producto: idProd,
        nombre_unidad: String(f.nombre_unidad),
        cantidad_unidades: Number(f.cantidad_unidades),
        es_editable: Boolean(f.es_editable),
      });
      mapa.set(idProd, lista);
    }

    return productos.map((p) => ({
      ...p,
      unidades: mapa.get(p.id_producto) ?? [],
    }));
  }

  async sincronizarUnidades(
    id_producto: number,
    unidades: ProductoUnidadInputDto[],
    trxOrKnex: Knex = this.knex,
  ): Promise<ProductoUnidad[]> {
    const existentes = await trxOrKnex('producto_unidades').where({ id_producto });
    const porNombre = new Map<string, any>();
    for (const ex of existentes) {
      porNombre.set(String(ex.nombre_unidad).trim().toLowerCase(), ex);
    }

    // Asegurar siempre las unidades base fijas del sistema
    const unidadesBaseObligatorias = [
      { nombre_unidad: 'Unidad', cantidad_unidades: 1 },
      { nombre_unidad: 'Media Docena', cantidad_unidades: 6 },
      { nombre_unidad: 'Docena', cantidad_unidades: 12 },
    ];
    for (const base of unidadesBaseObligatorias) {
      const clave = base.nombre_unidad.toLowerCase();
      if (!porNombre.has(clave)) {
        const [insertada] = await trxOrKnex('producto_unidades')
          .insert({
            id_producto,
            nombre_unidad: base.nombre_unidad,
            cantidad_unidades: base.cantidad_unidades,
            es_editable: false,
          })
          .returning('*');
        porNombre.set(clave, insertada);
      }
    }

    // Conjunto de nombres de unidades opcionales que el usuario configuró
    const nombresOpcionalesEnviados = new Set<string>();

    for (const u of unidades) {
      const nombreLimpio = u.nombre_unidad.trim();
      const clave = nombreLimpio.toLowerCase();
      if (!nombreLimpio) continue;

      const valorFijo = UNIDADES_FIJAS[clave];
      if (valorFijo !== undefined) {
        // Es una unidad fija (no editable)
        continue;
      }

      nombresOpcionalesEnviados.add(clave);
      const cantidadFinal = Math.floor(Number(u.cantidad_unidades));
      if (!Number.isInteger(cantidadFinal) || cantidadFinal < 1) {
        throw new BadRequestException(
          `La unidad "${nombreLimpio}" debe tener una cantidad entera mayor o igual a 1.`,
        );
      }

      const actual = porNombre.get(clave);
      if (actual) {
        if (actual.es_editable && Number(actual.cantidad_unidades) !== cantidadFinal) {
          await trxOrKnex('producto_unidades')
            .where({ id_unidad_producto: actual.id_unidad_producto })
            .update({
              nombre_unidad: nombreLimpio,
              cantidad_unidades: cantidadFinal,
            });
        }
      } else {
        await trxOrKnex('producto_unidades').insert({
          id_producto,
          nombre_unidad: nombreLimpio,
          cantidad_unidades: cantidadFinal,
          es_editable: true,
        });
      }
    }

    // Eliminar las unidades opcionales existentes que el usuario haya quitado
    for (const ex of existentes) {
      const clave = String(ex.nombre_unidad).trim().toLowerCase();
      if (UNIDADES_FIJAS[clave] !== undefined) {
        continue; // las fijas jamás se borran
      }
      if (!nombresOpcionalesEnviados.has(clave)) {
        await trxOrKnex('producto_unidades')
          .where({ id_unidad_producto: ex.id_unidad_producto })
          .delete();
      }
    }

    const actualizadas = await trxOrKnex('producto_unidades')
      .where({ id_producto })
      .orderBy([
        { column: 'cantidad_unidades', order: 'asc' },
        { column: 'id_unidad_producto', order: 'asc' },
      ]);

    return actualizadas.map((f) => ({
      id_unidad_producto: Number(f.id_unidad_producto),
      id_producto: Number(f.id_producto),
      nombre_unidad: String(f.nombre_unidad),
      cantidad_unidades: Number(f.cantidad_unidades),
      es_editable: Boolean(f.es_editable),
    }));
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
    const parseados = rows.map((r) => this.parseProducto(r));
    return this.adjuntarUnidades(parseados);
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
    const [conUnidades] = await this.adjuntarUnidades([this.parseProducto(row)]);
    return conUnidades;
  }

  async update(
    id_producto: number,
    updateProductoDto: UpdateProductoDto,
  ): Promise<Producto> {
    const { unidades, ...datosProducto } = updateProductoDto;
    const actual = await this.findOne(id_producto);

    const precioVentaFinal =
      datosProducto.precio !== undefined ? Number(datosProducto.precio) : Number(actual.precio);
    const precioCompraFinal =
      datosProducto.precio_compra !== undefined
        ? Number(datosProducto.precio_compra)
        : actual.precio_compra !== undefined
          ? Number(actual.precio_compra)
          : undefined;

    this.validarPrecios(precioVentaFinal, precioCompraFinal);

    const nombreCambio =
      datosProducto.nombre_producto !== undefined &&
      this.normalizarTexto(datosProducto.nombre_producto) !==
        this.normalizarTexto(actual.nombre_producto);
    const marcaCambio =
      datosProducto.id_marca !== undefined &&
      (datosProducto.id_marca ?? 0) !== (actual.id_marca ?? 0);
    const lineaCambio =
      datosProducto.id_linea !== undefined &&
      (datosProducto.id_linea ?? 0) !== (actual.id_linea ?? 0);
    const cambioClave = nombreCambio || marcaCambio || lineaCambio;

    if (datosProducto.codigo_barras !== undefined || cambioClave) {
      await this.buscarDuplicado(
        {
          codigo_barras: datosProducto.codigo_barras,
          nombre_producto: cambioClave
            ? (datosProducto.nombre_producto ?? actual.nombre_producto)
            : undefined,
          id_marca:
            datosProducto.id_marca !== undefined
              ? datosProducto.id_marca
              : actual.id_marca,
          id_linea:
            datosProducto.id_linea !== undefined
              ? datosProducto.id_linea
              : actual.id_linea,
        } as CreateProductoDto,
        id_producto,
      );
    }

    try {
      await this.knex.transaction(async (trx) => {
        if (Object.keys(datosProducto).length > 0) {
          await trx('productos')
            .where({ id_producto })
            .update(datosProducto);
        }
        if (unidades !== undefined) {
          await this.sincronizarUnidades(id_producto, unidades, trx);
        }
      });

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

      return (
        (await this.findOne(id)) ||
        this.parseProducto(row)
      );
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
