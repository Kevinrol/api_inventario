import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDetallePedidoProveedorDto {
  @ApiProperty({ description: 'ID del producto solicitado', example: 1 })
  @IsNumber()
  id_producto: number;

  @ApiProperty({ description: 'Cantidad solicitada', example: 10 })
  @IsNumber()
  @Min(1)
  cantidad_solicitada: number;

  @ApiProperty({
    description: 'Unidad de venta (ej. Unidad, Caja, Paquete, Docena)',
    example: 'Caja',
  })
  @IsString()
  @IsNotEmpty()
  unidad_venta: string;

  @ApiProperty({
    description: 'Precio unitario acordado con el proveedor',
    example: 45.5,
  })
  @IsNumber()
  @Min(0)
  precio_unitario_compra: number;

  @ApiProperty({
    required: false,
    default: 0,
    description: 'Porcentaje de descuento (0 a 100)',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  porcentaje_descuento?: number;
}
