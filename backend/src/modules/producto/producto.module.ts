import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductoService } from './producto.service';
import { ProductoController } from './producto.controller';
import { Producto } from '../../entities/producto.entity';
import { Marca } from '../../entities/marca.entity';
import { Categoria } from '../../entities/categoria.entity';
import { Proveedor } from '../../entities/proveedor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Producto, Marca, Categoria, Proveedor])],
  controllers: [ProductoController],
  providers: [ProductoService],
  exports: [ProductoService],
})
export class ProductoModule {}
