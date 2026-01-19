import { MetodoDePago } from '../../../enums/metodo-de-pago.enum';
import { TipoDescuento } from '../../../enums/tipo-descuento.enum';
import { DetalleVentaListaDTO } from './detalle-venta-lista.dto';

export class VentaListaDTO {
  idVenta: number;
  total: number;
  descuento: number;
  montoAdicional: number;
  fechaHora: Date;
  metodoDePago: MetodoDePago;
  detalles: DetalleVentaListaDTO[];
  usuario: string;
  tipoDescuento: TipoDescuento;
  porcentajeAplicado: number;
}
