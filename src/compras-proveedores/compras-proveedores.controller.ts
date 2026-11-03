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
import { ComprasProveedoresService } from './compras-proveedores.service';
import { CreateCompraProveedorDto } from './dto/create-compra-proveedor.dto';
import { UpdateCompraProveedorDto } from './dto/update-compra-proveedor.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('compras-proveedores')
@Controller('compras-proveedores')
export class ComprasProveedoresController {
  constructor(private readonly comprasService: ComprasProveedoresService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar una nueva compra a proveedor y actualizar stock',
  })
  @ApiResponse({ status: 201, description: 'Compra registrada exitosamente.' })
  create(@Body() createDto: CreateCompraProveedorDto) {
    return this.comprasService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener historial de todas las compras con filtros',
  })
  @ApiQuery({ name: 'id_proveedor', required: false, type: Number })
  @ApiQuery({ name: 'id_usuario', required: false, type: Number })
  @ApiQuery({
    name: 'estado',
    required: false,
    description: 'Completada, Anulada',
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
  findAll(
    @Query('id_proveedor') id_proveedor?: string,
    @Query('id_usuario') id_usuario?: string,
    @Query('estado') estado?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.comprasService.findAll({
      id_proveedor: id_proveedor ? +id_proveedor : undefined,
      id_usuario: id_usuario ? +id_usuario : undefined,
      estado,
      desde,
      hasta,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una compra por ID' })
  findOne(@Param('id') id: string) {
    return this.comprasService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar fecha de recepción u observaciones de una compra',
  })
  update(@Param('id') id: string, @Body() updateDto: UpdateCompraProveedorDto) {
    return this.comprasService.update(+id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary:
      'Anular una compra (baja lógica a estado Anulada y reversión de stock)',
  })
  remove(@Param('id') id: string) {
    return this.comprasService.remove(+id);
  }
}
