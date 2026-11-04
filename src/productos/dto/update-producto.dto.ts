import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateProductoDto } from './create-producto.dto';

export class UpdateProductoDto extends PartialType(
  OmitType(CreateProductoDto, ['stock_actual'] as const),
) {}
