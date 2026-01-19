import { EstadoControl } from '../../../enums/estado-control.enum';

export class DetalleAuditoriaDTO {
  idDetalleAuditoria: number;
  producto: string;
  categoria: string;
  cantidadSistema: number;
  cantidadReal: number;
  estadoControl: EstadoControl;
}
