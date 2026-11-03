import { IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoPagoVenta } from '../../interfaces/venta.interface';

export class UpdateVentaDto {
  @ApiProperty({ required: false, description: 'ID del cliente' })
  @IsOptional()
  @IsNumber()
  id_cliente?: number;

  @ApiProperty({
    enum: EstadoPagoVenta,
    required: false,
    description: 'Actualizar el estado del pago (ej. marcar QR como Pagado)',
  })
  @IsOptional()
  @IsEnum(EstadoPagoVenta)
  estado_pago?: EstadoPagoVenta;
}
