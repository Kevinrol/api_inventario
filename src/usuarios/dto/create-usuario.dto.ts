import { IsString, IsOptional, MaxLength, MinLength, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RolUsuario, TurnoUsuario } from '../../interfaces/usuario.interface';

export class CreateUsuarioDto {
  @ApiProperty({ description: 'Nombre completo del usuario', maxLength: 150, example: 'Juan Pérez' })
  @IsString()
  @MaxLength(150)
  nombre_completo: string;

  @ApiProperty({ description: 'Nombre de usuario (username) para inicio de sesión', maxLength: 50, example: 'jperez' })
  @IsString()
  @MaxLength(50)
  username: string;

  @ApiProperty({ description: 'Contraseña del usuario (mínimo 8 caracteres)', minLength: 8, maxLength: 100, example: 'MiClaveSegura123' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(100)
  password: string;

  @ApiProperty({ description: 'Rol asignado al usuario', enum: RolUsuario, example: RolUsuario.VENDEDOR })
  @IsEnum(RolUsuario)
  rol: RolUsuario;

  @ApiPropertyOptional({ description: 'Turno de trabajo', enum: TurnoUsuario, example: TurnoUsuario.MANANA })
  @IsEnum(TurnoUsuario)
  @IsOptional()
  turno?: TurnoUsuario;

  @ApiProperty({ description: 'Estado del usuario (activo/inactivo)', default: true })
  @IsBoolean()
  estado: boolean;
}

