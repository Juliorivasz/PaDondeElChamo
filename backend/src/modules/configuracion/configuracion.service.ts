import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuracion } from '../../entities/configuracion.entity';
import { CreateConfiguracionDto } from './dto/create-configuracion.dto';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';

@Injectable()
export class ConfiguracionService {
  constructor(
    @InjectRepository(Configuracion)
    private readonly configuracionRepository: Repository<Configuracion>,
  ) {}

  create(createConfiguracionDto: CreateConfiguracionDto) {
    const configuracion = this.configuracionRepository.create(createConfiguracionDto);
    return this.configuracionRepository.save(configuracion);
  }

  findAll() {
    return this.configuracionRepository.find();
  }

  findOne(id: number) {
    return this.configuracionRepository.findOneBy({ idConfiguracion: id });
  }

  async update(id: number, updateConfiguracionDto: UpdateConfiguracionDto) {
    await this.configuracionRepository.update(id, updateConfiguracionDto);
    return this.findOne(id);
  }

  remove(id: number) {
    return this.configuracionRepository.delete(id);
  }

  // Legacy compatibility methods
  async obtenerConfiguracion() {
    const configs = await this.configuracionRepository.find();
    if (configs.length === 0) {
      // Create default config if none exists
      const defaultConfig = this.configuracionRepository.create({
        descuentoAutomatico: false,
        montoMinimo: 0,
        porcentajeDescuento: 0,
        revisionActiva: false,
        cantProductosRevision: 0,
        metodosPagoDescuento: [],
      });
      return this.configuracionRepository.save(defaultConfig);
    }
    return configs[0];
  }

  async actualizarConfiguracion(createConfiguracionDto: CreateConfiguracionDto) {
    const config = await this.obtenerConfiguracion();
    // Merge updates into existing config
    this.configuracionRepository.merge(config, createConfiguracionDto);
    return this.configuracionRepository.save(config);
  }
}
