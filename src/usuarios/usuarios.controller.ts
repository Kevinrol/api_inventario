import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponse, RolUsuario } from '../interfaces/usuario.interface';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('usuarios')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autentica un usuario y devuelve token JWT + datos de sesión',
  })
  @ApiResponse({ status: 200, description: 'Inicio de sesión exitoso.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.usuariosService.login(loginDto);
  }

  @Post()
  @ApiOperation({ summary: 'Crea un nuevo usuario / vendedor' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.' })
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtiene los usuarios con filtro opcional por rol y estado',
  })
  @ApiQuery({ name: 'rol', required: false, enum: RolUsuario })
  @ApiQuery({ name: 'incluirInactivos', required: false, type: Boolean })
  findAll(
    @Query('rol') rol?: RolUsuario,
    @Query('incluirInactivos') incluirInactivos?: string,
  ) {
    return this.usuariosService.findAll({
      rol,
      incluirInactivos: incluirInactivos === 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un usuario por su ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza un usuario existente por su ID' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ) {
    return this.usuariosService.update(id, updateUsuarioDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Da de baja lógica a un usuario por su ID' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.remove(id);
  }
}
