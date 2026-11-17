import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsInt,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ProductoUnidadInputDto {
  @ApiProperty({ description: 'Nombre de la unidad (ej. Caja, Caja Madre, Docena)', example: 'Caja' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la unidad es obligatorio.' })
  @MaxLength(50)
  nombre_unidad: string;

  @ApiProperty({ description: 'Equivalencia en unidades sueltas', example: 24 })
  @IsInt({ message: 'La equivalencia de la unidad debe ser un número entero.' })
  @Min(1, { message: 'La equivalencia de la unidad debe ser de al menos 1.' })
  cantidad_unidades: number;
}

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
  @Min(0.01, { message: 'El precio de venta debe ser mayor a 0.' })
  precio: number;

  @ApiProperty({
    required: false,
    description: 'Precio de compra del producto',
    example: 10.0,
    default: 0,
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio de compra admite máximo 2 decimales.' },
  )
  @Min(0.01, { message: 'El precio de compra debe ser mayor a 0.' })
  precio_compra?: number;

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

  @ApiProperty({
    required: false,
    type: [ProductoUnidadInputDto],
    description: 'Unidades/presentaciones configuradas para el producto',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductoUnidadInputDto)
  unidades?: ProductoUnidadInputDto[];
}
