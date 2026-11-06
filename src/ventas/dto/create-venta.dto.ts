import {
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateIf,
  ValidateNested,
  ArrayMinSize,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateDetalleVentaDto } from './create-detalle-venta.dto';
import {
  TipoVenta,
  MetodoPago,
  EstadoPagoVenta,
} from '../../interfaces/venta.interface';

export class CreateVentaDto {
  @ApiProperty({
    description: 'ID del usuario/vendedor que registra la venta',
    example: 1,
  })
  @IsNumber()
  id_usuario: number;

  @ApiProperty({
    required: false,
    description:
      'ID del cliente (opcional para venta general). Obligatorio cuando tipo_venta es "Credito" y debe ser un cliente Mayorista.',
    example: 1,
  })
  @ValidateIf(
    (dto: CreateVentaDto) =>
      dto.tipo_venta === TipoVenta.CREDITO ||
      (dto.id_cliente !== undefined && dto.id_cliente !== null),
  )
  @IsNumber(
    {},
    {
      message:
        'Las ventas a crédito solo están permitidas para clientes mayoristas registrados.',
    },
  )
  id_cliente?: number;

  @ApiProperty({
    required: false,
    description:
      'Fecha y hora de la venta (opcional, por defecto fecha actual)',
  })
  @IsOptional()
  @IsDateString()
  fecha_hora?: string;

  @ApiProperty({
    enum: TipoVenta,
    default: TipoVenta.CONTADO,
    description:
      'Tipo de venta. "Credito" solo está permitido para clientes Mayoristas registrados.',
  })
  @IsEnum(TipoVenta)
  tipo_venta: TipoVenta;

  @ApiProperty({
    enum: MetodoPago,
    default: MetodoPago.EFECTIVO,
    description: 'Método de pago',
  })
  @IsEnum(MetodoPago)
  metodo_pago: MetodoPago;

  @ApiProperty({
    required: false,
    description: 'Monto de descuento en Bs aplicado al total de la venta',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monto_descuento?: number;

  @ApiProperty({
    required: false,
    description:
      'Monto entregado en efectivo por el cliente (requerido si método es Efectivo)',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  monto_efectivo?: number;

  @ApiProperty({
    enum: EstadoPagoVenta,
    required: false,
    description: 'Estado del pago (ej. Pagado, Pendiente)',
  })
  @IsOptional()
  @IsEnum(EstadoPagoVenta)
  estado_pago?: EstadoPagoVenta;

  @ApiProperty({
    type: [CreateDetalleVentaDto],
    description: 'Lista de productos que componen la venta',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleVentaDto)
  detalles: CreateDetalleVentaDto[];
}
