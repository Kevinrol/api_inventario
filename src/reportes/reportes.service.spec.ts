import { ReportesService } from './reportes.service';

function createQueryBuilderMock(resolvedValue: any) {
  const calls: Record<string, any[][]> = {};
  const record = (name: string, args: any[]) => {
    calls[name] = calls[name] ?? [];
    calls[name].push(args);
  };

  const qb: any = {
    __calls: calls,
    leftJoin: jest.fn((...args) => {
      record('leftJoin', args);
      return qb;
    }),
    join: jest.fn((...args) => {
      record('join', args);
      return qb;
    }),
    where: jest.fn((...args) => {
      record('where', args);
      return qb;
    }),
    whereNot: jest.fn((...args) => {
      record('whereNot', args);
      return qb;
    }),
    whereRaw: jest.fn((...args) => {
      record('whereRaw', args);
      return qb;
    }),
    select: jest.fn((...args) => {
      record('select', args);
      return qb;
    }),
    sum: jest.fn((...args) => {
      record('sum', args);
      return qb;
    }),
    count: jest.fn((...args) => {
      record('count', args);
      return qb;
    }),
    groupBy: jest.fn((...args) => {
      record('groupBy', args);
      return qb;
    }),
    groupByRaw: jest.fn((...args) => {
      record('groupByRaw', args);
      return qb;
    }),
    orderBy: jest.fn((...args) => {
      record('orderBy', args);
      return qb;
    }),
    limit: jest.fn((...args) => {
      record('limit', args);
      return qb;
    }),
    first: jest.fn(() => Promise.resolve(resolvedValue)),
    then: (resolve: any, reject: any) =>
      Promise.resolve(resolvedValue).then(resolve, reject),
  };

  qb.clone = jest.fn(() => qb);
  return qb;
}

describe('ReportesService', () => {
  it('aplica rango inclusivo para fecha hasta (YYYY-MM-DD -> < día siguiente) y filtros de tipo_cliente y metodo_pago', async () => {
    const clones: any[] = [
      createQueryBuilderMock({
        total_recaudado: '450.50',
        total_descuentos: '20.00',
        cantidad_ventas: '2',
      }),
      createQueryBuilderMock([
        { metodo_pago: 'QR', total: '450.50', cantidad: '2' },
      ]),
      createQueryBuilderMock([
        { id_usuario: 3, vendedor: 'Ana Perez', total: '450.50', cantidad: '2' },
      ]),
      createQueryBuilderMock([
        { tipo_cliente: 'General', total: '450.50', cantidad: '2' },
      ]),
      createQueryBuilderMock([
        {
          id_venta: 10,
          fecha_hora: '2026-11-20T14:00:00.000Z',
          vendedor: 'Ana Perez',
          cliente: 'Venta General',
          nit_cliente: null,
          tipo_cliente: 'General',
          tipo_venta: 'Contado',
          metodo_pago: 'QR',
          estado_pago: 'Pagado',
          monto_descuento: '20.00',
          monto_total: '450.50',
        },
      ]),
    ];

    let cloneIdx = 0;
    const baseQb = createQueryBuilderMock([]);
    baseQb.clone = jest.fn(() => clones[cloneIdx++]);

    const knexMock: any = jest.fn(() => baseQb);
    knexMock.raw = jest.fn((sql: string) => sql);

    const service = new ReportesService(knexMock);
    const result = await service.getVentasResumen({
      desde: '2026-11-01',
      hasta: '2026-11-20',
      tipo_cliente: 'General',
      metodo_pago: 'QR',
    });

    expect(baseQb.where).toHaveBeenCalledWith(
      'ventas.fecha_hora',
      '>=',
      '2026-11-01',
    );
    expect(baseQb.where).toHaveBeenCalledWith(
      'ventas.fecha_hora',
      '<',
      '2026-11-21',
    );
    expect(baseQb.whereRaw).toHaveBeenCalledWith(
      "COALESCE(clientes.tipo_cliente, 'General') = ?",
      ['General'],
    );
    expect(baseQb.where).toHaveBeenCalledWith('ventas.metodo_pago', 'QR');

    expect(result.total_recaudado).toBe(450.5);
    expect(result.total_descuentos).toBe(20);
    expect(result.cantidad_ventas).toBe(2);
    expect(result.ticket_promedio).toBe(225.25);
    expect(result.por_tipo_cliente).toEqual([
      { tipo_cliente: 'General', total: 450.5, cantidad: 2 },
    ]);
    expect(result.ventas).toHaveLength(1);
    expect(result.ventas[0].cliente).toBe('Venta General');
  });

  it('consolida existencias, clasifica AGOTADO/BAJO/NORMAL y calcula faltantes con déficit', async () => {
    const productosQb = createQueryBuilderMock([
      {
        id_producto: 1,
        codigo_barras: '111',
        nombre_producto: 'Cuaderno A4',
        stock_actual: 0,
        stock_minimo: 5,
        precio: '15.00',
        precio_compra: '10.00',
        nombre_marca: 'Lider',
        nombre_linea: 'Cuadernos',
      },
      {
        id_producto: 2,
        codigo_barras: '222',
        nombre_producto: 'Lapicero Azul',
        stock_actual: 4,
        stock_minimo: 5,
        precio: '3.00',
        precio_compra: '1.50',
        nombre_marca: 'Pilot',
        nombre_linea: 'Escritura',
      },
      {
        id_producto: 3,
        codigo_barras: '333',
        nombre_producto: 'Regla 30cm',
        stock_actual: 20,
        stock_minimo: 5,
        precio: '5.00',
        precio_compra: '2.50',
        nombre_marca: 'Artesco',
        nombre_linea: 'Geometría',
      },
    ]);

    const topQb = createQueryBuilderMock([
      {
        id_producto: 2,
        nombre_producto: 'Lapicero Azul',
        codigo_barras: '222',
        nombre_marca: 'Pilot',
        nombre_linea: 'Escritura',
        stock_actual: 4,
        unidades_vendidas: '30',
        total_generado: '90.00',
      },
    ]);

    const knexMock: any = jest.fn((tabla: string) =>
      tabla === 'productos' ? productosQb : topQb,
    );
    knexMock.raw = jest.fn((sql: string) => sql);

    const service = new ReportesService(knexMock);
    const result = await service.getExistencias({
      desde: '2026-11-01',
      hasta: '2026-11-20',
      limit: 10,
    });

    expect(result.resumen).toEqual({
      total_productos: 3,
      unidades_totales: 24,
      valor_stock_venta: 112,
      valor_stock_costo: 56,
      cantidad_bajo_stock: 2,
      cantidad_agotados: 1,
    });
    expect(result.faltantes).toHaveLength(2);
    expect(result.faltantes[0]).toMatchObject({
      id_producto: 1,
      estado_stock: 'AGOTADO',
      deficit: 5,
    });
    expect(result.faltantes[1]).toMatchObject({
      id_producto: 2,
      estado_stock: 'BAJO',
      deficit: 1,
    });
    expect(result.mas_vendidos).toHaveLength(1);
    expect(result.mas_vendidos[0].unidades_vendidas).toBe(30);
  });

  it('genera reporte de abastecimiento con totales, resumen por proveedor y listado de compras', async () => {
    const clones: any[] = [
      createQueryBuilderMock({
        total_invertido: '1200.00',
        cantidad_compras: '1',
      }),
      createQueryBuilderMock([
        {
          id_proveedor: 7,
          proveedor: 'Distribuidora Papel',
          nit: '123456',
          total: '1200.00',
          cantidad: '1',
        },
      ]),
      createQueryBuilderMock([
        {
          id_compra: 5,
          id_pedido: 2,
          fecha_recepcion: '2026-11-18T10:30:00.000Z',
          id_proveedor: 7,
          proveedor: 'Distribuidora Papel',
          nit_proveedor: '123456',
          receptor: 'Nelly Admin',
          items: '3',
          unidades_totales: '120',
          total_pagado: '1200.00',
          estado: 'Completada',
        },
      ]),
    ];

    let cloneIdx = 0;
    const baseQb = createQueryBuilderMock([]);
    baseQb.clone = jest.fn(() => clones[cloneIdx++]);

    const knexMock: any = jest.fn(() => baseQb);
    knexMock.raw = jest.fn((sql: string) => sql);

    const service = new ReportesService(knexMock);
    const result = await service.getComprasResumen({
      desde: '2026-11-01',
      hasta: '2026-11-20',
    });

    expect(baseQb.where).toHaveBeenCalledWith(
      'compras_proveedores.fecha_recepcion',
      '>=',
      '2026-11-01',
    );
    expect(baseQb.where).toHaveBeenCalledWith(
      'compras_proveedores.fecha_recepcion',
      '<',
      '2026-11-21',
    );
    expect(result.total_invertido).toBe(1200);
    expect(result.cantidad_compras).toBe(1);
    expect(result.total_unidades_ingresadas).toBe(120);
    expect(result.por_proveedor).toHaveLength(1);
    expect(result.compras).toHaveLength(1);
    expect(result.compras[0].receptor).toBe('Nelly Admin');
  });
});
