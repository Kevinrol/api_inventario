import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LineaRecepcionPedidoDto {
  @ApiProperty({
    required: false,
    description: 'ID de la línea de detalle del pedido',
  })
  @IsOptional()
  @IsNumber()
  id_detalle_pedido?: number;

  @ApiProperty({
    required: false,
    description: 'ID del producto (alternativo a id_detalle_pedido)',
  })
  @IsOptional()
  @IsNumber()
  id_producto?: number;

  @ApiProperty({
    description: 'Cantidad a recibir en esta entrega',
    example: 5,
  })
  @IsNumber()
  @Min(1)
  cantidad_recibida: number;
}

export class RecibirPedidoProveedorDto {
  @ApiProperty({
    required: false,
    description: 'ID del usuario que registra la recepción',
  })
  @IsOptional()
  @IsNumber()
  id_usuario?: number;

  @ApiProperty({
    required: false,
    description: 'URL del comprobante/nota de entrega de esta recepción (PDF o imagen)',
  })
  @IsOptional()
  @IsString()
  comprobante_url?: string;

  @ApiProperty({
    required: false,
    type: [LineaRecepcionPedidoDto],
    description:
      'Detalle opcional de cantidades a recibir por línea. Si se omite, se recibe todo lo pendiente.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineaRecepcionPedidoDto)
  detalles?: LineaRecepcionPedidoDto[];
}
