import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDetalleVentaDto {
  @ApiProperty({ description: 'ID del producto a vender', example: 1 })
  @IsNumber()
  id_producto: number;

  @ApiProperty({ description: 'Cantidad de unidades vendidas', example: 2 })
  @IsNumber()
  @Min(1)
  cantidad: number;
}
