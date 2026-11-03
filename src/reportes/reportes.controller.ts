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
      'Resumen consolidado de ventas, totales por método de pago y por vendedor',
  })
  @ApiQuery({
    name: 'desde',
    required: false,
    description: 'Fecha inicio (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'hasta',
    required: false,
    description: 'Fecha fin (YYYY-MM-DD)',
  })
  getVentasResumen(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.reportesService.getVentasResumen(desde, hasta);
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
    description: 'Fecha fin (YYYY-MM-DD)',
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
      'Resumen consolidado de compras e inversión desglosada por proveedor',
  })
  @ApiQuery({
    name: 'desde',
    required: false,
    description: 'Fecha inicio (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'hasta',
    required: false,
    description: 'Fecha fin (YYYY-MM-DD)',
  })
  getComprasResumen(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.reportesService.getComprasResumen(desde, hasta);
  }
}
