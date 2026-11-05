import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export type TipoAjusteStock = 'ENTRADA' | 'SALIDA' | 'FIJAR';

export class AjusteStockDto {
  @ApiProperty({ enum: ['ENTRADA', 'SALIDA', 'FIJAR'] })
  @IsIn(['ENTRADA', 'SALIDA', 'FIJAR'], {
    message: 'El tipo debe ser ENTRADA, SALIDA o FIJAR.',
  })
  tipo: TipoAjusteStock;

  @ApiProperty({ example: 5, minimum: 1 })
  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(1, { message: 'La cantidad debe ser mayor a 0.' })
  cantidad: number;

  @ApiProperty({ required: false, example: 'Reposición de proveedor' })
  @ValidateIf((o) => o.tipo !== 'ENTRADA')
  @IsString()
  @IsNotEmpty({ message: 'El motivo es obligatorio para este tipo de ajuste.' })
  @MaxLength(255)
  motivo?: string;
}
