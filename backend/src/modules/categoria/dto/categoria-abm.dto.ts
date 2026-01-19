import { ProductoVentaDTO } from '../../producto/dto/producto-venta.dto';

export class CategoriaAbmDTO {
  idCategoria: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  stockMinimo: number;
  aplicaDescuentoAutomatico: boolean;
  idCategoriaPadre: number | null;
  productos: ProductoVentaDTO[];
}
