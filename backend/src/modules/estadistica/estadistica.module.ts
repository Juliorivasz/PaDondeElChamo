import { Module } from '@nestjs/common';
import { EstadisticaController } from './estadistica.controller';
import { EstadisticaService } from './estadistica.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venta } from '../../entities/venta.entity';
import { DetalleVenta } from '../../entities/detalle-venta.entity';
import { Producto } from '../../entities/producto.entity';
import { Compra } from '../../entities/compra.entity';
import { Gasto } from '../../entities/gasto.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Venta, DetalleVenta, Producto, Compra, Gasto]),
  ],
  controllers: [EstadisticaController],
  providers: [EstadisticaService],
})
export class EstadisticaModule {}
