import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, IsNull, FindOptionsWhere, LessThan, Not } from 'typeorm';
import { Arqueo } from '../../entities/arqueo.entity';
import { RetiroEfectivo } from '../../entities/retiro-efectivo.entity';
import { Venta } from '../../entities/venta.entity';
import { Usuario } from '../../entities/usuario.entity';
import { MetodoDePago } from '../../enums/metodo-de-pago.enum';

@Injectable()
export class CajaService {
  constructor(
    @InjectRepository(Arqueo)
    private readonly arqueoRepository: Repository<Arqueo>,
    @InjectRepository(RetiroEfectivo)
    private readonly retiroRepository: Repository<RetiroEfectivo>,
    @InjectRepository(Venta)
    private readonly ventaRepository: Repository<Venta>,
  ) {}

  async iniciarSesion(usuario: Usuario): Promise<Arqueo | null> {
    // 0. Check Concurrency: Is there any OPEN arqueo?
    const activeArqueo = await this.arqueoRepository.findOne({
      where: { cierreSesion: IsNull() },
      relations: ['usuario']
    });

    if (activeArqueo) {
        // If it's me, just resume (return existing).
        if (activeArqueo.usuario.idUsuario === usuario.idUsuario) {
            return activeArqueo;
        }
        
        // If it's someone else, and I am an EMPLEADO, I cannot login/start.
        if (usuario.rol === 'EMPLEADO') {
            throw new ConflictException(`Ya existe un turno abierto por ${activeArqueo.usuario.nombre}. No se puede iniciar sesión.`);
        }

        // If I am ADMIN, I can login, but I won't start an Arqueo yet (I might be just observing).
        // Proceed...
    }

    // 1. If ADMIN, do NOT create Arqueo automatically.
    if (usuario.rol === 'ADMIN') {
        return null;
    }

    // 2. If EMPLEADO, create Arqueo automatically.
    return this.iniciarArqueoInternal(usuario);
  }

  // New method for Admin to start explicitly
  async iniciarSesionManual(idUsuario: number, usuarioEntity: Usuario): Promise<Arqueo> {
     // Check if I already have one
     const existing = await this.arqueoRepository.findOne({
         where: { usuario: { idUsuario }, cierreSesion: IsNull() }
     });
     if (existing) return existing;

     // Check GLOBAL concurrency: Is there any OPEN arqueo by anyone else?
     const activeArqueo = await this.arqueoRepository.findOne({
        where: { cierreSesion: IsNull() },
        relations: ['usuario']
     });

     if (activeArqueo) {
         throw new ConflictException(`Ya existe un turno en curso por ${activeArqueo.usuario.nombre}`);
     }

     return this.iniciarArqueoInternal(usuarioEntity);
  }

  private async iniciarArqueoInternal(usuario: Usuario): Promise<Arqueo> {
    // Get initial cash from LAST CLOSED Arqueo
    const lastArqueo = await this.arqueoRepository.findOne({
      where: { cierreSesion: MoreThanOrEqual(new Date(0)) }, 
      order: { cierreSesion: 'DESC' },
    });

    // Calculate interim cash movements if any (from Admin selling without arqueo)
    let saldoFlotante = 0;
    if (lastArqueo) {
        const startLimbo = lastArqueo.cierreSesion;
        const endLimbo = new Date(); // now

        const ventasLimbo = await this.ventaRepository.createQueryBuilder('venta')
           .where('venta.fechaHora > :start', { start: startLimbo })
           .andWhere('venta.fechaHora <= :end', { end: endLimbo })
           .andWhere('venta.metodoDePago = :metodo', { metodo: MetodoDePago.EFECTIVO })
           .getMany(); 

        const totalVentasLimbo = ventasLimbo.reduce((sum, v) => sum + Number(v.total), 0);

        // Retiros in limbo
        // Fetch retiros where fechaHora > startLimbo
        const retiros = await this.retiroRepository.find({
            where: { fechaHora: MoreThanOrEqual(startLimbo) }
        });
        
        const totalRetirosLimbo = retiros.filter(r => {
             return r.fechaHora > startLimbo && r.fechaHora <= endLimbo;
        }).reduce((sum, r) => sum + r.cantidad, 0);

        saldoFlotante = totalVentasLimbo - totalRetirosLimbo;
    }

    const efectivoInicial = (lastArqueo ? Number(lastArqueo.efectivoReal) : 0) + saldoFlotante;

    const nuevoArqueo = this.arqueoRepository.create({
      usuario,
      inicioSesion: new Date(),
      efectivoInicial: efectivoInicial, 
      efectivoTeorico: null, 
      efectivoReal: 0,
      diferencia: 0,
      realizoControlStock: false,
    });

    return this.arqueoRepository.save(nuevoArqueo);
  }
  
  async cerrarSesion(idUsuario: number, efectivoReal: number): Promise<Arqueo> {
    const arqueo = await this.arqueoRepository.findOne({
      where: {
        usuario: { idUsuario },
        cierreSesion: IsNull(),
      },
      relations: ['usuario']
    });

    if (!arqueo) {
      throw new NotFoundException('No hay un turno abierto para este usuario');
    }

    // Calculate "Teorico Final" = Opening + Sales(Cash) - Withdrawals
    const start = arqueo.inicioSesion;
    const end = new Date();

    const ventasEfectivo = await this.ventaRepository
      .createQueryBuilder('venta')
      .where('venta.fechaHora >= :start', { start })
      .andWhere('venta.fechaHora <= :end', { end })
      .andWhere('venta.metodoDePago = :metodo', { metodo: MetodoDePago.EFECTIVO })
      .getMany();
    
    const totalVentasEfectivo = ventasEfectivo.reduce((sum, v) => sum + Number(v.total), 0);
      
    // Fetch Retiros
    // Improved logic with DateTime: simpler and more robust
    const retiros = await this.retiroRepository.find({
        where: {
            fechaHora: Between(start, end)
        }
    });
       
    // Filter just in case DB time diffs, but usually Between is enough for DateTime
    // Using JS filter to be 100% sure with object comparison
    const retirosInSession = retiros.filter(r => r.fechaHora >= start && r.fechaHora <= end);

    const totalRetiros = retirosInSession.reduce((sum, r) => sum + r.cantidad, 0);

    const teoricoFinal = (Number(arqueo.efectivoInicial) + totalVentasEfectivo) - totalRetiros;

    // ADMIN LOGIC: If admin, we trust teorico = real (Quick Close)
    let finalReal = efectivoReal;
    if (arqueo.usuario.rol === 'ADMIN' && (efectivoReal === undefined || efectivoReal === null)) {
        finalReal = teoricoFinal;
    }

    arqueo.cierreSesion = end;
    arqueo.efectivoTeorico = teoricoFinal;
    arqueo.efectivoReal = finalReal;
    arqueo.diferencia = finalReal - teoricoFinal;
    
    return this.arqueoRepository.save(arqueo);
  }

  async marcarStockControlRealizado(idUsuario: number): Promise<void> {
    const arqueo = await this.arqueoRepository.findOne({
      where: {
        usuario: { idUsuario },
        cierreSesion: IsNull(),
      },
    });

    if (arqueo) {
      arqueo.realizoControlStock = true;
      await this.arqueoRepository.save(arqueo);
    }
  }

  async crearRetiro(dto: { cantidad: number; idUsuario: number }): Promise<RetiroEfectivo> {
    const now = new Date();
    const retiro = this.retiroRepository.create({
      cantidad: dto.cantidad,
      fechaHora: now,
      usuario: { idUsuario: dto.idUsuario }
    });
    return this.retiroRepository.save(retiro);
  }

  async getDashboardData() {
    // 1. Total Recaudado Hoy
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date();
    endOfDay.setHours(23,59,59,999);

    const ventasHoy = await this.ventaRepository.find({
      where: {
        fechaHora: Between(startOfDay, endOfDay)
      }
    });

    const totalRecaudado = ventasHoy.reduce((acc, v) => acc + Number(v.total), 0);
    
    // By Method
    const porMetodo = ventasHoy.reduce((acc, v) => {
      acc[v.metodoDePago] = (acc[v.metodoDePago] || 0) + Number(v.total);
      return acc;
    }, {} as Record<string, number>);

    // 2. Efectivo en Caja (Teorico actual)
    const activeArqueo = await this.arqueoRepository.findOne({
        where: { cierreSesion: IsNull() },
        order: { inicioSesion: 'DESC' } // The latest open one
    });

    let efectivoEnCaja = 0;
    
    if (activeArqueo) {
        // Init + Cash Sales since Start - Withdrawals since Start
        const start = activeArqueo.inicioSesion;
        const cashSales = ventasHoy.filter(v => 
            v.metodoDePago === MetodoDePago.EFECTIVO && 
            v.fechaHora >= start
        ).reduce((sum, v) => sum + Number(v.total), 0);

        // Get retiros since start
        const retiros = await this.retiroRepository.find({
            where: { fechaHora: MoreThanOrEqual(start) }
        });

        const retirosSince = retiros.filter(r => r.fechaHora >= start)
                                    .reduce((sum, r) => sum + r.cantidad, 0);

        // Use INITIAL cash + movements
        efectivoEnCaja = Number(activeArqueo.efectivoInicial) + cashSales - retirosSince;
    } else {
        // No active session.
        // We must calculate the "Current Cash" based on the Last Closed Session + Movements since then.
        const last = await this.arqueoRepository.findOne({
            where: { cierreSesion: MoreThanOrEqual(new Date(0)) },
            order: { cierreSesion: 'DESC' }
        });
        
        if (last) {
            const startLimbo = last.cierreSesion;
            
            // Sales since last close (Cash)
            const ventasLimbo = await this.ventaRepository.createQueryBuilder('venta')
                .where('venta.fechaHora > :start', { start: startLimbo })
                .andWhere('venta.metodoDePago = :metodo', { metodo: MetodoDePago.EFECTIVO })
                .getMany();
            const totalVentasLimbo = ventasLimbo.reduce((sum, v) => sum + Number(v.total), 0);

            // Retiros since last close
            const retiros = await this.retiroRepository.find({
                where: { fechaHora: MoreThanOrEqual(startLimbo) }
            });
            // Filter strictly > startLimbo
            const totalRetirosLimbo = retiros.filter(r => r.fechaHora > startLimbo)
                                             .reduce((sum, r) => sum + r.cantidad, 0);
                                             
            efectivoEnCaja = Number(last.efectivoReal) + totalVentasLimbo - totalRetirosLimbo;
        } else {
             efectivoEnCaja = 0;
        }
    }

    // 3. Chart Data (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const ventasSemana = await this.ventaRepository.createQueryBuilder('venta')
        .select("DATE(venta.fechaHora)", "date")
        .addSelect("SUM(venta.total)", "total")
        .where("venta.fechaHora >= :sevenDaysAgo", { sevenDaysAgo })
        .groupBy("DATE(venta.fechaHora)")
        .getRawMany();

    return {
        totalRecaudado,
        porMetodo,
        efectivoEnCaja,
        chartData: ventasSemana
    };
  }

  // Check if current user has done stock control
  async checkEstadoControl(idUsuario: number): Promise<boolean> {
      const arqueo = await this.arqueoRepository.findOne({
          where: { usuario: { idUsuario }, cierreSesion: IsNull() }
      });
      return arqueo ? arqueo.realizoControlStock : false; 
  }

  async getHistorialArqueos(filters: {
    fechaInicio?: Date;
    fechaFin?: Date;
    idUsuario?: number;
    diferencia?: boolean;
    stockCheck?: boolean;
  } = {}) {
    const where: FindOptionsWhere<Arqueo> = {};

    if (filters.fechaInicio && filters.fechaFin) {
      // Adjust end date to end of day
      const endOfDay = new Date(filters.fechaFin);
      endOfDay.setHours(23, 59, 59, 999);
      where.inicioSesion = Between(filters.fechaInicio, endOfDay);
    } else if (filters.fechaInicio) {
      where.inicioSesion = MoreThanOrEqual(filters.fechaInicio);
    } else if (filters.fechaFin) {
       const endOfDay = new Date(filters.fechaFin);
       endOfDay.setHours(23, 59, 59, 999);
       where.inicioSesion = LessThan(endOfDay);
    }

    if (filters.idUsuario) {
      where.usuario = { idUsuario: filters.idUsuario };
    }

    if (filters.diferencia) {
        // We want difference != 0
        where.diferencia = Not(0);
    }

    if (filters.stockCheck !== undefined) {
      where.realizoControlStock = filters.stockCheck;
    }

    return this.arqueoRepository.find({
      where,
      relations: ['usuario'],
      order: { inicioSesion: 'DESC' },
      take: 50 // Keep limit for now, maybe increase or paginate later
    });
  }

  async checkSessionStatus(idUsuario: number): Promise<{ active: boolean }> {
      const arqueo = await this.arqueoRepository.findOne({
          where: { usuario: { idUsuario }, cierreSesion: IsNull() }
      });
      return { active: !!arqueo };
  }
}
