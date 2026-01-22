// Tipos para el módulo de Insumos (Ingredientes/Materias Primas)

export type TipoInsumo = 'PRODUCCION' | 'VENDIBLE' | 'MIXTO';

export interface Insumo {
  idInsumo: string;
  nombre: string;
  descripcion?: string;
  stock: number;
  stockMinimo: number;
  unidadMedida: string;
  costo: number;
  idProveedor: string;
  proveedor?: string;  // Nombre del proveedor (para display)
  estado: boolean;
  
  // Campos para gestión avanzada
  tipoInsumo: TipoInsumo;  // PRODUCCION: solo para recetas, VENDIBLE: solo venta, MIXTO: ambos
  precioVenta?: number;     // Solo si es VENDIBLE o MIXTO
  categoria?: string;       // Para organizar en ventas (opcional)
  
  createdAt?: any;
  updatedAt?: any;
}

export interface CrearInsumoDTO {
  nombre: string;
  descripcion?: string;
  stock: number;
  stockMinimo: number;
  unidadMedida: string;
  costo: number;
  idProveedor: string;
  tipoInsumo: TipoInsumo;
  precioVenta?: number;
  categoria?: string;
}

export const UNIDADES_MEDIDA = [
  'kg',
  'gramos',
  'litros',
  'ml',
  'unidades',
  'docenas',
  'paquetes',
  'cajas'
] as const;

export const TIPOS_INSUMO: { value: TipoInsumo; label: string; descripcion: string }[] = [
  { 
    value: 'PRODUCCION', 
    label: 'Producción', 
    descripcion: 'Solo para usar en recetas (ej: harina, huevos)' 
  },
  { 
    value: 'VENDIBLE', 
    label: 'Vendible', 
    descripcion: 'Solo para venta directa (ej: bebidas, snacks)' 
  },
  { 
    value: 'MIXTO', 
    label: 'Mixto', 
    descripcion: 'Se usa en recetas Y se vende (ej: queso)' 
  },
];

export type UnidadMedida = typeof UNIDADES_MEDIDA[number];
