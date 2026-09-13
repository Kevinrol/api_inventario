import { PartialType } from '@nestjs/swagger';
import { CreateLineasProductoDto } from './create-lineas-producto.dto';

export class UpdateLineasProductoDto extends PartialType(CreateLineasProductoDto) {}
