import { IsString, IsOptional, IsNumber, IsBoolean, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductoDto {
  @ApiProperty({ required: false, description: 'Código de barras del producto', example: '123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  codigo_barras?: string;

  @ApiProperty({ description: 'Nombre del producto', example: 'Cuaderno Espiral 100 hojas' })
  @IsString()
  @MaxLength(255)
  nombre_producto: string;

  @ApiProperty({ required: false, description: 'ID de la marca relacionada' })
  @IsOptional()
  @IsNumber()
  id_marca?: number;

  @ApiProperty({ required: false, description: 'ID de la línea/categoría relacionada' })
  @IsOptional()
  @IsNumber()
  id_linea?: number;

  @ApiProperty({ description: 'Precio para venta minorista', example: 15.5 })
  @IsNumber()
  @Min(0)
  precio_minorista: number;

  @ApiProperty({ description: 'Precio para venta mayorista', example: 12.0 })
  @IsNumber()
  @Min(0)
  precio_mayorista: number;

  @ApiProperty({ required: false, description: 'Stock actual inicial', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock_actual?: number;

  @ApiProperty({ required: false, description: 'Stock mínimo para alertas', default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock_minimo?: number;

  @ApiProperty({ required: false, description: 'Estado activo o inactivo', default: true })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}
