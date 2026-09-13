import { IsString, IsOptional, MaxLength, IsInt, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUsuarioDto {
  @ApiProperty({ description: 'ID del rol asignado al usuario', example: 1 })
  @IsInt()
  rol_id: number;

  @ApiProperty({ description: 'Nombre del usuario', maxLength: 150, example: 'Juan Pérez' })
  @IsString()
  @MaxLength(150)
  nombre: string;

  @ApiProperty({ description: 'Contraseña del usuario (mínimo 8 caracteres)', minLength: 8, maxLength: 100, example: 'MiClaveSegura123' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(100)
  contrasena: string;

  @ApiPropertyOptional({ description: 'Turno de trabajo (ej. mañana, tarde, noche)', maxLength: 10, example: 'mañana' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  turno?: string;

  @ApiPropertyOptional({ description: 'Estado del usuario', maxLength: 10, default: 'activo', example: 'activo' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  estado?: string;

  @ApiPropertyOptional({ description: 'ID del usuario que registró a esta persona (opcional, debe existir en usuarios)' })
  @IsInt()
  @IsOptional()
  registrado_por?: number;
}
