import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { VentasService } from './ventas.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('ventas')
@Controller('ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Post()
  @ApiOperation({
    summary:
      'Registrar una nueva venta con sus productos y descontar stock automáticamente',
  })
  @ApiResponse({ status: 201, description: 'Venta registrada exitosamente.' })
  create(@Body() createVentaDto: CreateVentaDto) {
    return this.ventasService.create(createVentaDto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar ventas con filtros de fecha, cliente, usuario y estado de pago',
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
  @ApiQuery({ name: 'id_usuario', required: false, type: Number })
  @ApiQuery({ name: 'id_cliente', required: false, type: Number })
  @ApiQuery({
    name: 'estado_pago',
    required: false,
    description: 'Pagado, Pendiente, Anulado',
  })
  @ApiQuery({
    name: 'metodo_pago',
    required: false,
    description: 'Efectivo, QR, Transferencia',
  })
  findAll(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('id_usuario') id_usuario?: string,
    @Query('id_cliente') id_cliente?: string,
    @Query('estado_pago') estado_pago?: string,
    @Query('metodo_pago') metodo_pago?: string,
  ) {
    return this.ventasService.findAll({
      desde,
      hasta,
      id_usuario: id_usuario ? +id_usuario : undefined,
      id_cliente: id_cliente ? +id_cliente : undefined,
      estado_pago,
      metodo_pago,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle completo de una venta por ID' })
  findOne(@Param('id') id: string) {
    return this.ventasService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar estado de pago o cliente de una venta' })
  update(@Param('id') id: string, @Body() updateVentaDto: UpdateVentaDto) {
    return this.ventasService.update(+id, updateVentaDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary:
      'Anular una venta (baja lógica a estado Anulado y restitución de stock)',
  })
  remove(@Param('id') id: string) {
    return this.ventasService.remove(+id);
  }
}
