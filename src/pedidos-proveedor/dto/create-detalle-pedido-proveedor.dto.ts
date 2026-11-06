import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDetallePedidoProveedorDto {
  @ApiProperty({ description: 'ID del producto solicitado', example: 1 })
  @IsNumber()
  id_producto: number;

  @ApiProperty({ description: 'Cantidad solicitada', example: 10 })
  @IsNumber()
  @Min(1, { message: 'La cantidad solicitada debe ser de al menos 1 unidad.' })
  cantidad_solicitada: number;

  @ApiProperty({
    description: 'Unidad de venta (ej. Unidad, Caja, Paquete, Docena)',
    example: 'Caja',
  })
  @IsString()
  @IsNotEmpty({ message: 'La unidad de venta es obligatoria.' })
  unidad_venta: string;

  @ApiProperty({
    description: 'Precio unitario acordado con el proveedor',
    example: 45.5,
  })
  @IsNumber(
    {},
    { message: 'El precio unitario de compra debe ser un número válido.' },
  )
  @Min(0, { message: 'El precio unitario de compra no puede ser negativo.' })
  precio_unitario_compra: number;

  @ApiProperty({
    required: false,
    default: 0,
    description: 'Porcentaje de descuento (0 a 100)',
    example: 5,
  })
  @IsOptional()
  @IsNumber(
    {},
    { message: 'El porcentaje de descuento debe ser un número válido.' },
  )
  @Min(0, { message: 'El porcentaje de descuento no puede ser menor a 0%.' })
  @Max(100, { message: 'El porcentaje de descuento no puede ser mayor a 100%.' })
  porcentaje_descuento?: number;
}
