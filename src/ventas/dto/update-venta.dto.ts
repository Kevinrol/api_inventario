import { IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoPagoVenta } from '../../interfaces/venta.interface';

export class UpdateVentaDto {
  @ApiProperty({
    required: false,
    type: Number,
    nullable: true,
    description: 'ID del cliente (null para dejar la venta como general)',
  })
  @IsOptional()
  @IsNumber()
  id_cliente?: number | null;

  @ApiProperty({
    enum: EstadoPagoVenta,
    required: false,
    description: 'Actualizar el estado del pago (ej. marcar QR como Pagado)',
  })
  @IsOptional()
  @IsEnum(EstadoPagoVenta)
  estado_pago?: EstadoPagoVenta;

  @ApiProperty({
    required: false,
    example: 5,
    description: 'Descuento manual en Bs aplicado a la venta',
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El descuento admite máximo 2 decimales.' },
  )
  @Min(0, { message: 'El descuento no puede ser negativo.' })
  monto_descuento?: number;

  @ApiProperty({
    required: false,
    example: 100,
    description: 'Monto entregado en efectivo (solo ventas en Efectivo)',
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El monto entregado admite máximo 2 decimales.' },
  )
  @Min(0, { message: 'El monto entregado no puede ser negativo.' })
  monto_efectivo?: number;
}
