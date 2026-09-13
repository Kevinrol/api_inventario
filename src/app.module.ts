import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { RolesModule } from './roles/roles.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';


@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, ProveedoresModule, UsuariosModule, RolesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
