import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsInt,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductoDto {
  @ApiProperty({
    required: false,
    description: 'Código de barras del producto',
    example: '123456789',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  @IsString()
  @MaxLength(100)
  codigo_barras?: string;

  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Cuaderno Espiral 100 hojas',
  })
  @IsString()
  @MaxLength(255)
  nombre_producto: string;

  @ApiProperty({ required: false, description: 'ID de la marca relacionada' })
  @IsOptional()
  @IsNumber()
  id_marca?: number;

  @ApiProperty({
    required: false,
    description: 'ID de la línea/categoría relacionada',
  })
  @IsOptional()
  @IsNumber()
  id_linea?: number;

  @ApiProperty({ description: 'Precio de venta del producto', example: 15.5 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio admite máximo 2 decimales.' },
  )
  @Min(0, { message: 'El precio no puede ser negativo.' })
  precio: number;

  @ApiProperty({
    required: false,
    description: 'Stock actual inicial',
    default: 0,
  })
  @IsOptional()
  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(0, { message: 'La cantidad no puede ser negativa.' })
  stock_actual?: number;

  @ApiProperty({
    required: false,
    description: 'Stock mínimo para alertas',
    default: 5,
  })
  @IsOptional()
  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(0, { message: 'La cantidad no puede ser negativa.' })
  stock_minimo?: number;

  @ApiProperty({
    required: false,
    description: 'Estado activo o inactivo',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}
