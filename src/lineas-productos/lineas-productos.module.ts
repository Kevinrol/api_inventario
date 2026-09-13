import { Module } from '@nestjs/common';
import { LineasProductosController } from './lineas-productos.controller';
import { LineasProductosService } from './lineas-productos.service';

@Module({
  controllers: [LineasProductosController],
  providers: [LineasProductosService]
})
export class LineasProductosModule {}
