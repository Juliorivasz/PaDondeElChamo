import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ConfiguracionDTO } from "../types/dto/Configuracion";

// ID fijo para el documento de configuración
const CONFIG_DOC_ID = 'general';

// Obtener la configuración actual
export const obtenerConfiguracion = async (): Promise<ConfiguracionDTO> => {
  try {
    const docRef = doc(db, 'configuracion', CONFIG_DOC_ID);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      // Si no existe, crear configuración por defecto
      const defaultConfig: ConfiguracionDTO = {
        descuentoAutomatico: false,
        montoMinimo: 0,
        porcentajeDescuento: 0,
        metodosPagoDescuento: ['EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO'],
        cantProductosRevision: 3,
        revisionActiva: false
      };
      
      await setDoc(docRef, {
        ...defaultConfig,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return defaultConfig;
    }
    
    const data = docSnap.data();
    return {
      descuentoAutomatico: data.descuentoAutomatico || false,
      montoMinimo: data.montoMinimo || 0,
      porcentajeDescuento: data.porcentajeDescuento || 0,
      metodosPagoDescuento: data.metodosPagoDescuento || [],
      cantProductosRevision: data.cantProductosRevision || 3,
      revisionActiva: data.revisionActiva || false
    };
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    throw new Error("No se pudo cargar la configuración");
  }
};

// Actualizar la configuración
export const actualizarConfiguracion = async (data: ConfiguracionDTO): Promise<any> => {
  try {
    const docRef = doc(db, 'configuracion', CONFIG_DOC_ID);
    
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    throw new Error("No se pudo actualizar la configuración");
  }
};
