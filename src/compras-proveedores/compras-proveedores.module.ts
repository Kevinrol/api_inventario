import { Module } from '@nestjs/common';
import { ComprasProveedoresController } from './compras-proveedores.controller';
import { ComprasProveedoresService } from './compras-proveedores.service';

@Module({
  controllers: [ComprasProveedoresController],
  providers: [ComprasProveedoresService]
})
export class ComprasProveedoresModule {}
