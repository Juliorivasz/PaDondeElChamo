import { DetalleAuditoriaDTO } from './detalle-auditoria.dto';
import { EstadoAuditoria } from '../../../enums/estado-auditoria.enum';

export class AuditoriaDTO {
  idAuditoria: number;
  fechaHora: Date;
  usuario: string;
  observacion: string;
  estado: EstadoAuditoria;
  detalles: DetalleAuditoriaDTO[];
}
