import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VentaService } from './venta.service';
import { VentaController } from './venta.controller';
import { Venta } from '../../entities/venta.entity';
import { DetalleVenta } from '../../entities/detalle-venta.entity';
import { Producto } from '../../entities/producto.entity';
import { Usuario } from '../../entities/usuario.entity';
import { ProductoModule } from '../producto/producto.module';
import { ConfiguracionModule } from '../configuracion/configuracion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Venta, DetalleVenta, Producto, Usuario]),
    ProductoModule,
    ConfiguracionModule,
  ],
  controllers: [VentaController],
  providers: [VentaService],
})
export class VentaModule {}
