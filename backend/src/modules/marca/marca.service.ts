import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Marca } from '../../entities/marca.entity';
import { MarcaDTO } from './dto/marca.dto';
import { MarcaListaDTO } from './dto/marca-lista.dto';

@Injectable()
export class MarcaService {
  constructor(
    @InjectRepository(Marca)
    private readonly marcaRepository: Repository<Marca>,
  ) {}

  async nuevaMarca(dto: MarcaDTO): Promise<Marca> {
    const marca = this.marcaRepository.create(dto);
    return this.marcaRepository.save(marca);
  }

  async modificarMarca(idMarca: number, dto: MarcaDTO): Promise<Marca> {
    const marca = await this.marcaRepository.findOneBy({ idMarca });
    if (!marca) {
      throw new NotFoundException(`Marca con ID ${idMarca} no encontrada`);
    }
    this.marcaRepository.merge(marca, dto);
    return this.marcaRepository.save(marca);
  }

  async listarMarcas(): Promise<MarcaListaDTO[]> {
    const marcas = await this.marcaRepository.find();
    return marcas.map((marca) => ({
      idMarca: marca.idMarca,
      nombre: marca.nombre,
    }));
  }
}
