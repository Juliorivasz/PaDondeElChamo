import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Insumo, CrearInsumoDTO } from '../types/dto/Insumo';

// Obtener todos los insumos
export const obtenerInsumos = async (filtros?: {
  busqueda?: string;
  idProveedor?: string;
  bajoStock?: boolean;
}): Promise<Insumo[]> => {
  try {
    // Query simple sin where para evitar índices compuestos
    let q = query(
      collection(db, 'insumos'),
      orderBy('nombre')
    );
    
    const snapshot = await getDocs(q);
    let insumos = snapshot.docs.map(doc => ({
      idInsumo: doc.id,
      ...doc.data()
    } as Insumo));
    
    // CLIENT-SIDE FILTERING
    
    // Filtro por proveedor
    if (filtros?.idProveedor) {
      insumos = insumos.filter(i => i.idProveedor === filtros.idProveedor);
    }
    
    // Filtro de búsqueda
    if (filtros?.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      insumos = insumos.filter(i => 
        i.nombre.toLowerCase().includes(busqueda) ||
        i.descripcion?.toLowerCase().includes(busqueda)
      );
    }
    
    // Filtro de stock bajo
    if (filtros?.bajoStock) {
      insumos = insumos.filter(i => i.stock <= i.stockMinimo);
    }
    
    // Poblar nombres de proveedores
    const proveedoresUnicos = [...new Set(insumos.map(i => i.idProveedor))];
    const proveedoresMap = new Map<string, string>();
    
    for (const idProveedor of proveedoresUnicos) {
      try {
        const proveedorDoc = await getDoc(doc(db, 'proveedores', idProveedor));
        if (proveedorDoc.exists()) {
          proveedoresMap.set(idProveedor, proveedorDoc.data().nombre);
        }
      } catch (error) {
        console.error(`Error al obtener proveedor ${idProveedor}:`, error);
      }
    }
    
    // Asignar nombres de proveedores
    insumos = insumos.map(insumo => ({
      ...insumo,
      proveedor: proveedoresMap.get(insumo.idProveedor) || 'Sin proveedor'
    }));
    
    return insumos;
  } catch (error) {
    console.error("Error al obtener insumos:", error);
    throw new Error("No se pudieron cargar los insumos");
  }
};

// Obtener un insumo por ID
export const obtenerInsumoPorId = async (id: string): Promise<Insumo> => {
  try {
    const docRef = doc(db, 'insumos', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error("Insumo no encontrado");
    }
    
    return {
      idInsumo: docSnap.id,
      ...docSnap.data(),
    } as Insumo;
  } catch (error) {
    console.error("Error al obtener el insumo:", error);
    throw error;
  }
};

// Crear un nuevo insumo
export const crearInsumo = async (datos: CrearInsumoDTO): Promise<Insumo> => {
  try {
    // Verificar si el nombre ya existe
    const q = query(
      collection(db, 'insumos'),
      where('nombre', '==', datos.nombre)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const err: any = new Error(`El insumo ${datos.nombre} ya existe`);
      err.response = { status: 400, data: { message: err.message } };
      throw err;
    }
    
    // Validaciones
    if (datos.stock < 0) {
      throw new Error("El stock no puede ser negativo");
    }
    
    if (datos.costo <= 0) {
      throw new Error("El costo debe ser mayor a 0");
    }
    
    // Crear nuevo documento
    const docRef = doc(collection(db, 'insumos'));
    const insumoData = {
      nombre: datos.nombre,
      descripcion: datos.descripcion || '',
      stock: datos.stock,
      stockMinimo: datos.stockMinimo,
      unidadMedida: datos.unidadMedida,
      costo: datos.costo,
      idProveedor: datos.idProveedor,
      estado: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(docRef, insumoData);
    
    return {
      idInsumo: docRef.id,
      ...insumoData,
    } as Insumo;
  } catch (error: any) {
    console.error("Error al crear el insumo:", error);
    throw error;
  }
};

// Recalcular costos de productos que usan este insumo
const recalcularCostosProductos = async (idInsumo: string): Promise<void> => {
  try {
    // 1. Buscar todos los productos ELABORADOS
    const productosQuery = query(
      collection(db, 'productos'),
      where('tipoProducto', '==', 'ELABORADO')
    );
    const productosSnapshot = await getDocs(productosQuery);
    
    // 2. Filtrar productos que usan este insumo en su receta
    const productosAfectados = productosSnapshot.docs.filter(doc => {
      const receta = doc.data().receta || [];
      return receta.some((ing: any) => ing.idInsumo === idInsumo);
    });
    
    console.log(`📊 Productos afectados por cambio de insumo: ${productosAfectados.length}`);
    
    // 3. Recalcular costo de cada producto
    for (const productoDoc of productosAfectados) {
      const receta = productoDoc.data().receta || [];
      let costoTotal = 0;
      
      // Obtener costo actualizado de cada ingrediente
      for (const ingrediente of receta) {
        const insumoDoc = await getDoc(doc(db, 'insumos', ingrediente.idInsumo));
        if (insumoDoc.exists()) {
          const costoUnitario = insumoDoc.data().costo;
          costoTotal += costoUnitario * ingrediente.cantidad;
        }
      }
      
      // Actualizar costo del producto
      await updateDoc(doc(db, 'productos', productoDoc.id), {
        costo: costoTotal,
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Producto "${productoDoc.data().nombre}": costo actualizado a $${costoTotal.toFixed(2)}`);
    }
  } catch (error) {
    console.error('❌ Error al recalcular costos de productos:', error);
    // No lanzamos error para no bloquear la actualización del insumo
  }
};

// Actualizar un insumo
export const modificarInsumo = async (
  id: string,
  datos: Partial<CrearInsumoDTO>
): Promise<Insumo> => {
  try {
    // Si se está actualizando el nombre, verificar que no exista
    if (datos.nombre) {
      const q = query(
        collection(db, 'insumos'),
        where('nombre', '==', datos.nombre)
      );
      const querySnapshot = await getDocs(q);
      
      const exists = querySnapshot.docs.find(doc => doc.id !== id);
      if (exists) {
        const err: any = new Error(`El insumo ${datos.nombre} ya existe`);
        err.response = { status: 400, data: { message: err.message } };
        throw err;
      }
    }
    
    const docRef = doc(db, 'insumos', id);
    
    // Filter out undefined values (Firestore doesn't accept undefined)
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };
    
    // Only add defined values
    Object.keys(datos).forEach(key => {
      const value = (datos as any)[key];
      if (value !== undefined) {
        updateData[key] = value;
      }
    });
    
    await updateDoc(docRef, updateData);
    
    // Si se modificó el costo, recalcular productos afectados
    if (datos.costo !== undefined) {
      console.log('💰 Costo de insumo modificado, recalculando productos...');
      await recalcularCostosProductos(id);
    }
    
    // Obtener documento actualizado
    const docSnap = await getDoc(docRef);
    return {
      idInsumo: docSnap.id,
      ...docSnap.data(),
    } as Insumo;
  } catch (error) {
    console.error("Error al actualizar el insumo:", error);
    throw error;
  }
};

// Cambiar estado de un insumo
export const cambiarEstadoInsumo = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'insumos', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error("Insumo no encontrado");
    }
    
    const currentEstado = docSnap.data().estado;
    
    await updateDoc(docRef, {
      estado: !currentEstado,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error al cambiar estado del insumo:", error);
    throw error;
  }
};

// Actualizar stock (para consumo/reposición)
export const actualizarStockInsumo = async (
  idInsumo: string,
  cantidad: number,
  operacion: 'incrementar' | 'decrementar'
): Promise<void> => {
  try {
    const docRef = doc(db, 'insumos', idInsumo);
    const cambio = operacion === 'incrementar' ? cantidad : -cantidad;
    
    await updateDoc(docRef, {
      stock: increment(cambio),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error al actualizar stock:", error);
    throw error;
  }
};

// Eliminar un insumo
export const eliminarInsumo = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'insumos', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error al eliminar el insumo:", error);
    throw error;
  }
};
