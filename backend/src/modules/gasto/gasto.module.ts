import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GastoController } from './gasto.controller';
import { GastoService } from './gasto.service';
import { Gasto } from '../../entities/gasto.entity';
import { Usuario } from '../../entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Gasto, Usuario]),
  ],
  controllers: [GastoController],
  providers: [GastoService],
})
export class GastoModule {}
