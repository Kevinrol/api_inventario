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
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('clientes')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente creado exitosamente.' })
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.clientesService.create(createClienteDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los clientes activos con filtros opcionales',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Búsqueda por nombre o NIT/CI',
  })
  @ApiQuery({ name: 'incluirInactivos', required: false, type: Boolean })
  findAll(
    @Query('q') q?: string,
    @Query('incluirInactivos') incluirInactivos?: string,
  ) {
    return this.clientesService.findAll(q, incluirInactivos === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un cliente por ID' })
  findOne(@Param('id') id: string) {
    return this.clientesService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un cliente' })
  update(@Param('id') id: string, @Body() updateClienteDto: UpdateClienteDto) {
    return this.clientesService.update(+id, updateClienteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar un cliente (baja lógica)' })
  remove(@Param('id') id: string) {
    return this.clientesService.remove(+id);
  }
}
