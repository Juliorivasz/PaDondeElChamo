import { TipoGasto } from '../../../enums/tipo-gasto.enum';

export class GastoListaDTO {
  idGasto: number;
  fechaHora: Date;
  tipoGasto: TipoGasto;
  descripcion: string;
  monto: number;
  usuario: string;
}
