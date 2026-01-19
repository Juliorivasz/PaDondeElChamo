import { EstadoCompra } from '../../../enums/estado-compra.enum';

export class CompraListaDTO {
  idCompra: number;
  fechaHora: Date;
  total: number;
  estadoCompra: EstadoCompra;
  proveedor: string;
  usuario: string;
}
