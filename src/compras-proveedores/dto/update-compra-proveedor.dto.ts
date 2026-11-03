import { IsOptional, IsDateString, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCompraProveedorDto {
  @ApiProperty({
    required: false,
    description: 'Fecha de recepción de la mercadería',
    example: '2026-10-15T10:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  fecha_recepcion?: string;

  @ApiProperty({
    required: false,
    description: 'URL del comprobante o factura de compra (PDF o imagen)',
  })
  @IsOptional()
  @IsString()
  comprobante_url?: string | null;
}
