import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Proveedore {
  @ApiProperty({ description: 'ID único del proveedor', example: 1 })
  id_proveedor: number;

  @ApiProperty({ description: 'El NIT (Número de Identificación Tributaria)', example: '1029384756' })
  nit: string;

  @ApiProperty({ description: 'Razón social registrada del proveedor', example: 'Distribuidora Papelera S.A.' })
  razon_social: string;

  @ApiPropertyOptional({ description: 'El nombre del contacto', example: 'Carlos Mendoza' })
  nombre_contacto?: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto principal', example: '+591 76543210' })
  telefono_contacto?: string;

  @ApiPropertyOptional({ description: 'Ciudad del proveedor', example: 'Santa Cruz' })
  ciudad?: string;

  @ApiPropertyOptional({ description: 'Líneas de productos que provee', type: [String], example: ['Cuadernos', 'Lápices', 'Mochilas'] })
  lineas_productos?: string[];

  @ApiPropertyOptional({ description: 'Marcas distribuidas por el proveedor', type: [String], example: ['Faber-Castell', 'Norma', 'Loro'] })
  marcas?: string[];

  @ApiProperty({ description: 'Estado del proveedor (true = activo, false = inactivo)', example: true })
  estado: boolean;
}

