import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { LineasProductosService } from './lineas-productos.service';
import { CreateLineasProductoDto } from './dto/create-lineas-producto.dto';
import { UpdateLineasProductoDto } from './dto/update-lineas-producto.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('lineas-productos')
@Controller('lineas-productos')
export class LineasProductosController {
  constructor(private readonly lineasProductosService: LineasProductosService) {}

  @Post()
  @ApiOperation({ summary: 'Crea una nueva línea de producto' })
  create(@Body() createLineasProductoDto: CreateLineasProductoDto) {
    return this.lineasProductosService.create(createLineasProductoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtiene todas las líneas de productos' })
  findAll() {
    return this.lineasProductosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene una línea de producto por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lineasProductosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza una línea de producto' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateLineasProductoDto: UpdateLineasProductoDto) {
    return this.lineasProductosService.update(id, updateLineasProductoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Elimina una línea de producto' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.lineasProductosService.remove(id);
  }
}
