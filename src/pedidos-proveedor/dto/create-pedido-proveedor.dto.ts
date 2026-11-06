import {
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsDateString,
  IsEnum,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateDetallePedidoProveedorDto } from './create-detalle-pedido-proveedor.dto';
import { EstadoPedido } from '../../interfaces/pedido-proveedor.interface';

export class CreatePedidoProveedorDto {
  @ApiProperty({
    description:
      'ID del proveedor. Define las marcas y líneas válidas para los productos del detalle.',
    example: 1,
  })
  @IsNumber()
  id_proveedor: number;

  @ApiProperty({
    description: 'ID del usuario que genera el pedido',
    example: 1,
  })
  @IsNumber()
  id_usuario: number;

  @ApiProperty({
    required: false,
    description: 'Fecha y hora de creación del pedido',
  })
  @IsOptional()
  @IsDateString()
  fecha_pedido?: string;

  @ApiProperty({
    required: true,
    description: 'Fecha estimada de entrega (al menos 1 día posterior, a partir de mañana)',
    example: '2026-10-25',
  })
  @IsNotEmpty({ message: 'La fecha estimada de entrega es obligatoria.' })
  @IsDateString(
    {},
    {
      message:
        'La fecha estimada de entrega debe tener un formato de fecha válido.',
    },
  )
  fecha_entrega_estimada: string;

  @ApiProperty({
    enum: [EstadoPedido.PENDIENTE, EstadoPedido.ENVIADO],
    default: EstadoPedido.PENDIENTE,
    required: false,
    description:
      'Estado inicial del pedido (se ignora y se crea siempre como Pendiente)',
  })
  @IsOptional()
  @IsEnum(EstadoPedido)
  estado_pedido?: EstadoPedido;

  @ApiProperty({
    required: false,
    description:
      'URL del comprobante o nota de pedido (PDF o imagen en Supabase Storage)',
  })
  @IsOptional()
  @IsString()
  comprobante_url?: string;

  @ApiProperty({
    type: [CreateDetallePedidoProveedorDto],
    description:
      'Detalle de los productos pedidos. Cada producto debe pertenecer a una marca o línea abastecida por el proveedor indicado.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateDetallePedidoProveedorDto)
  detalles: CreateDetallePedidoProveedorDto[];
}
