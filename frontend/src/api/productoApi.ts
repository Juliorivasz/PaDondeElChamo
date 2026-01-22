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
  limit,
  startAfter,
  QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Producto {
  idProducto: string;
  nombre: string;
  precio: number;
  costo: number;
  stock: number;
  estado: boolean;
  codigoDeBarras?: string;
  idMarca: string;
  idCategoria: string;
  idProveedor: string;
  imagenUrl?: string;  // Temporalmente no se usa
  // Campos adicionales para compatibilidad con ProductoAbm
  marca?: string;
  categoria?: string;
  proveedor?: string;
  stockMinimo?: number;
  porcentaje?: number | null;
  precioConDescuento?: number | null;
  cantidadMinima?: number | null;
  nuevoPrecio?: number | null;
  cantVendida?: number;
  cantComprada?: number;
  idDescuento?: string | null;
  idOferta?: string | null;
  createdAt?: any;
  updatedAt?: any;
}

export interface CrearProductoDTO {
  nombre: string;
  precio: number;
  costo: number;
  stock: number;
  codigoDeBarras?: string;
  idMarca: string;
  idCategoria: string;
  idProveedor?: string;
  imagenUrl?: string | null;
  tipoProducto: 'SIMPLE' | 'ELABORADO' | 'MIXTO';
  receta?: {
    idInsumo: string;
    nombreInsumo: string;
    cantidad: number;
    unidadMedida: string;
    costoUnitario?: number;
    subtotal?: number;
  }[];
}

export interface DatosProductosPaginados {
  productos: Producto[];
  totalCount: number;
  hasMore: boolean;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
}

// Obtener productos con paginación
export const obtenerProductosPaginados = async (
  pageSize: number = 25,
  lastDocument?: QueryDocumentSnapshot<DocumentData>,
  filtros?: {
    busqueda?: string;
    idCategoria?: string;
    idMarca?: string;
    idProveedor?: string;
    estado?: boolean;
  }
): Promise<DatosProductosPaginados> => {
  try {
    // Query simple sin where para evitar índices compuestos
    let q = query(
      collection(db, 'productos'),
      orderBy('nombre'),
      limit(pageSize * 5) // Fetch más para compensar filtrado client-side
    );
    
    if (lastDocument) {
      q = query(q, startAfter(lastDocument), limit(pageSize * 5));
    }
    
    const snapshot = await getDocs(q);
    
    let productos = snapshot.docs.map(doc => ({
      idProducto: doc.id,
      ...doc.data()
    } as Producto));
    
    // CLIENT-SIDE FILTERING
    
    // Filtro por estado
    if (filtros?.estado !== undefined) {
      productos = productos.filter(p => p.estado === filtros.estado);
    }
    
    // Filtro por categoría
    if (filtros?.idCategoria) {
      productos = productos.filter(p => p.idCategoria === filtros.idCategoria);
    }
    
    // Filtro por marca
    if (filtros?.idMarca) {
      productos = productos.filter(p => p.idMarca === filtros.idMarca);
    }
    
    // Filtro por proveedor
    if (filtros?.idProveedor) {
      productos = productos.filter(p => p.idProveedor === filtros.idProveedor);
    }
    
    // Filtro de búsqueda (nombre o código de barras)
    if (filtros?.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      productos = productos.filter(p => 
        p.nombre.toLowerCase().includes(busqueda) ||
        p.codigoDeBarras?.toLowerCase().includes(busqueda)
      );
    }
    
    // Poblar nombres de marcas, categorías y proveedores
    const marcasUnicas = [...new Set(productos.map(p => p.idMarca).filter(Boolean))];
    const categoriasUnicas = [...new Set(productos.map(p => p.idCategoria).filter(Boolean))];
    const proveedoresUnicos = [...new Set(productos.map(p => p.idProveedor).filter(Boolean))];
    
    const marcasMap = new Map<string, string>();
    const categoriasMap = new Map<string, string>();
    const proveedoresMap = new Map<string, string>();
    
    // Fetch marcas
    for (const idMarca of marcasUnicas) {
      try {
        const marcaDoc = await getDoc(doc(db, 'marcas', idMarca));
        if (marcaDoc.exists()) {
          marcasMap.set(idMarca, marcaDoc.data().nombre);
        }
      } catch (error) {
        console.error(`Error al obtener marca ${idMarca}:`, error);
      }
    }
    
    // Fetch categorías
    for (const idCategoria of categoriasUnicas) {
      try {
        const categoriaDoc = await getDoc(doc(db, 'categorias', idCategoria));
        if (categoriaDoc.exists()) {
          categoriasMap.set(idCategoria, categoriaDoc.data().nombre);
        }
      } catch (error) {
        console.error(`Error al obtener categoría ${idCategoria}:`, error);
      }
    }
    
    // Fetch proveedores
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
    
    // Asignar nombres
    productos = productos.map(producto => ({
      ...producto,
      marca: marcasMap.get(producto.idMarca) || undefined,
      categoria: categoriasMap.get(producto.idCategoria) || undefined,
      proveedor: proveedoresMap.get(producto.idProveedor) || undefined
    }));
    
    // Paginación después del filtrado
    const hasMore = productos.length > pageSize;
    const paginatedProducts = productos.slice(0, pageSize);
    
    // Obtener total count (solo cuando no hay paginación previa)
    let totalCount = productos.length;
    if (!lastDocument) {
      const countQuery = query(collection(db, 'productos'));
      const countSnapshot = await getDocs(countQuery);
      totalCount = countSnapshot.size;
    }
    
    return {
      productos: paginatedProducts,
      totalCount,
      hasMore,
      lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
    };
  } catch (error) {
    console.error("Error al obtener productos:", error);
    throw new Error("No se pudieron cargar los productos");
  }
};

// Obtener un producto por ID
export const obtenerProductoPorId = async (id: string): Promise<Producto> => {
  try {
    const docRef = doc(db, 'productos', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error("Producto no encontrado");
    }
    
    return {
      idProducto: docSnap.id,
      ...docSnap.data(),
    } as Producto;
  } catch (error) {
    console.error("Error al obtener el producto:", error);
    throw error;
  }
};

// Buscar producto por código de barras
export const buscarProductoPorCodigo = async (codigo: string): Promise<Producto | null> => {
  try {
    const q = query(
      collection(db, 'productos'),
      where('codigoDeBarras', '==', codigo),
      where('estado', '==', true)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      idProducto: doc.id,
      ...doc.data(),
    } as Producto;
  } catch (error) {
    console.error("Error al buscar producto por código:", error);
    return null;
  }
};

// Crear un nuevo producto
export const crearProducto = async (datos: CrearProductoDTO): Promise<Producto> => {
  try {
    // Verificar si el nombre ya existe
    const q = query(
      collection(db, 'productos'),
      where('nombre', '==', datos.nombre)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const err: any = new Error(`El producto ${datos.nombre} ya existe`);
      err.response = { status: 400, data: { message: err.message } };
      throw err;
    }
    
    // Crear nuevo documento
    const docRef = doc(collection(db, 'productos'));
    const productoData = {
      nombre: datos.nombre,
      precio: datos.precio,
      costo: datos.costo,
      stock: datos.stock,
      estado: true,
      codigoDeBarras: datos.codigoDeBarras || '',
      idMarca: datos.idMarca,
      idCategoria: datos.idCategoria,
      idProveedor: datos.idProveedor,
      imagenUrl: datos.imagenUrl || null,
      tipoProducto: datos.tipoProducto,
      receta: datos.receta || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(docRef, productoData);
    
    return {
      idProducto: docRef.id,
      ...productoData,
    } as Producto;
  } catch (error: any) {
    console.error("Error al crear el producto:", error);
    throw error;
  }
};

// Actualizar un producto
export const modificarProducto = async (
  id: string,
  datos: Partial<CrearProductoDTO>
): Promise<Producto> => {
  try {
    // Si se está actualizando el nombre, verificar que no exista
    if (datos.nombre) {
      const q = query(
        collection(db, 'productos'),
        where('nombre', '==', datos.nombre)
      );
      const querySnapshot = await getDocs(q);
      
      // Verificar que no sea el mismo producto
      const exists = querySnapshot.docs.find(doc => doc.id !== id);
      if (exists) {
        const err: any = new Error(`El producto ${datos.nombre} ya existe`);
        err.response = { status: 400, data: { message: err.message } };
        throw err;
      }
    }
    
    const docRef = doc(db, 'productos', id);
    
    const updateData: any = {
      ...datos,
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(docRef, updateData);
    
    // Obtener documento actualizado
    const docSnap = await getDoc(docRef);
    return {
      idProducto: docSnap.id,
      ...docSnap.data(),
    } as Producto;
  } catch (error) {
    console.error("Error al actualizar el producto:", error);
    throw error;
  }
};

// Cambiar estado de un producto
export const cambiarEstadoProducto = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'productos', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error("Producto no encontrado");
    }
    
    const currentEstado = docSnap.data().estado;
    
    await updateDoc(docRef, {
      estado: !currentEstado,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error al cambiar estado del producto:", error);
    throw error;
  }
};

// Actualizar stock (para ventas/compras)
export const actualizarStock = async (
  idProducto: string,
  cantidad: number,
  operacion: 'incrementar' | 'decrementar'
): Promise<void> => {
  try {
    const docRef = doc(db, 'productos', idProducto);
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

// Obtener productos para ventas (activos con stock)
export const obtenerListaProductosVenta = async (): Promise<Producto[]> => {
  try {
    const q = query(
      collection(db, 'productos'),
      where('estado', '==', true),
      where('stock', '>', 0),
      orderBy('stock'),
      orderBy('nombre')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      idProducto: doc.id,
      ...doc.data(),
    } as Producto));
  } catch (error) {
    console.error("Error al obtener productos para venta:", error);
    throw new Error("No se pudieron cargar los productos");
  }
};

// Obtener productos para compras (activos)
export const obtenerListaProductosCompra = async (): Promise<Producto[]> => {
  try {
    const q = query(
      collection(db, 'productos'),
      orderBy('nombre')
    );
    const snapshot = await getDocs(q);
    
    // Filtrar por estado activo en cliente para evitar índice compuesto
    return snapshot.docs
      .filter(doc => doc.data().estado === true)
      .map(doc => ({
      idProducto: doc.id,
      ...doc.data(),
    } as Producto));
  } catch (error) {
    console.error("Error al obtener productos para compra:", error);
    throw new Error("No se pudieron cargar los productos");
  }
};

// Eliminar un producto
export const eliminarProducto = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'productos', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error al eliminar el producto:", error);
    throw error;
  }
};
