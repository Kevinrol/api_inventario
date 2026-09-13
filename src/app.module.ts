import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { MarcasModule } from './marcas/marcas.module';
import { LineasProductosModule } from './lineas-productos/lineas-productos.module';


@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, ProveedoresModule, UsuariosModule, MarcasModule, LineasProductosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
