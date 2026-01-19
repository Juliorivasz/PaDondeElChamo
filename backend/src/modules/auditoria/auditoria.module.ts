import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaController } from './auditoria.controller';
import { AuditoriaService } from './auditoria.service';
import { Auditoria } from '../../entities/auditoria.entity';
import { DetalleAuditoria } from '../../entities/detalle-auditoria.entity';
import { Producto } from '../../entities/producto.entity';
import { Usuario } from '../../entities/usuario.entity';
import { ProductoModule } from '../producto/producto.module';
import { ConfiguracionModule } from '../configuracion/configuracion.module';
import { CajaModule } from '../caja/caja.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auditoria, DetalleAuditoria, Producto, Usuario]),
    ProductoModule,
    ConfiguracionModule,
    CajaModule,
  ],
  controllers: [AuditoriaController],
  providers: [AuditoriaService],
})
export class AuditoriaModule {}
