import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LoginRequest } from '../../interfaces/usuario.interface';

export class LoginDto implements LoginRequest {
  @ApiProperty({
    description: 'Nombre de usuario (username)',
    example: 'nelly',
  })
  @IsString()
  @IsNotEmpty({ message: 'El usuario es obligatorio' })
  @MaxLength(50)
  username: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'tofor$2026',
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MaxLength(100)
  password: string;
}
