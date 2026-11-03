import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoCliente } from '../../interfaces/cliente.interface';

export class CreateClienteDto {
  @ApiProperty({
    description: 'Razón social o nombre completo del cliente',
    example: 'Librería Central',
  })
  @IsString()
  @IsNotEmpty()
  razon_social_nombre: string;

  @ApiProperty({
    description: 'NIT o Carnet de Identidad',
    example: '1234567012',
  })
  @IsString()
  @IsNotEmpty()
  nit_ci: string;

  @ApiProperty({
    required: false,
    description: 'Número de teléfono o celular',
    example: '71234567',
  })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({
    required: false,
    description: 'Dirección física del cliente',
    example: 'Av. 6 de Marzo #123',
  })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiProperty({
    enum: TipoCliente,
    default: TipoCliente.MAYORISTA,
    description: 'Tipo de cliente',
  })
  @IsOptional()
  @IsEnum(TipoCliente)
  tipo_cliente?: TipoCliente;

  @ApiProperty({
    required: false,
    default: true,
    description: 'Estado activo o inactivo',
  })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}
