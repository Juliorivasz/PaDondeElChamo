import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { EstadoCompra } from '../types/usuario.types';

export interface DetalleCompra {
  productoId: string;
  productoNombre?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Compra {
  id?: string;
  total: number;
  fechaHora: any;
  estadoCompra: EstadoCompra;
  proveedorId: string;
  proveedorNombre?: string;
  usuarioId: string;
  usuarioNombre?: string;
  detalles: DetalleCompra[];
  createdAt?: any;
}

export interface CreateCompraDTO {
  proveedorId: string;
  detalles: DetalleCompra[];
}

const COLLECTION_NAME = 'compras';

/**
 * Create a new purchase
 */
export const createCompra = async (
  usuarioId: string,
  compraData: CreateCompraDTO
): Promise<string> => {
  try {
    const compraId = await runTransaction(db, async (transaction) => {
      // Calculate total
      const total = compraData.detalles.reduce((sum, d) => sum + d.subtotal, 0);

      // Create compra document
      const compraRef = doc(collection(db, COLLECTION_NAME));
      transaction.set(compraRef, {
        total,
        fechaHora: serverTimestamp(),
        estadoCompra: EstadoCompra.PENDIENTE,
        proveedorId: compraData.proveedorId,
        usuarioId,
        createdAt: serverTimestamp(),
      });

      // Create detalle subcollection
      for (const detalle of compraData.detalles) {
        const detalleRef = doc(collection(db, COLLECTION_NAME, compraRef.id, 'detalles'));
        transaction.set(detalleRef, {
          productoId: detalle.productoId,
          cantidad: detalle.cantidad,
          precioUnitario: detalle.precioUnitario,
          subtotal: detalle.subtotal,
        });
      }

      return compraRef.id;
    });

    return compraId;
  } catch (error: any) {
    console.error('Error creating compra:', error);
    throw new Error(error.message || 'Error al crear compra');
  }
};

/**
 * Complete a purchase (update stock)
 */
export const completarCompra = async (compraId: string): Promise<void> => {
  try {
    await runTransaction(db, async (transaction) => {
      // Get compra
      const compraRef = doc(db, COLLECTION_NAME, compraId);
      const compraDoc = await transaction.get(compraRef);
      
      if (!compraDoc.exists()) {
        throw new Error('Compra no encontrada');
      }

      const compra = compraDoc.data();
      if (compra.estadoCompra !== EstadoCompra.PENDIENTE) {
        throw new Error('La compra ya fue procesada');
      }

      // Get detalles
      const detallesSnapshot = await getDocs(
        collection(db, COLLECTION_NAME, compraId, 'detalles')
      );

      // Update stock for each product
      for (const detalleDoc of detallesSnapshot.docs) {
        const detalle = detalleDoc.data();
        const productoRef = doc(db, 'productos', detalle.productoId);
        const productoDoc = await transaction.get(productoRef);
        
        if (productoDoc.exists()) {
          const currentStock = productoDoc.data().stock || 0;
          transaction.update(productoRef, {
            stock: currentStock + detalle.cantidad,
            updatedAt: serverTimestamp(),
          });
        }
      }

      // Update compra status
      transaction.update(compraRef, {
        estadoCompra: EstadoCompra.COMPLETADA,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error: any) {
    console.error('Error completing compra:', error);
    throw new Error(error.message || 'Error al completar compra');
  }
};

/**
 * Get all purchases
 */
export const getCompras = async (filters?: {
  fechaInicio?: Date;
  fechaFin?: Date;
  proveedorId?: string;
  estadoCompra?: EstadoCompra;
}): Promise<Compra[]> => {
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

    if (filters?.proveedorId) {
      q = query(q, where('proveedorId', '==', filters.proveedorId));
    }

    if (filters?.estadoCompra) {
      q = query(q, where('estadoCompra', '==', filters.estadoCompra));
    }

    const querySnapshot = await getDocs(q);
    const compras: Compra[] = [];

    for (const docSnap of querySnapshot.docs) {
      const compraData = docSnap.data();
      
      // Get detalles from subcollection
      const detallesSnapshot = await getDocs(
        collection(db, COLLECTION_NAME, docSnap.id, 'detalles')
      );
      const detalles = detallesSnapshot.docs.map(d => d.data()) as DetalleCompra[];

      compras.push({
        id: docSnap.id,
        ...compraData,
        detalles,
      } as Compra);
    }

    return compras;
  } catch (error: any) {
    console.error('Error getting compras:', error);
    throw new Error(error.message || 'Error al obtener compras');
  }
};

/**
 * Get compra by ID
 */
export const getCompraById = async (id: string): Promise<Compra> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Compra no encontrada');
    }

    // Get detalles from subcollection
    const detallesSnapshot = await getDocs(
      collection(db, COLLECTION_NAME, id, 'detalles')
    );
    const detalles = detallesSnapshot.docs.map(d => d.data()) as DetalleCompra[];

    return {
      id: docSnap.id,
      ...docSnap.data(),
      detalles,
    } as Compra;
  } catch (error: any) {
    console.error('Error getting compra:', error);
    throw new Error(error.message || 'Error al obtener compra');
  }
};
