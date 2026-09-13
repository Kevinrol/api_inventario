import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLineasProductoDto {
  @ApiProperty({ description: 'Nombre de la línea de producto', maxLength: 100, example: 'Cuadernos y Escritura' })
  @IsString()
  @MaxLength(100)
  nombre_linea: string;
}
