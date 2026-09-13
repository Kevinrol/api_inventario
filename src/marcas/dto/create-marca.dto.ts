import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMarcaDto {
  @ApiProperty({ description: 'Nombre de la marca', maxLength: 100, example: 'Faber-Castell' })
  @IsString()
  @MaxLength(100)
  nombre_marca: string;
}
