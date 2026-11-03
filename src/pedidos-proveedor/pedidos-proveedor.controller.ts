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
import { PedidosProveedorService } from './pedidos-proveedor.service';
import { CreatePedidoProveedorDto } from './dto/create-pedido-proveedor.dto';
import { UpdatePedidoProveedorDto } from './dto/update-pedido-proveedor.dto';
import { RecibirPedidoProveedorDto } from './dto/recibir-pedido-proveedor.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('pedidos-proveedor')
@Controller('pedidos-proveedor')
export class PedidosProveedorController {
  constructor(
    private readonly pedidosProveedorService: PedidosProveedorService,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'Crear una nueva orden de pedido a proveedor (no afecta stock aún)',
  })
  @ApiResponse({
    status: 201,
    description: 'Pedido creado exitosamente con estado Pendiente.',
  })
  create(@Body() createDto: CreatePedidoProveedorDto) {
    return this.pedidosProveedorService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar pedidos a proveedores con filtros opcionales',
  })
  @ApiQuery({
    name: 'estado_pedido',
    required: false,
    description: 'Pendiente, Enviado, Parcial, Recibido, Cancelado',
  })
  @ApiQuery({ name: 'id_proveedor', required: false, type: Number })
  @ApiQuery({ name: 'id_usuario', required: false, type: Number })
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
    @Query('estado_pedido') estado_pedido?: string,
    @Query('id_proveedor') id_proveedor?: string,
    @Query('id_usuario') id_usuario?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.pedidosProveedorService.findAll({
      estado_pedido,
      id_proveedor: id_proveedor ? +id_proveedor : undefined,
      id_usuario: id_usuario ? +id_usuario : undefined,
      desde,
      hasta,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un pedido por ID con sus líneas detalladas',
  })
  findOne(@Param('id') id: string) {
    return this.pedidosProveedorService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un pedido pendiente (ej. fecha de entrega o estado)',
  })
  update(@Param('id') id: string, @Body() updateDto: UpdatePedidoProveedorDto) {
    return this.pedidosProveedorService.update(+id, updateDto);
  }

  @Post(':id/recibir')
  @ApiOperation({
    summary:
      'Recibir el pedido (total pendiente o parcial): genera la compra oficial e incrementa el stock de cada producto',
  })
  recibir(
    @Param('id') id: string,
    @Body() recibirDto?: RecibirPedidoProveedorDto,
  ) {
    return this.pedidosProveedorService.recibir(+id, recibirDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Cancelar un pedido (baja lógica a estado Cancelado)',
  })
  remove(@Param('id') id: string) {
    return this.pedidosProveedorService.remove(+id);
  }
}
