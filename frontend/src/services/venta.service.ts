import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  writeBatch,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { TipoDescuento, MetodoDePago } from '../types/usuario.types';

export interface DetalleVenta {
  productoId: string;
  productoNombre?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Venta {
  id?: string;
  fechaHora: any;
  total: number;
  descuento?: number;
  porcentajeAplicado?: number;
  montoAdicional?: number;
  tipoDescuento: TipoDescuento;
  metodoDePago: MetodoDePago;
  usuarioId: string;
  usuarioNombre?: string;
  detalles: DetalleVenta[];
  createdAt?: any;
}

export interface CreateVentaDTO {
  detalles: DetalleVenta[];
  tipoDescuento: TipoDescuento;
  descuento?: number;
  porcentajeAplicado?: number;
  montoAdicional?: number;
  metodoDePago: MetodoDePago;
}

const COLLECTION_NAME = 'ventas';

/**
 * Create a new sale with transaction to update stock
 */
export const createVenta = async (
  usuarioId: string,
  ventaData: CreateVentaDTO
): Promise<string> => {
  try {
    // Use transaction to ensure stock is updated atomically
    const ventaId = await runTransaction(db, async (transaction) => {
      // Validate stock for all products
      for (const detalle of ventaData.detalles) {
        const productoRef = doc(db, 'productos', detalle.productoId);
        const productoDoc = await transaction.get(productoRef);
        
        if (!productoDoc.exists()) {
          throw new Error(`Producto ${detalle.productoId} no encontrado`);
        }
        
        const producto = productoDoc.data();
        if (producto.stock < detalle.cantidad) {
          throw new Error(
            `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}, Solicitado: ${detalle.cantidad}`
          );
        }
      }

      // Calculate total
      let total = ventaData.detalles.reduce((sum, d) => sum + d.subtotal, 0);
      
      // Apply discount
      if (ventaData.tipoDescuento === TipoDescuento.PORCENTAJE && ventaData.porcentajeAplicado) {
        total = total * (1 - ventaData.porcentajeAplicado / 100);
      } else if (ventaData.tipoDescuento === TipoDescuento.MONTO_FIJO && ventaData.descuento) {
        total = total - ventaData.descuento;
      }

      // Add additional amount if any
      if (ventaData.montoAdicional) {
        total = total + ventaData.montoAdicional;
      }

      // Create venta document
      const ventaRef = doc(collection(db, COLLECTION_NAME));
      transaction.set(ventaRef, {
        fechaHora: serverTimestamp(),
        total,
        descuento: ventaData.descuento || null,
        porcentajeAplicado: ventaData.porcentajeAplicado || null,
        montoAdicional: ventaData.montoAdicional || null,
        tipoDescuento: ventaData.tipoDescuento,
        metodoDePago: ventaData.metodoDePago,
        usuarioId,
        createdAt: serverTimestamp(),
      });

      // Create detalle subcollection and update stock
      for (const detalle of ventaData.detalles) {
        // Add detalle to subcollection
        const detalleRef = doc(collection(db, COLLECTION_NAME, ventaRef.id, 'detalles'));
        transaction.set(detalleRef, {
          productoId: detalle.productoId,
          cantidad: detalle.cantidad,
          precioUnitario: detalle.precioUnitario,
          subtotal: detalle.subtotal,
        });

        // Update product stock
        const productoRef = doc(db, 'productos', detalle.productoId);
        const productoDoc = await transaction.get(productoRef);
        const currentStock = productoDoc.data()!.stock;
        transaction.update(productoRef, {
          stock: currentStock - detalle.cantidad,
          updatedAt: serverTimestamp(),
        });
      }

      return ventaRef.id;
    });

    return ventaId;
  } catch (error: any) {
    console.error('Error creating venta:', error);
    throw new Error(error.message || 'Error al crear venta');
  }
};

/**
 * Get sales with pagination and filters
 */
export const getVentas = async (
  page: number = 1,
  pageSize: number = 10,
  filters?: {
    fechaInicio?: Date;
    fechaFin?: Date;
    usuarioId?: string;
    metodoDePago?: MetodoDePago;
  }
): Promise<{ ventas: Venta[]; total: number }> => {
  try {
    let q = query(collection(db, COLLECTION_NAME), orderBy('fechaHora', 'desc'));

    // Apply filters
    if (filters?.fechaInicio && filters?.fechaFin) {
      q = query(
        q,
        where('fechaHora', '>=', Timestamp.fromDate(filters.fechaInicio)),
        where('fechaHora', '<=', Timestamp.fromDate(filters.fechaFin))
      );
    }

    if (filters?.usuarioId) {
      q = query(q, where('usuarioId', '==', filters.usuarioId));
    }

    if (filters?.metodoDePago) {
      q = query(q, where('metodoDePago', '==', filters.metodoDePago));
    }

    // Get all matching documents (for total count)
    const allDocs = await getDocs(q);
    const total = allDocs.size;

    // Apply pagination
    q = query(q, firestoreLimit(pageSize));

    const querySnapshot = await getDocs(q);
    const ventas: Venta[] = [];

    for (const docSnap of querySnapshot.docs) {
      const ventaData = docSnap.data();
      
      // Get detalles from subcollection
      const detallesSnapshot = await getDocs(
        collection(db, COLLECTION_NAME, docSnap.id, 'detalles')
      );
      const detalles = detallesSnapshot.docs.map(d => d.data()) as DetalleVenta[];

      ventas.push({
        id: docSnap.id,
        ...ventaData,
        detalles,
      } as Venta);
    }

    return { ventas, total };
  } catch (error: any) {
    console.error('Error getting ventas:', error);
    throw new Error(error.message || 'Error al obtener ventas');
  }
};

/**
 * Get venta by ID with details
 */
export const getVentaById = async (id: string): Promise<Venta> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Venta no encontrada');
    }

    // Get detalles from subcollection
    const detallesSnapshot = await getDocs(
      collection(db, COLLECTION_NAME, id, 'detalles')
    );
    const detalles = detallesSnapshot.docs.map(d => d.data()) as DetalleVenta[];

    return {
      id: docSnap.id,
      ...docSnap.data(),
      detalles,
    } as Venta;
  } catch (error: any) {
    console.error('Error getting venta:', error);
    throw new Error(error.message || 'Error al obtener venta');
  }
};

/**
 * Get catalog (active products for sales)
 */
export const getCatalogo = async () => {
  try {
    const q = query(
      collection(db, 'productos'),
      where('estado', '==', true),
      where('stock', '>', 0),
      orderBy('stock'),
      orderBy('nombre')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error: any) {
    console.error('Error getting catalogo:', error);
    throw new Error(error.message || 'Error al obtener catálogo');
  }
};
