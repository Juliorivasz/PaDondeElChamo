import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { Configuracion } from './entities/configuracion.entity';
import { Marca } from './entities/marca.entity';
import { Proveedor } from './entities/proveedor.entity';
import { Categoria } from './entities/categoria.entity';
import { Producto } from './entities/producto.entity';
import { Venta } from './entities/venta.entity';
import { DetalleVenta } from './entities/detalle-venta.entity';

import { Compra } from './entities/compra.entity';
import { DetalleCompra } from './entities/detalle-compra.entity';
import { Gasto } from './entities/gasto.entity';
import { Auditoria } from './entities/auditoria.entity';
import { DetalleAuditoria } from './entities/detalle-auditoria.entity';
import { Arqueo } from './entities/arqueo.entity';
import { RetiroEfectivo } from './entities/retiro-efectivo.entity';
import { UsuarioModule } from './modules/usuario/usuario.module';
import { ConfiguracionModule } from './modules/configuracion/configuracion.module';
import { MarcaModule } from './modules/marca/marca.module';
import { CategoriaModule } from './modules/categoria/categoria.module';
import { ProveedorModule } from './modules/proveedor/proveedor.module';
import { ProductoModule } from './modules/producto/producto.module';
import { VentaModule } from './modules/venta/venta.module';
import { CompraModule } from './modules/compra/compra.module';
import { GastoModule } from './modules/gasto/gasto.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { EstadisticaModule } from './modules/estadistica/estadistica.module';

import { AuthModule } from './modules/auth/auth.module';
import { CajaModule } from './modules/caja/caja.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbHost = configService.get<string>('DB_HOST');
        const dbPort = configService.get<number>('DB_PORT');
        const dbUsername = configService.get<string>('DB_USERNAME');
        const dbPassword = configService.get<string>('DB_PASSWORD');
        const dbDatabase = configService.get<string>('DB_DATABASE');
        const nodeEnv = configService.get<string>('NODE_ENV');

        if (!dbHost || !dbPort || !dbUsername || !dbDatabase) {
          throw new Error('Database configuration is incomplete. Please check your environment variables.');
        }

        return {
          type: 'mysql' as const,
          host: dbHost,
          port: dbPort,
          username: dbUsername,
          password: dbPassword,
          database: dbDatabase,
          entities: [
            Usuario,
            Configuracion,
            Marca,
            Proveedor,
            Categoria,
            Producto,
            Venta,
            DetalleVenta,
            Compra,
            DetalleCompra,
            Gasto,
            Auditoria,
            DetalleAuditoria,
            Arqueo,
            RetiroEfectivo,
          ],
          synchronize: nodeEnv !== 'production',
          logging: nodeEnv === 'development',
        };
      },
      inject: [ConfigService],
    }),
    UsuarioModule,
    ConfiguracionModule,
    MarcaModule,
    CategoriaModule,
    ProveedorModule,
    ProductoModule,
    VentaModule,
    CompraModule,
    GastoModule,
    AuditoriaModule,
    EstadisticaModule,
    AuthModule,
    CajaModule,
    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
