import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Obtener estadísticas generales
export const obtenerEstadisticasGenerales = async () => {
  try {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);

    // Obtener ventas del mes usando campos denormalizados
    const ventasMesQuery = query(
      collection(db, 'ventas'),
      where('mes', '==', hoy.getMonth() + 1),
      where('anio', '==', hoy.getFullYear())
    );
    
    const ventasMesSnapshot = await getDocs(ventasMesQuery);
    
    let totalVentasMes = 0;
    let cantidadVentas = 0;
    
    ventasMesSnapshot.docs.forEach(doc => {
      const venta = doc.data();
      totalVentasMes += venta.total || 0;
      cantidadVentas++;
    });

    // Obtener total de productos
    const productosSnapshot = await getDocs(collection(db, 'productos'));
    const totalProductos = productosSnapshot.size;

    // Obtener productos con stock bajo
    let productosStockBajo = 0;
    productosSnapshot.docs.forEach(doc => {
      const producto = doc.data();
      if (producto.stock <= (producto.stockMinimo || 5)) {
        productosStockBajo++;
      }
    });

    return {
      ventasMes: totalVentasMes,
      cantidadVentas,
      promedioVenta: cantidadVentas > 0 ? totalVentasMes / cantidadVentas : 0,
      totalProductos,
      productosStockBajo
    };
  } catch (error) {
    console.error("Error al obtener estadísticas generales:", error);
    throw error;
  }
};

// Obtener productos más vendidos
export const obtenerProductosMasVendidos = async (limite: number = 10) => {
  try {
    const productosSnapshot = await getDocs(collection(db, 'productos'));
    
    const productos = productosSnapshot.docs.map(doc => ({
      id: doc.id,
      nombre: doc.data().nombre,
      cantVendida: doc.data().cantVendida || 0,
      precio: doc.data().precio || 0
    }));

    // Ordenar por cantidad vendida
    productos.sort((a, b) => b.cantVendida - a.cantVendida);

    return productos.slice(0, limite);
  } catch (error) {
    console.error("Error al obtener productos más vendidos:", error);
    throw error;
  }
};

// Obtener ventas por período
export const obtenerVentasPorPeriodo = async (periodo: 'dia' | 'semana' | 'mes' | 'anio') => {
  try {
    const hoy = new Date();
    let fechaInicio: Date;
    
    switch (periodo) {
      case 'dia':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
        break;
      case 'semana':
        fechaInicio = new Date(hoy);
        fechaInicio.setDate(hoy.getDate() - 7);
        break;
      case 'mes':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
      case 'anio':
        fechaInicio = new Date(hoy.getFullYear(), 0, 1);
        break;
    }

    const ventasSnapshot = await getDocs(collection(db, 'ventas'));
    
    const ventas = ventasSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          fecha: (data.fechaHora as Timestamp)?.toDate(),
          total: data.total || 0,
          metodoDePago: data.metodoDePago || 'EFECTIVO'
        };
      })
      .filter(v => v.fecha >= fechaInicio);

    // Agrupar por fecha
    const ventasPorFecha: Record<string, number> = {};
    
    ventas.forEach(venta => {
      const fecha = venta.fecha.toISOString().split('T')[0];
      ventasPorFecha[fecha] = (ventasPorFecha[fecha] || 0) + venta.total;
    });

    return Object.entries(ventasPorFecha).map(([fecha, total]) => ({
      fecha,
      total
    })).sort((a, b) => a.fecha.localeCompare(b.fecha));
  } catch (error) {
    console.error("Error al obtener ventas por período:", error);
    throw error;
  }
};

// Obtener ventas por método de pago
export const obtenerVentasPorMetodoPago = async () => {
  try {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const ventasSnapshot = await getDocs(collection(db, 'ventas'));
    
    const ventas = ventasSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          fecha: (data.fechaHora as Timestamp)?.toDate(),
          total: data.total || 0,
          metodoDePago: data.metodoDePago || 'EFECTIVO'
        };
      })
      .filter(v => v.fecha >= inicioMes);

    const porMetodo: Record<string, number> = {};
    
    ventas.forEach(venta => {
      porMetodo[venta.metodoDePago] = (porMetodo[venta.metodoDePago] || 0) + venta.total;
    });

    return Object.entries(porMetodo).map(([metodo, total]) => ({
      metodo,
      total
    }));
  } catch (error) {
    console.error("Error al obtener ventas por método de pago:", error);
    throw error;
  }
};
