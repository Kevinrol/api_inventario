import { Module } from '@nestjs/common';
import { PedidosProveedorService } from './pedidos-proveedor.service';
import { PedidosProveedorController } from './pedidos-proveedor.controller';

@Module({
  controllers: [PedidosProveedorController],
  providers: [PedidosProveedorService],
  exports: [PedidosProveedorService],
})
export class PedidosProveedorModule {}
