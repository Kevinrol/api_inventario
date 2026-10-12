import { IsNumber, IsOptional, IsDateString, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDetalleCompraProveedorDto {
  @ApiProperty({ description: 'ID del producto' })
  @IsNumber()
  id_producto: number;

  @ApiProperty({ description: 'Cantidad recibida', example: 10 })
  @IsNumber()
  @Min(1)
  cantidad_recibida: number;

  @ApiProperty({ description: 'Precio costo unitario', example: 50.5 })
  @IsNumber()
  @Min(0)
  precio_costo_unitario: number;
}

export class CreateCompraProveedorDto {
  @ApiProperty({ description: 'ID del proveedor' })
  @IsNumber()
  id_proveedor: number;

  @ApiProperty({ description: 'ID del usuario que registra la compra' })
  @IsNumber()
  id_usuario: number;

  @ApiProperty({ required: false, description: 'ID del pedido (opcional si la compra viene de un pedido)' })
  @IsOptional()
  @IsNumber()
  id_pedido?: number;

  @ApiProperty({ description: 'Fecha de recepción', example: '2026-09-27T10:00:00Z' })
  @IsDateString()
  fecha_recepcion: string;

  @ApiProperty({ type: [CreateDetalleCompraProveedorDto], description: 'Detalle de los productos comprados' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleCompraProveedorDto)
  detalles: CreateDetalleCompraProveedorDto[];
}
