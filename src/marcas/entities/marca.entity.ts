import { ApiProperty } from '@nestjs/swagger';

export class Marca {
  @ApiProperty({ description: 'ID de la marca', example: 1 })
  id_marca: number;

  @ApiProperty({ description: 'Nombre de la marca', example: 'Faber-Castell' })
  nombre_marca: string;
}
