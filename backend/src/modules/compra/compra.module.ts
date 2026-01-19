import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompraController } from './compra.controller';
import { CompraService } from './compra.service';
import { Compra } from '../../entities/compra.entity';
import { DetalleCompra } from '../../entities/detalle-compra.entity';
import { Producto } from '../../entities/producto.entity';
import { Proveedor } from '../../entities/proveedor.entity';
import { Usuario } from '../../entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Compra, DetalleCompra, Producto, Proveedor, Usuario]),
  ],
  controllers: [CompraController],
  providers: [CompraService],
})
export class CompraModule {}
