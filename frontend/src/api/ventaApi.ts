
import {
  collection,
  doc,
  getDocs,
  query,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ItemCatalogo, VentaDTO, PaginaDeVentas, VentaHistorial } from "../types/dto/Venta";

// Obtener catálogo unificado para la terminal de venta
export const obtenerCatalogoVenta = async (): Promise<ItemCatalogo[]> => {
  try {
    const productosSnapshot = await getDocs(collection(db, 'productos'));
    const categoriasSnapshot = await getDocs(collection(db, 'categorias'));
    
    if (productosSnapshot.docs.length === 0) {
      return [];
    }
    
    // Crear mapa de categorías
    const categoriasMap = new Map();
    categoriasSnapshot.docs.forEach(doc => {
      const categoria = doc.data();
      categoriasMap.set(doc.id, {
        aplicaDescuentoAutomatico: categoria.aplicaDescuentoAutomatico || false,
        porcentaje: categoria.porcentaje || null
      });
    });
    
    const productos = productosSnapshot.docs.map(doc => {
      const data = doc.data();
      const categoria = categoriasMap.get(data.idCategoria);
      
      // Calcular precio con descuento si la categoría tiene descuento activo
      let precioConDescuento = null;
      if (categoria?.aplicaDescuentoAutomatico && categoria?.porcentaje) {
        precioConDescuento = data.precio * (1 - categoria.porcentaje / 100);
      }
      
      return {
        tipo: "PRODUCTO" as "PRODUCTO",
        id: doc.id as any,
        nombre: data.nombre,
        precioFinal: data.precio,
        idCategoria: data.idCategoria,
        aplicaDescuentoAutomatico: categoria?.aplicaDescuentoAutomatico || false,
        porcentaje: categoria?.porcentaje || null,
        precioConDescuento,
        cantidadMinima: data.cantidadMinima || null,
        nuevoPrecio: data.nuevoPrecio || null
      };
    });
    
    return productos.sort((a, b) => a.nombre.localeCompare(b.nombre));
  } catch (error) {
    console.error("Error al obtener catálogo:", error);
    return [];
  }
};

// Crear nueva venta con transacción
export const crearVenta = async (data: VentaDTO): Promise<void> => {
  try {
    await runTransaction(db, async (transaction) => {
      let totalVenta = 0;
      const ventaDetalles: any[] = [];
      const stockUpdates: Array<{ref: any, newStock: number}> = [];

      // PHASE 1: ALL READS FIRST
      for (const detalle of data.detalles) {
        const idProducto = detalle.idProducto.toString();
        const cantidad = detalle.cantidad;
        
        const productoRef = doc(db, 'productos', idProducto);
        const productoDoc = await transaction.get(productoRef);

        if (!productoDoc.exists()) {
          throw new Error(`Producto ${idProducto} no encontrado`);
        }

        const productoData = productoDoc.data();
        const precio = productoData.precio;
        const subtotal = precio * cantidad;
        totalVenta += subtotal;

        ventaDetalles.push({
          idProducto,
          nombre: productoData.nombre,
          cantidad,
          precioUnitario: precio,
          subtotal
        });

        // ALWAYS deduct product stock (Hybrid Model)
        const stockActual = productoData.stock || 0;
        const nuevoStock = stockActual - cantidad;
        stockUpdates.push({ ref: productoRef, newStock: nuevoStock });

        // If ELABORADO, ALSO deduct ingredients (Recipe)
        if (productoData.tipoProducto === 'ELABORADO') {
          if (productoData.receta && productoData.receta.length > 0) {
            for (const ingrediente of productoData.receta) {
              const insumoRef = doc(db, 'insumos', ingrediente.idInsumo);
              const insumoDoc = await transaction.get(insumoRef);
              
              if (!insumoDoc.exists()) {
                throw new Error(`Insumo ${ingrediente.nombreInsumo} no encontrado`);
              }

              const stockInsumo = insumoDoc.data().stock || 0;
              const cantidadNecesaria = ingrediente.cantidad * cantidad;
              const colNuevaStockInsumo = stockInsumo - cantidadNecesaria;

              stockUpdates.push({ ref: insumoRef, newStock: colNuevaStockInsumo });
            }
          } else {
             console.warn(`Producto ${productoData.nombre} es ELABORADO pero no tiene receta.`);
          }
        }
      }

      // PHASE 2: ALL WRITES AFTER ALL READS
      
      // Update all stock
      for (const update of stockUpdates) {
        transaction.update(update.ref, { stock: update.newStock });
      }

      // Create sale document
      const ventaRef = doc(collection(db, 'ventas'));
      const ventaData = {
        fechaHora: serverTimestamp(),
        usuario: "Sistema",
        total: totalVenta - (data.descuento || 0) + (data.montoAdicional || 0),
        subtotal: totalVenta,
        descuento: data.descuento || 0,
        montoAdicional: data.montoAdicional || 0,
        metodoDePago: data.metodoDePago,
        tipoDescuento: data.tipoDescuento,
        detalles: ventaDetalles,
        dia: new Date().getDate(),
        mes: new Date().getMonth() + 1,
        anio: new Date().getFullYear(),
      };

      transaction.set(ventaRef, ventaData);
    });

  } catch (error) {
    console.error("Error al procesar venta:", error);
    throw error;
  }
}

// Obtener métodos de pago (Hardcoded or from Config)
export const obtenerMetodosDePago = async (): Promise<string[]> => {
  return ["EFECTIVO", "TRANSFERENCIA", "DEBITO", "CREDITO"];
}

// Obtener ventas paginadas con filtros
export const obtenerVentas = async (filtros: any): Promise<PaginaDeVentas> => {
  try {
    // Fetch more data than needed to account for filtering
    const fetchLimit = (filtros.tamaño || 20) * 5; // Fetch 5x to ensure we have enough after filtering
    
    let q = query(
      collection(db, 'ventas'), 
      orderBy('fechaHora', 'desc'),
      limit(fetchLimit)
    );
    
    const snapshot = await getDocs(q);
    
    let ventas = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        idVenta: doc.id as any,
        ...data,
        fechaHora: (data.fechaHora as Timestamp)?.toDate().toISOString() || new Date().toISOString()
      } as VentaHistorial;
    });
    
    // CLIENT-SIDE FILTERING
    
    // Filter by date range
    if (filtros.fechaInicio) {
      const fechaInicio = new Date(filtros.fechaInicio);
      fechaInicio.setHours(0, 0, 0, 0);
      ventas = ventas.filter(v => new Date(v.fechaHora) >= fechaInicio);
    }
    
    if (filtros.fechaFin) {
      const fechaFin = new Date(filtros.fechaFin);
      fechaFin.setHours(23, 59, 59, 999);
      ventas = ventas.filter(v => new Date(v.fechaHora) <= fechaFin);
    }
    
    // Filter by payment method
    if (filtros.metodoDePago) {
      ventas = ventas.filter(v => v.metodoDePago === filtros.metodoDePago);
    }
    
    // Filter by user (for admin)
    if (filtros.idUsuario) {
      ventas = ventas.filter(v => v.usuario === filtros.idUsuario.toString());
    }
    
    // PAGINATION
    const totalElements = ventas.length;
    const pageSize = filtros.tamaño || 20;
    const currentPage = filtros.pagina || 0;
    const totalPages = Math.ceil(totalElements / pageSize);
    
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedContent = ventas.slice(startIndex, endIndex);

    return {
      content: paginatedContent,
      totalElements,
      totalPages,
      number: currentPage,
      size: pageSize
    };
  } catch (error) {
    console.error("Error obteniendo ventas:", error);
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 20
    };
  }
}
