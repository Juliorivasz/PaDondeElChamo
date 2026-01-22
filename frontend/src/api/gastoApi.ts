import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { GastoDTO, PaginaDeGastos, Gasto } from '../types/dto/Gasto';

// Obtener gastos con filtros
export const obtenerGastos = async (filtros: any): Promise<PaginaDeGastos> => {
  try {
    const fetchLimit = (filtros.size || 20) * 5;
    
    let q = query(
      collection(db, 'gastos'),
      orderBy('fechaHora', 'desc'),
      limit(fetchLimit)
    );
    
    const snapshot = await getDocs(q);
    
    let gastos = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        idGasto: doc.id,
        tipoGasto: data.tipoGasto,
        descripcion: data.descripcion,
        monto: data.monto,
        usuario: data.usuario,
        fechaHora: (data.fechaHora as Timestamp)?.toDate().toISOString() || new Date().toISOString()
      } as Gasto;
    });
    
    // CLIENT-SIDE FILTERING
    
    // Filter by date range
    if (filtros.fechaInicio) {
      const fechaInicio = new Date(filtros.fechaInicio);
      fechaInicio.setHours(0, 0, 0, 0);
      gastos = gastos.filter(g => new Date(g.fechaHora) >= fechaInicio);
    }
    
    if (filtros.fechaFin) {
      const fechaFin = new Date(filtros.fechaFin);
      fechaFin.setHours(23, 59, 59, 999);
      gastos = gastos.filter(g => new Date(g.fechaHora) <= fechaFin);
    }
    
    // Filter by expense type
    if (filtros.tipoGasto) {
      gastos = gastos.filter(g => g.tipoGasto === filtros.tipoGasto);
    }
    
    // Filter by user
    if (filtros.idUsuario) {
      gastos = gastos.filter(g => g.usuario === filtros.idUsuario.toString());
    }
    
    // PAGINATION
    const totalElements = gastos.length;
    const pageSize = filtros.size || 20;
    const currentPage = filtros.page || 0;
    const totalPages = Math.ceil(totalElements / pageSize);
    
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedContent = gastos.slice(startIndex, endIndex);

    return {
      content: paginatedContent,
      totalElements,
      totalPages,
      number: currentPage,
      size: pageSize
    };
  } catch (error) {
    console.error("Error al obtener gastos:", error);
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 20
    };
  }
}

// Crear nuevo gasto
export const crearGasto = async (data: GastoDTO): Promise<void> => {
  try {
    const nuevoGasto = {
      tipoGasto: data.tipoGasto,
      descripcion: data.descripcion || '',
      monto: data.monto,
      usuario: data.usuario || 'Sistema',
      fechaHora: serverTimestamp(),
      dia: new Date().getDate(),
      mes: new Date().getMonth() + 1,
      anio: new Date().getFullYear(),
    };

    await addDoc(collection(db, 'gastos'), nuevoGasto);
  } catch (error) {
    console.error("Error al crear gasto:", error);
    throw error;
  }
}

// Modificar gasto
export const modificarGasto = async (id: string, data: GastoDTO): Promise<void> => {
  try {
    const gastoRef = doc(db, 'gastos', id);
    
    await updateDoc(gastoRef, {
      tipoGasto: data.tipoGasto,
      descripcion: data.descripcion || '',
      monto: data.monto,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error al modificar gasto:", error);
    throw error;
  }
}

// Obtener tipos de gasto
export const obtenerTiposGasto = async (): Promise<string[]> => {
  // Tipos de gasto predefinidos
  return [
    "SERVICIOS",
    "ALQUILER",
    "SUELDOS",
    "MANTENIMIENTO",
    "TRANSPORTE",
    "MARKETING",
    "IMPUESTOS",
    "OTROS"
  ];
}

// Obtener gasto por ID
export const obtenerGastoPorId = async (id: string): Promise<Gasto | null> => {
  try {
    const gastoDoc = await getDoc(doc(db, 'gastos', id));
    
    if (!gastoDoc.exists()) {
      return null;
    }

    const data = gastoDoc.data();
    return {
      idGasto: gastoDoc.id,
      tipoGasto: data.tipoGasto,
      descripcion: data.descripcion,
      monto: data.monto,
      usuario: data.usuario,
      fechaHora: (data.fechaHora as Timestamp)?.toDate().toISOString() || new Date().toISOString()
    } as Gasto;
  } catch (error) {
    console.error("Error al obtener gasto:", error);
    return null;
  }
}
