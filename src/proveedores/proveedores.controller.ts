import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
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
  update(
    @Param('id') id: string,
    @Body() updateProveedoreDto: UpdateProveedoreDto,
  ) {
    return this.proveedoresService.update(+id, updateProveedoreDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Elimina un proveedor por su ID (baja lógica)' })
  remove(@Param('id') id: string) {
    return this.proveedoresService.remove(+id);
  }

  @Get(':id/marcas')
  @ApiOperation({ summary: 'Obtiene las marcas distribuidas por el proveedor' })
  getMarcas(@Param('id') id: string) {
    return this.proveedoresService.getMarcas(+id);
  }

  @Post(':id/marcas/:idMarca')
  @ApiOperation({ summary: 'Asocia una marca a un proveedor' })
  addMarca(@Param('id') id: string, @Param('idMarca') idMarca: string) {
    return this.proveedoresService.addMarca(+id, +idMarca);
  }

  @Delete(':id/marcas/:idMarca')
  @ApiOperation({ summary: 'Desasocia una marca de un proveedor' })
  removeMarca(@Param('id') id: string, @Param('idMarca') idMarca: string) {
    return this.proveedoresService.removeMarca(+id, +idMarca);
  }

  @Get(':id/lineas')
  @ApiOperation({
    summary: 'Obtiene las líneas de producto provistas por el proveedor',
  })
  getLineas(@Param('id') id: string) {
    return this.proveedoresService.getLineas(+id);
  }

  @Post(':id/lineas/:idLinea')
  @ApiOperation({ summary: 'Asocia una línea de producto a un proveedor' })
  addLinea(@Param('id') id: string, @Param('idLinea') idLinea: string) {
    return this.proveedoresService.addLinea(+id, +idLinea);
  }

  @Delete(':id/lineas/:idLinea')
  @ApiOperation({ summary: 'Desasocia una línea de producto de un proveedor' })
  removeLinea(@Param('id') id: string, @Param('idLinea') idLinea: string) {
    return this.proveedoresService.removeLinea(+id, +idLinea);
  }
}
