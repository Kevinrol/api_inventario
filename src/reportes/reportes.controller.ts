import { Controller, Get, Query } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('reportes')
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('ventas-resumen')
  @ApiOperation({
    summary:
      'Reporte consolidado y detallado de ventas filtrado por fechas, tipo de cliente y método de pago',
  })
  @ApiQuery({
    name: 'desde',
    required: false,
    description: 'Fecha inicio (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'hasta',
    required: false,
    description: 'Fecha fin inclusiva (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'tipo_cliente',
    required: false,
    description: 'Filtro por tipo de cliente: Mayorista, Minorista o General',
  })
  @ApiQuery({
    name: 'metodo_pago',
    required: false,
    description: 'Filtro por método de pago: Efectivo o QR',
  })
  @ApiQuery({
    name: 'estado_pago',
    required: false,
    description: 'Filtro opcional por estado de pago: Pagado o Pendiente',
  })
  getVentasResumen(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('tipo_cliente') tipo_cliente?: string,
    @Query('metodo_pago') metodo_pago?: string,
    @Query('estado_pago') estado_pago?: string,
  ) {
    return this.reportesService.getVentasResumen({
      desde,
      hasta,
      tipo_cliente,
      metodo_pago,
      estado_pago,
    });
  }

  @Get('existencias')
  @ApiOperation({
    summary:
      'Reporte consolidado de existencias: stock actual, productos más vendidos y faltantes/bajo stock',
  })
  @ApiQuery({
    name: 'desde',
    required: false,
    description: 'Fecha inicio para el ranking de más vendidos (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'hasta',
    required: false,
    description: 'Fecha fin inclusiva para el ranking de más vendidos (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad máxima en el ranking de más vendidos (por defecto 15)',
  })
  @ApiQuery({
    name: 'id_marca',
    required: false,
    type: Number,
    description: 'Filtrar existencias por ID de marca',
  })
  @ApiQuery({
    name: 'id_linea',
    required: false,
    type: Number,
    description: 'Filtrar existencias por ID de línea',
  })
  getExistencias(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('limit') limit?: string,
    @Query('id_marca') id_marca?: string,
    @Query('id_linea') id_linea?: string,
  ) {
    return this.reportesService.getExistencias({
      desde,
      hasta,
      limit: limit ? +limit : 15,
      id_marca: id_marca ? +id_marca : undefined,
      id_linea: id_linea ? +id_linea : undefined,
    });
  }

  @Get('top-productos')
  @ApiOperation({
    summary: 'Ranking de los productos con mayor rotación / más vendidos',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad máxima de productos a listar (por defecto 10)',
  })
  @ApiQuery({
    name: 'desde',
    required: false,
    description: 'Fecha inicio (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'hasta',
    required: false,
    description: 'Fecha fin inclusiva (YYYY-MM-DD)',
  })
  getTopProductos(
    @Query('limit') limit?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.reportesService.getTopProductos(
      limit ? +limit : 10,
      desde,
      hasta,
    );
  }

  @Get('compras-resumen')
  @ApiOperation({
    summary:
      'Reporte consolidado y detallado de abastecimiento (compras a proveedores) por rango de fechas',
  })
  @ApiQuery({
    name: 'desde',
    required: false,
    description: 'Fecha inicio (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'hasta',
    required: false,
    description: 'Fecha fin inclusiva (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'id_proveedor',
    required: false,
    type: Number,
    description: 'Filtrar abastecimiento por ID de proveedor',
  })
  getComprasResumen(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('id_proveedor') id_proveedor?: string,
  ) {
    return this.reportesService.getComprasResumen({
      desde,
      hasta,
      id_proveedor: id_proveedor ? +id_proveedor : undefined,
    });
  }
}
