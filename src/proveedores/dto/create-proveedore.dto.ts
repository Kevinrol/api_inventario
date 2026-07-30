import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProveedoreDto {
  @ApiProperty({ description: 'El NIT (Número de Identificación Tributaria)', maxLength: 20 })
  @IsString()
  @MaxLength(20)
  nit: string;

  @ApiProperty({ description: 'Razón social registrada de la empresa', maxLength: 150 })
  @IsString()
  @MaxLength(150)
  razon_social: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto principal', maxLength: 20 })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  telefono_contacto?: string;

  @ApiProperty({ description: 'El nombre del contacto o representante', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({ description: 'Nombre comercial de la empresa', maxLength: 150 })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  empresa?: string;

  @ApiPropertyOptional({ description: 'Las condiciones o el tipo de pago', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  tipo_pago?: string;

  @ApiPropertyOptional({ description: 'Estado del proveedor (ej. activo/inactivo)', maxLength: 10, default: 'activo' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  estado?: string;
}
