import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { Producto } from '../../entities/producto.entity';
import { Marca } from '../../entities/marca.entity';
import { Categoria } from '../../entities/categoria.entity';
import { Proveedor } from '../../entities/proveedor.entity';
import { ProductoDTO } from './dto/producto.dto';
import { ProductoAbmDTO } from './dto/producto-abm.dto';
import { ProductoCompraDTO } from './dto/producto-compra.dto';
import { ProductoVentaDTO } from './dto/producto-venta.dto';
import { CatalogoDTO } from '../venta/dto/catalogo.dto';

@Injectable()
export class ProductoService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    @InjectRepository(Marca)
    private readonly marcaRepository: Repository<Marca>,
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
    @InjectRepository(Proveedor)
    private readonly proveedorRepository: Repository<Proveedor>,
  ) {}

  async nuevoProducto(dto: ProductoDTO): Promise<Producto> {
    const existingName = await this.productoRepository.findOneBy({ nombre: dto.nombre });
    if (existingName) {
      throw new BadRequestException(`El nombre ${dto.nombre} ya existe`);
    }

    if (dto.precio === 0) throw new BadRequestException('El precio del producto no debe ser $0');
    if (dto.costo === 0) throw new BadRequestException('El costo del producto no debe ser $0');

    const producto = this.productoRepository.create(dto);
    producto.estado = true;

    if (dto.idMarca) {
      const marca = await this.marcaRepository.findOneBy({ idMarca: dto.idMarca });
      if (!marca) throw new NotFoundException('Marca no encontrada');
      producto.marca = marca;
    } else {
      producto.marca = null as any;
    }

    const categoria = await this.categoriaRepository.findOneBy({ idCategoria: dto.idCategoria });
    if (!categoria) throw new NotFoundException('Debe seleccionar una categoría');
    producto.categoria = categoria;

    const proveedor = await this.proveedorRepository.findOneBy({ idProveedor: dto.idProveedor });
    if (!proveedor) throw new NotFoundException('Debe seleccionar un proveedor');
    producto.proveedor = proveedor;

    let savedProducto = await this.productoRepository.save(producto);

    savedProducto.codigoDeBarras = this.generarCodigoEAN13(savedProducto.idProducto);
    savedProducto = await this.productoRepository.save(savedProducto);

    return savedProducto;
  }

  async modificarProducto(idProducto: number, dto: ProductoDTO): Promise<Producto> {
    const existingName = await this.productoRepository.findOne({
      where: { nombre: dto.nombre, idProducto: Not(idProducto) },
    });
    if (existingName) throw new BadRequestException(`El nombre ${dto.nombre} ya existe`);



    if (dto.precio === 0) throw new BadRequestException('El precio del producto no debe ser $0');
    if (dto.costo === 0) throw new BadRequestException('El costo del producto no debe ser $0');

    const producto = await this.productoRepository.findOneBy({ idProducto });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    const categoria = await this.categoriaRepository.findOneBy({ idCategoria: dto.idCategoria });
    if (!categoria) throw new NotFoundException('Debe seleccionar una categoría');

    const proveedor = await this.proveedorRepository.findOneBy({ idProveedor: dto.idProveedor });
    if (!proveedor) throw new NotFoundException('Debe seleccionar un proveedor');

    this.productoRepository.merge(producto, dto);
    producto.categoria = categoria;
    producto.proveedor = proveedor;

    if (dto.idMarca) {
      const marca = await this.marcaRepository.findOneBy({ idMarca: dto.idMarca });
      if (!marca) throw new NotFoundException('Marca no encontrada');
      producto.marca = marca;
    } else {
      producto.marca = null as any;
    }

    return this.productoRepository.save(producto);
  }

  async obtenerProductos(
    page: number,
    size: number,
    nombre?: string,
    idCategoria?: number,
    idMarca?: number,
    idProveedor?: number,
    bajoStock?: boolean,
  ): Promise<any> {
    const query = this.productoRepository.createQueryBuilder('producto')
      .leftJoinAndSelect('producto.marca', 'marca')
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .leftJoinAndSelect('producto.proveedor', 'proveedor');

    if (nombre) {
      query.andWhere('producto.nombre LIKE :nombre', { nombre: `%${nombre}%` });
    }

    if (idCategoria) {
      query.andWhere('categoria.idCategoria = :idCategoria', { idCategoria });
    }

    if (idMarca) {
      query.andWhere('marca.idMarca = :idMarca', { idMarca });
    }

    if (idProveedor) {
      query.andWhere('proveedor.idProveedor = :idProveedor', { idProveedor });
    }

    if (bajoStock) {
      query.andWhere('producto.stock <= categoria.stockMinimo');
    }

    const [productos, totalElements] = await query
      .skip(page * size)
      .take(size)
      .getManyAndCount();

    const content = productos.map(p => ({
      idProducto: p.idProducto,
      nombre: p.nombre,
      precio: p.precio,
      costo: p.costo,
      stock: p.stock,
      stockMinimo: p.categoria ? p.categoria.stockMinimo : 0,
      estado: p.estado,
      codigoDeBarras: p.codigoDeBarras,
      marca: p.marca ? p.marca.nombre : '',
      categoria: p.categoria ? p.categoria.nombre : '',
      proveedor: p.proveedor ? p.proveedor.nombre : '',
      idCategoria: p.categoria ? p.categoria.idCategoria : 0,
      imagenUrl: p.imagenUrl || null,
    }));

    return {
      content,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
      size,
      number: page,
      numberOfElements: content.length,
      first: page === 0,
      last: page === Math.ceil(totalElements / size) - 1,
      empty: content.length === 0,
    };
  }

  async listarProductosCompra(): Promise<ProductoCompraDTO[]> {
    const productos = await this.productoRepository.findBy({ estado: true });
    return productos.map(p => ({
      idProducto: p.idProducto,
      nombre: p.nombre,
      costo: p.costo,
    }));
  }

  async listarProductosVenta(): Promise<ProductoVentaDTO[]> {
    const productos = await this.productoRepository.find();
    return productos.map(p => ({
      idProducto: p.idProducto,
      nombre: p.nombre,
      precio: p.precio,
    }));
  }

  async cambiarEstadoProducto(idProducto: number): Promise<void> {
    const producto = await this.productoRepository.findOneBy({ idProducto });
    if (!producto) throw new NotFoundException('Producto no encontrado');
    producto.estado = !producto.estado;
    await this.productoRepository.save(producto);
  }

  async buscarPorCodigo(codigoDeBarras: string): Promise<CatalogoDTO> {
    const producto = await this.productoRepository.findOne({
      where: { codigoDeBarras },
    });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    return {
      tipo: 'Producto',
      id: producto.idProducto,
      nombre: producto.nombre,
      precioFinal: producto.precio,
    };
  }

  private generarCodigoEAN13(idProducto: number): string {
    const base = `2${idProducto.toString().padStart(11, '0')}`;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(base[i]);
      sum += i % 2 === 0 ? digit * 1 : digit * 3;
    }
    const checksum = (10 - (sum % 10)) % 10;
    return `${base}${checksum}`;
  }


  async descontarStock(idProducto: number, cantidadADescontar: number): Promise<void> {
    const producto = await this.productoRepository.findOneBy({ idProducto });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    if (producto.stock < cantidadADescontar) {
      throw new BadRequestException(`Stock insuficiente para el producto ${producto.nombre}`);
    }

    producto.stock -= cantidadADescontar;
    await this.productoRepository.save(producto);
  }
  async ajustarStock(idProducto: number, diferencia: number): Promise<void> {
    const producto = await this.productoRepository.findOneBy({ idProducto });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    producto.stock += diferencia;
    // Prevent negative stock if desired, though audit might force it.
    // For now, let's allow it or clamp to 0?
    // Java legacy didn't seem to check, but let's be safe.
    if (producto.stock < 0) producto.stock = 0;

    await this.productoRepository.save(producto);
  }
}
