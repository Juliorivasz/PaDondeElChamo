import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { ProductoDTO } from './dto/producto.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('producto')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  @Post('nuevo')
  @Roles('ADMIN')
  nuevoProducto(@Body() dto: ProductoDTO) {
    return this.productoService.nuevoProducto(dto);
  }

  @Put('modificar/:idProducto')
  @Roles('ADMIN')
  modificarProducto(@Param('idProducto') idProducto: string, @Body() dto: ProductoDTO) {
    return this.productoService.modificarProducto(+idProducto, dto);
  }

  @Get('abm')
  obtenerProductos(
    @Query('page') page: number = 0,
    @Query('size') size: number = 10,
    @Query('nombre') nombre?: string,
    @Query('idCategoria') idCategoria?: number,
    @Query('idMarca') idMarca?: number,
    @Query('idProveedor') idProveedor?: number,
    @Query('bajoStock') bajoStock?: boolean,
  ) {
    return this.productoService.obtenerProductos(
      +page,
      +size,
      nombre,
      idCategoria ? +idCategoria : undefined,
      idMarca ? +idMarca : undefined,
      idProveedor ? +idProveedor : undefined,
      bajoStock === true || String(bajoStock) === 'true',
    );
  }

  @Get('listaCompra')
  listarProductosCompra() {
    return this.productoService.listarProductosCompra();
  }

  @Get('listaVenta')
  listarProductosVenta() {
    return this.productoService.listarProductosVenta();
  }

  @Patch('cambiarEstado/:idProducto')
  cambiarEstadoProducto(@Param('idProducto') idProducto: string) {
    return this.productoService.cambiarEstadoProducto(+idProducto);
  }

  @Get('buscarPorCodigo/:codigoDeBarras')
  buscarPorCodigo(@Param('codigoDeBarras') codigoDeBarras: string) {
    return this.productoService.buscarPorCodigo(codigoDeBarras);
  }
}
