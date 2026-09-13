import { ApiProperty } from '@nestjs/swagger';

export class LineasProducto {
  @ApiProperty({ description: 'ID de la línea de producto', example: 1 })
  id_linea: number;

  @ApiProperty({ description: 'Nombre de la línea', example: 'Cuadernos y Escritura' })
  nombre_linea: string;
}
