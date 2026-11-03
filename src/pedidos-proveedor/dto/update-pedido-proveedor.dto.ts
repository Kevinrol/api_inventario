import { IsOptional, IsDateString, IsIn, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoPedido } from '../../interfaces/pedido-proveedor.interface';

export class UpdatePedidoProveedorDto {
  @ApiProperty({ required: false, description: 'Fecha estimada de entrega' })
  @IsOptional()
  @IsDateString()
  fecha_entrega_estimada?: string;

  @ApiProperty({
    enum: [EstadoPedido.ENVIADO, EstadoPedido.CANCELADO],
    required: false,
    description: 'Estado del pedido (solo Enviado o Cancelado manualmente)',
  })
  @IsOptional()
  @IsIn([EstadoPedido.ENVIADO, EstadoPedido.CANCELADO], {
    message:
      'El estado manual del pedido solo puede cambiarse a "Enviado" o "Cancelado".',
  })
  estado_pedido?: EstadoPedido;

  @ApiProperty({
    required: false,
    description: 'URL del comprobante o nota de pedido (PDF o imagen)',
  })
  @IsOptional()
  @IsString()
  comprobante_url?: string | null;
}
