import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proveedor } from '../../entities/proveedor.entity';
import { ProveedorDTO } from './dto/proveedor.dto';
import { ProveedorAbmDTO } from './dto/proveedor-abm.dto';
import { ProveedorListaDTO } from './dto/proveedor-lista.dto';

@Injectable()
export class ProveedorService {
  constructor(
    @InjectRepository(Proveedor)
    private readonly proveedorRepository: Repository<Proveedor>,
  ) {}

  async nuevoProveedor(dto: ProveedorDTO): Promise<Proveedor> {
    const proveedor = this.proveedorRepository.create(dto);
    proveedor.estado = true;
    return this.proveedorRepository.save(proveedor);
  }

  async modificarProveedor(idProveedor: number, dto: ProveedorDTO): Promise<Proveedor> {
    const proveedor = await this.proveedorRepository.findOneBy({ idProveedor });
    if (!proveedor) {
      throw new NotFoundException(`No se encontró el proveedor con ID: ${idProveedor}`);
    }
    this.proveedorRepository.merge(proveedor, dto);
    return this.proveedorRepository.save(proveedor);
  }

  async obtenerProveedores(): Promise<ProveedorAbmDTO[]> {
    const proveedores = await this.proveedorRepository.find();
    return proveedores.map((prov) => ({
      idProveedor: prov.idProveedor,
      nombre: prov.nombre,
      telefono: prov.telefono,
      email: prov.email,
      estado: prov.estado,
    }));
  }

  async listarProveedores(): Promise<ProveedorListaDTO[]> {
    const proveedores = await this.proveedorRepository.findBy({ estado: true });
    return proveedores.map((prov) => ({
      idProveedor: prov.idProveedor,
      nombre: prov.nombre,
    }));
  }

  async cambiarEstadoProveedor(idProveedor: number): Promise<void> {
    const proveedor = await this.proveedorRepository.findOneBy({ idProveedor });
    if (!proveedor) {
      throw new NotFoundException(`No se encontró el proveedor con ID: ${idProveedor}`);
    }
    proveedor.estado = !proveedor.estado;
    await this.proveedorRepository.save(proveedor);
  }
}
