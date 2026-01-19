export class IngresosVsEgresosDTO {
  mes: string;
  ingresos: number;
  egresos: number;

  constructor(mes: string, ingresos: number, egresos: number) {
    this.mes = mes;
    this.ingresos = ingresos;
    this.egresos = egresos;
  }
}
