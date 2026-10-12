import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { ComprasProveedoresService } from './compras-proveedores.service';
import { CreateCompraProveedorDto } from './dto/create-compra-proveedor.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('compras-proveedores')
@Controller('compras-proveedores')
export class ComprasProveedoresController {
  constructor(private readonly comprasService: ComprasProveedoresService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar una nueva compra a proveedor y actualizar stock' })
  @ApiResponse({ status: 201, description: 'Compra registrada exitosamente.' })
  create(@Body() createDto: CreateCompraProveedorDto) {
    return this.comprasService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener historial de todas las compras' })
  findAll() {
    return this.comprasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una compra por ID' })
  findOne(@Param('id') id: string) {
    return this.comprasService.findOne(+id);
  }
}
