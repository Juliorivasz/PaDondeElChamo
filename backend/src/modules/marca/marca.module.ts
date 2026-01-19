import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarcaService } from './marca.service';
import { MarcaController } from './marca.controller';
import { Marca } from '../../entities/marca.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Marca])],
  controllers: [MarcaController],
  providers: [MarcaService],
})
export class MarcaModule {}
