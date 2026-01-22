// Enums and Types for Firebase services

export enum RolUsuario {
  ADMIN = 'ADMIN',
  EMPLEADO = 'EMPLEADO',
}

export enum TipoDescuento {
  NINGUNO = 'NINGUNO',
  PORCENTAJE = 'PORCENTAJE',
  MONTO_FIJO = 'MONTO_FIJO',
}

export enum MetodoDePago {
  EFECTIVO = 'EFECTIVO',
  TARJETA = 'TARJETA',
  TRANSFERENCIA = 'TRANSFERENCIA',
  MIXTO = 'MIXTO',
}

export enum EstadoCompra {
  PENDIENTE = 'PENDIENTE',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA',
}

export enum EstadoAuditoria {
  PENDIENTE = 'PENDIENTE',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA',
}

export interface Usuario {
  uid: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}
