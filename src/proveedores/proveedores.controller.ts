import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProveedoresService } from './proveedores.service';
import { CreateProveedoreDto } from './dto/create-proveedore.dto';
import { UpdateProveedoreDto } from './dto/update-proveedore.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('proveedores')
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  @Post()
  @ApiOperation({ summary: 'Crea un nuevo proveedor' })
  @ApiResponse({ status: 201, description: 'Proveedor creado exitosamente.' })
  create(@Body() createProveedoreDto: CreateProveedoreDto) {
    return this.proveedoresService.create(createProveedoreDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtiene todos los proveedores' })
  findAll() {
    return this.proveedoresService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un proveedor por su ID' })
  findOne(@Param('id') id: string) {
    return this.proveedoresService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza un proveedor existente por su ID' })
  update(@Param('id') id: string, @Body() updateProveedoreDto: UpdateProveedoreDto) {
    return this.proveedoresService.update(+id, updateProveedoreDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Elimina un proveedor por su ID' })
  remove(@Param('id') id: string) {
    return this.proveedoresService.remove(+id);
  }
}
