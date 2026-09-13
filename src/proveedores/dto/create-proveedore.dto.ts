import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProveedoreDto {
  @ApiProperty({ description: 'El NIT (Número de Identificación Tributaria)', maxLength: 20 })
  @IsString()
  @MaxLength(20)
  nit: string;

  @ApiProperty({ description: 'El nombre del proveedor', maxLength: 30 })
  @IsString()
  @MaxLength(30)
  nombre: string;

  @ApiProperty({ description: 'Razón social registrada del proveedor ', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  razon_social: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto principal', maxLength: 20 })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  telefono_contacto?: string;

  @ApiPropertyOptional({ description: 'Tipo de material que provee', maxLength: 150 })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  linea_productos?: string;

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
