import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Categoria } from '../../entities/categoria.entity';
import { CategoriaDTO } from './dto/categoria.dto';
import { CategoriaAbmDTO } from './dto/categoria-abm.dto';

@Injectable()
export class CategoriaService {
  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
  ) {}

  async nuevaCategoria(dto: CategoriaDTO): Promise<Categoria> {
    const existing = await this.categoriaRepository.findOneBy({ nombre: dto.nombre });
    if (existing) {
      throw new BadRequestException(`El nombre ${dto.nombre} ya existe`);
    }

    const categoria = this.categoriaRepository.create(dto);
    categoria.estado = true;
    categoria.stockMinimo = dto.stockMinimo || 0;

    if (dto.idCategoriaPadre) {
      const padre = await this.categoriaRepository.findOneBy({ idCategoria: dto.idCategoriaPadre });
      if (!padre) {
        throw new NotFoundException('No se encontró la categoría padre');
      }
      categoria.categoriaPadre = padre;
    }

    return this.categoriaRepository.save(categoria);
  }

  async modificarCategoria(idCategoria: number, dto: CategoriaDTO): Promise<Categoria> {
    // Solo validar nombre si se está proporcionando
    if (dto.nombre) {
      const existingName = await this.categoriaRepository.findOne({
        where: { nombre: dto.nombre, idCategoria: Not(idCategoria) },
      });

      if (existingName) {
        throw new BadRequestException(`El nombre ${dto.nombre} ya existe`);
      }
    }

    const categoria = await this.categoriaRepository.findOneBy({ idCategoria });
    if (!categoria) {
      throw new NotFoundException(`No se encontró la categoría con ID: ${idCategoria}`);
    }

    this.categoriaRepository.merge(categoria, dto);
    if (dto.stockMinimo !== undefined) {
      categoria.stockMinimo = dto.stockMinimo;
    }

    if (dto.idCategoriaPadre) {
      const padre = await this.categoriaRepository.findOneBy({ idCategoria: dto.idCategoriaPadre });
      if (!padre) {
        throw new NotFoundException('No se encontró la categoría padre');
      }
      categoria.categoriaPadre = padre;
    } else if (dto.idCategoriaPadre === null) {
      categoria.categoriaPadre = null as any;
    }

    return this.categoriaRepository.save(categoria);
  }

  async obtenerCategorias(): Promise<CategoriaAbmDTO[]> {
    const categorias = await this.categoriaRepository.find({
      relations: ['categoriaPadre', 'productos'],
    });

    return categorias.map((cat) => ({
      idCategoria: cat.idCategoria,
      nombre: cat.nombre,
      descripcion: cat.descripcion,
      estado: cat.estado,
      stockMinimo: cat.stockMinimo,
      aplicaDescuentoAutomatico: cat.aplicaDescuentoAutomatico,
      idCategoriaPadre: cat.categoriaPadre ? cat.categoriaPadre.idCategoria : null,
      productos: cat.productos ? cat.productos.map(prod => ({
        idProducto: prod.idProducto,
        nombre: prod.nombre,
        precio: prod.precio
      })) : [],
    }));
  }

  async cambiarEstadoCategoria(idCategoria: number): Promise<void> {
    const categoria = await this.categoriaRepository.findOneBy({ idCategoria });
    if (!categoria) {
      throw new NotFoundException(`No se encontró la categoría con ID: ${idCategoria}`);
    }
    categoria.estado = !categoria.estado;
    await this.categoriaRepository.save(categoria);
  }
}
