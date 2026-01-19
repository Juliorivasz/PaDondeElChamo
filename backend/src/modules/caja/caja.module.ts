import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CajaController } from './caja.controller';
import { CajaService } from './caja.service';
import { Arqueo } from '../../entities/arqueo.entity';
import { RetiroEfectivo } from '../../entities/retiro-efectivo.entity';
import { Venta } from '../../entities/venta.entity'; // Will be needed for calculations
import { Auditoria } from '../../entities/auditoria.entity'; // Needed for Stock Control check

@Module({
  imports: [
    TypeOrmModule.forFeature([Arqueo, RetiroEfectivo, Venta, Auditoria]),
  ],
  controllers: [CajaController],
  providers: [CajaService],
  exports: [CajaService],
})
export class CajaModule {}
