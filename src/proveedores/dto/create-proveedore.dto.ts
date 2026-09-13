import { IsString, IsOptional, MaxLength, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProveedoreDto {
  @ApiProperty({ description: 'El NIT (Número de Identificación Tributaria)', maxLength: 20, example: '1029384756' })
  @IsString()
  @MaxLength(20)
  nit: string;

  @ApiProperty({ description: 'Razón social registrada del proveedor', maxLength: 50, example: 'Distribuidora Papelera S.A.' })
  @IsString()
  @MaxLength(50)
  razon_social: string;

  @ApiPropertyOptional({ description: 'El nombre del contacto', maxLength: 50, example: 'Carlos Mendoza' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nombre_contacto?: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto principal', maxLength: 20, example: '+591 76543210' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  telefono_contacto?: string;

  @ApiPropertyOptional({ description: 'Ciudad del proveedor', maxLength: 50, example: 'Santa Cruz' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  ciudad?: string;

  @ApiPropertyOptional({ description: 'Líneas de productos que provee', type: [String], example: ['Cuadernos', 'Lápices', 'Mochilas'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  lineas_productos?: string[];

  @ApiPropertyOptional({ description: 'Marcas distribuidas por el proveedor', type: [String], example: ['Faber-Castell', 'Norma', 'Loro'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  marcas?: string[];

  @ApiProperty({ description: 'Estado del proveedor (true = activo, false = inactivo)', example: true })
  @IsBoolean()
  estado: boolean;
}


