import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRolDto {
  @ApiProperty({ description: 'Nombre del rol', maxLength: 50, example: 'admin' })
  @IsString()
  @MaxLength(50)
  nombre: string;
}
