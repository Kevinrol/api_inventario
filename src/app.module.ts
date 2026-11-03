import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { MarcasModule } from './marcas/marcas.module';
import { LineasProductosModule } from './lineas-productos/lineas-productos.module';
import { ProductosModule } from './productos/productos.module';
import { ComprasProveedoresModule } from './compras-proveedores/compras-proveedores.module';
import { ClientesModule } from './clientes/clientes.module';
import { VentasModule } from './ventas/ventas.module';
import { PedidosProveedorModule } from './pedidos-proveedor/pedidos-proveedor.module';
import { ReportesModule } from './reportes/reportes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ProveedoresModule,
    UsuariosModule,
    MarcasModule,
    LineasProductosModule,
    ProductosModule,
    ComprasProveedoresModule,
    ClientesModule,
    VentasModule,
    PedidosProveedorModule,
    ReportesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
