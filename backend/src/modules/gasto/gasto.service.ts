import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gasto } from '../../entities/gasto.entity';
import { Usuario } from '../../entities/usuario.entity';
import { GastoDTO } from './dto/gasto.dto';
import { TipoGasto } from '../../enums/tipo-gasto.enum';

@Injectable()
export class GastoService {
  constructor(
    @InjectRepository(Gasto)
    private gastoRepository: Repository<Gasto>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  async nuevoGasto(idUsuario: number, dto: GastoDTO): Promise<Gasto> {
    const usuario = await this.usuarioRepository.findOneBy({ idUsuario });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const gasto = this.gastoRepository.create({
      ...dto,
      fechaHora: new Date(),
      usuario,
    });

    return this.gastoRepository.save(gasto);
  }

  async modificarGasto(idGasto: number, dto: GastoDTO): Promise<Gasto> {
    const gasto = await this.gastoRepository.findOneBy({ idGasto });
    if (!gasto) throw new NotFoundException('Gasto no encontrado');

    gasto.tipoGasto = dto.tipoGasto;
    gasto.descripcion = dto.descripcion;
    gasto.monto = dto.monto;

    return this.gastoRepository.save(gasto);
  }

  async listarGastos(
    page: number = 0,
    size: number = 10,
    tipoGasto?: TipoGasto,
    fechaInicio?: string,
    fechaFin?: string,
    idUsuario?: number,
  ): Promise<any> {
    const query = this.gastoRepository.createQueryBuilder('gasto')
      .leftJoinAndSelect('gasto.usuario', 'usuario')
      .orderBy('gasto.fechaHora', 'DESC')
      .skip(page * size)
      .take(size);
      
    if (tipoGasto) {
      query.andWhere('gasto.tipoGasto = :tipoGasto', { tipoGasto });
    }
    if (fechaInicio) {
      query.andWhere('gasto.fechaHora >= :fechaInicio', { fechaInicio: new Date(fechaInicio) });
    }
    if (fechaFin) {
       const endDate = new Date(fechaFin);
       endDate.setDate(endDate.getDate() + 1);
       query.andWhere('gasto.fechaHora < :fechaFin', { fechaFin: endDate });
    }
    if (idUsuario) {
      query.andWhere('usuario.idUsuario = :idUsuario', { idUsuario });
    }

    const [gastos, total] = await query.getManyAndCount();

    const content = gastos.map(g => ({
      idGasto: g.idGasto,
      fechaHora: g.fechaHora,
      tipoGasto: g.tipoGasto,
      descripcion: g.descripcion,
      monto: g.monto,
      usuario: g.usuario ? g.usuario.nombre : 'Desconocido',
    }));

    return {
      content,
      totalElements: total,
      totalPages: Math.ceil(total / size),
      size,
      number: page,
      numberOfElements: content.length,
      first: page === 0,
      last: page === Math.ceil(total / size) - 1,
      empty: content.length === 0
    };
  }

  listarTipoGastos(): string[] {
    return Object.values(TipoGasto);
  }
}
