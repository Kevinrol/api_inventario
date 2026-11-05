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
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { AjusteStockDto } from './dto/ajuste-stock.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('productos')
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiResponse({
    status: 201,
    description: 'El producto ha sido creado exitosamente.',
  })
  create(@Body() createProductoDto: CreateProductoDto) {
    return this.productosService.create(createProductoDto);
  }

  @Get('bajo-stock')
  @ApiOperation({
    summary: 'Obtener productos con stock menor o igual al stock mínimo',
  })
  getBajoStock() {
    return this.productosService.getBajoStock();
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los productos activos' })
  @ApiQuery({ name: 'incluirInactivos', required: false, type: Boolean })
  @ApiQuery({ name: 'codigo_barras', required: false, type: String })
  findAll(
    @Query('incluirInactivos') incluirInactivos?: string,
    @Query('codigo_barras') codigo_barras?: string,
  ) {
    return this.productosService.findAll(
      incluirInactivos === 'true',
      codigo_barras,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  findOne(@Param('id') id: string) {
    return this.productosService.findOne(+id);
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Ajustar el stock de un producto' })
  @ApiResponse({ status: 200, description: 'Stock actualizado correctamente.' })
  @ApiResponse({ status: 400, description: 'Cantidad inválida o stock negativo.' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  ajustarStock(@Param('id') id: string, @Body() dto: AjusteStockDto) {
    return this.productosService.ajustarStock(+id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un producto' })
  update(
    @Param('id') id: string,
    @Body() updateProductoDto: UpdateProductoDto,
  ) {
    return this.productosService.update(+id, updateProductoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar un producto (baja lógica)' })
  remove(@Param('id') id: string) {
    return this.productosService.remove(+id);
  }
}
