import {
  collection,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { KpiDTO, DatosParaGrafico, FiltrosFecha } from "../types/dto/Estadisticas";

// Obtener KPIs del dashboard
export const obtenerKpis = async (fechas?: FiltrosFecha): Promise<KpiDTO[]> => {
  try {
    const hoy = new Date();
    
    // Si no se proporcionan fechas, usar el mes actual
    const fechaInicio = fechas?.fechaInicio 
      ? new Date(fechas.fechaInicio) 
      : new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    const fechaFin = fechas?.fechaFin 
      ? new Date(fechas.fechaFin) 
      : new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    // Obtener TODAS las ventas y filtrar por rango de fechas
    const ventasSnapshot = await getDocs(collection(db, 'ventas'));
    
    let totalRecaudado = 0;
    let totalCosto = 0;
    let cantidadVentas = 0;
    
    ventasSnapshot.docs.forEach(doc => {
      const venta = doc.data();
      const fechaVenta = (venta.fechaHora as Timestamp)?.toDate();
      
      // Filtrar por rango de fechas
      if (fechaVenta && fechaVenta >= fechaInicio && fechaVenta <= fechaFin) {
        cantidadVentas++;
        totalRecaudado += venta.total || 0;
        // Calcular costo de los productos vendidos
        if (venta.detalles) {
          venta.detalles.forEach((detalle: any) => {
            totalCosto += (detalle.costo || 0) * detalle.cantidad;
          });
        }
      }
    });
    
    // Obtener TODOS los gastos y filtrar por rango de fechas
    const gastosSnapshot = await getDocs(collection(db, 'gastos'));
    let totalGastos = 0;
    
    gastosSnapshot.docs.forEach(doc => {
      const gasto = doc.data();
      const fechaGasto = (gasto.fechaHora as Timestamp)?.toDate();
      
      // Filtrar por rango de fechas
      if (fechaGasto && fechaGasto >= fechaInicio && fechaGasto <= fechaFin) {
        totalGastos += gasto.monto || 0;
      }
    });
    
    // Ganancia Neta = Ingresos - Costos - Gastos
    const ganancia = totalRecaudado - totalCosto - totalGastos;
    
    // Obtener productos (estos NO se filtran por fecha, son datos actuales)
    const productosSnapshot = await getDocs(collection(db, 'productos'));
    let valorStock = 0;
    let valorPosiblesVentas = 0;
    let productosStockBajo = 0;
    
    productosSnapshot.docs.forEach(doc => {
      const producto = doc.data();
      const stock = producto.stock || 0;
      const costo = producto.costo || 0;
      const precio = producto.precio || 0;
      const stockMinimo = producto.stockMinimo || 5;
      
      valorStock += stock * costo;
      valorPosiblesVentas += stock * precio;
      
      if (stock <= stockMinimo) {
        productosStockBajo++;
      }
    });
    
    // Etiquetas dinámicas según si hay filtro o no
    const etiquetaPeriodo = fechas ? "Periodo Seleccionado" : "este Mes";
    
    return [
      { nombre: `Recaudado ${etiquetaPeriodo}`, valor: totalRecaudado },
      { nombre: `Ganancia ${etiquetaPeriodo}`, valor: ganancia },
      { nombre: `Gastos ${etiquetaPeriodo}`, valor: totalGastos },
      { nombre: `Ventas ${etiquetaPeriodo}`, valor: cantidadVentas },
      { nombre: "Productos Activos", valor: productosSnapshot.size },
      { nombre: "Stock Bajo", valor: productosStockBajo },
      { nombre: "En Stock", valor: valorStock },
      { nombre: "En Posibles Ventas", valor: valorPosiblesVentas }
    ];
  } catch (error) {
    console.error("Error al obtener KPIs:", error);
    return [];
  }
};

// Obtener datos de ingresos vs egresos
export const obtenerIngresosVsEgresos = async (fechas: FiltrosFecha): Promise<DatosParaGrafico> => {
  try {
    const ventasSnapshot = await getDocs(collection(db, 'ventas'));
    const gastosSnapshot = await getDocs(collection(db, 'gastos'));
    
    const fechaInicio = new Date(fechas.fechaInicio);
    const fechaFin = new Date(fechas.fechaFin);
    
    // Agrupar por mes
    const ingresosPorMes: Record<string, number> = {};
    const egresosPorMes: Record<string, number> = {};
    
    ventasSnapshot.docs.forEach(doc => {
      const venta = doc.data();
      const fecha = (venta.fechaHora as Timestamp)?.toDate();
      
      if (fecha >= fechaInicio && fecha <= fechaFin) {
        const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        ingresosPorMes[mesKey] = (ingresosPorMes[mesKey] || 0) + (venta.total || 0);
      }
    });
    
    gastosSnapshot.docs.forEach(doc => {
      const gasto = doc.data();
      const fecha = (gasto.fechaHora as Timestamp)?.toDate();
      
      if (fecha >= fechaInicio && fecha <= fechaFin) {
        const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        egresosPorMes[mesKey] = (egresosPorMes[mesKey] || 0) + (gasto.monto || 0);
      }
    });
    
    // Combinar datos
    const meses = new Set([...Object.keys(ingresosPorMes), ...Object.keys(egresosPorMes)]);
    const datos: DatosParaGrafico = [["Mes", "Ingresos", "Egresos"]];
    
    Array.from(meses).sort().forEach(mes => {
      datos.push([mes, ingresosPorMes[mes] || 0, egresosPorMes[mes] || 0]);
    });
    
    return datos;
  } catch (error) {
    console.error("Error al obtener ingresos vs egresos:", error);
    return [["Mes", "Ingresos", "Egresos"]];
  }
};

// Obtener categorías rentables
export const obtenerCategoriasRentables = async (fechas: FiltrosFecha, page: number): Promise<DatosParaGrafico> => {
  try {
    const ventasSnapshot = await getDocs(collection(db, 'ventas'));
    const productosSnapshot = await getDocs(collection(db, 'productos'));
    const categoriasSnapshot = await getDocs(collection(db, 'categorias'));
    
    const fechaInicio = new Date(fechas.fechaInicio);
    const fechaFin = new Date(fechas.fechaFin);
    
    // Crear mapas de productos y categorías
    const productosMap = new Map();
    productosSnapshot.docs.forEach(doc => {
      const producto = doc.data();
      productosMap.set(doc.id, {
        idCategoria: producto.idCategoria,
        costo: producto.costo || 0
      });
    });
    
    const categoriasMap = new Map();
    categoriasSnapshot.docs.forEach(doc => {
      categoriasMap.set(doc.id, doc.data().nombre);
    });
    
    const gananciasPorCategoria: Record<string, number> = {};
    
    // Calcular ganancias por categoría
    ventasSnapshot.docs.forEach(doc => {
      const venta = doc.data();
      const fecha = (venta.fechaHora as Timestamp)?.toDate();
      
      if (fecha >= fechaInicio && fecha <= fechaFin && venta.detalles) {
        venta.detalles.forEach((detalle: any) => {
          // Obtener categoría y costo del producto
          const producto = productosMap.get(detalle.idProducto);
          if (producto) {
            const nombreCategoria = categoriasMap.get(producto.idCategoria) || 'Sin categoría';
            const precio = detalle.precioUnitario || detalle.precio || 0;
            const costo = producto.costo;
            const ganancia = (precio - costo) * detalle.cantidad;
            gananciasPorCategoria[nombreCategoria] = (gananciasPorCategoria[nombreCategoria] || 0) + ganancia;
          }
        });
      }
    });
    
    // Ordenar y paginar
    const categoriasOrdenadas = Object.entries(gananciasPorCategoria)
      .sort((a, b) => b[1] - a[1])
      .slice(page * 7, (page + 1) * 7);
    
    const datos: DatosParaGrafico = [["Categoría", "Ganancia"]];
    categoriasOrdenadas.forEach(([categoria, ganancia]) => {
      datos.push([categoria, ganancia]);
    });
    
    return datos;
  } catch (error) {
    console.error("Error al obtener categorías rentables:", error);
    return [["Categoría", "Ganancia"]];
  }
};

// Obtener volumen de ventas mensual
export const obtenerVolumenVentas = async (
  fechas: FiltrosFecha,
  idCategoria?: string | null
): Promise<DatosParaGrafico> => {
  try {
    const ventasSnapshot = await getDocs(collection(db, 'ventas'));
    // Necesitamos los productos para saber su categoría si hay filtro
    let productosMap = new Map();
    
    if (idCategoria) {
      const productosSnapshot = await getDocs(collection(db, 'productos'));
      productosSnapshot.docs.forEach(doc => {
        const data = doc.data();
        // Guardamos el idCategoria del producto
        productosMap.set(doc.id, data.idCategoria);
      });
    }
    
    const fechaInicio = new Date(fechas.fechaInicio);
    const fechaFin = new Date(fechas.fechaFin);
    
    const ventasPorMes: Record<string, number> = {};
    
    ventasSnapshot.docs.forEach(doc => {
      const venta = doc.data();
      const fecha = (venta.fechaHora as Timestamp)?.toDate();
      
      if (fecha >= fechaInicio && fecha <= fechaFin) {
        const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        
        if (venta.detalles) {
          let cantidadMes = 0;
          venta.detalles.forEach((detalle: any) => {
            // Si hay filtro de categoría, verificamos el mapa
            if (idCategoria) {
              const catIdProducto = productosMap.get(detalle.idProducto);
              // Comparamos como strings para seguridad
              if (catIdProducto && String(catIdProducto) === String(idCategoria)) {
                cantidadMes += detalle.cantidad;
              }
            } else {
              // Si no hay filtro, sumamos todo
              cantidadMes += detalle.cantidad;
            }
          });
          
          // Solo si hubo cantidad (si se filtró, puede ser 0)
          if (cantidadMes > 0 || !idCategoria) {
             ventasPorMes[mesKey] = (ventasPorMes[mesKey] || 0) + cantidadMes;
          }
        }
      }
    });
    
    const datos: DatosParaGrafico = [["Mes", "Cantidad"]];
    Object.entries(ventasPorMes).sort().forEach(([mes, cantidad]) => {
      datos.push([mes, cantidad]);
    });
    
    return datos;
  } catch (error) {
    console.error("Error al obtener volumen de ventas:", error);
    return [["Mes", "Cantidad"]];
  }
};

// Obtener ventas por hora del día
export const obtenerVentasPorHora = async (fechas: FiltrosFecha): Promise<DatosParaGrafico> => {
  try {
    const ventasSnapshot = await getDocs(collection(db, 'ventas'));
    
    const fechaInicio = new Date(fechas.fechaInicio);
    const fechaFin = new Date(fechas.fechaFin);
    
    const ventasPorHora: Record<number, number> = {};
    
    ventasSnapshot.docs.forEach(doc => {
      const venta = doc.data();
      const fecha = (venta.fechaHora as Timestamp)?.toDate();
      
      if (fecha >= fechaInicio && fecha <= fechaFin) {
        const hora = fecha.getHours();
        ventasPorHora[hora] = (ventasPorHora[hora] || 0) + 1;
      }
    });
    
    const datos: DatosParaGrafico = [["Hora", "Cantidad"]];
    Object.entries(ventasPorHora).sort((a, b) => Number(a[0]) - Number(b[0])).forEach(([hora, cantidad]) => {
      datos.push([Number(hora), cantidad]);
    });
    
    return datos;
  } catch (error) {
    console.error("Error al obtener ventas por hora:", error);
    return [["Hora", "Cantidad"]];
  }
};

// Obtener ventas por método de pago
export const obtenerVentasPorMetodoDePago = async (fechas: {
  fechaInicio: string;
  fechaFin: string;
}): Promise<DatosParaGrafico> => {
  try {
    const ventasSnapshot = await getDocs(collection(db, 'ventas'));
    
    const fechaInicio = new Date(fechas.fechaInicio);
    const fechaFin = new Date(fechas.fechaFin);
    
    const ventasPorMetodo: Record<string, number> = {};
    
    ventasSnapshot.docs.forEach(doc => {
      const venta = doc.data();
      const fecha = (venta.fechaHora as Timestamp)?.toDate();
      
      if (fecha >= fechaInicio && fecha <= fechaFin) {
        const metodo = venta.metodoDePago || 'EFECTIVO';
        ventasPorMetodo[metodo] = (ventasPorMetodo[metodo] || 0) + (venta.total || 0);
      }
    });
    
    const datos: DatosParaGrafico = [["Método", "Total"]];
    Object.entries(ventasPorMetodo).forEach(([metodo, total]) => {
      datos.push([metodo, total]);
    });
    
    return datos;
  } catch (error) {
    console.error("Error al obtener ventas por método de pago:", error);
    return [["Método", "Total"]];
  }
};

// Obtener ventas por categoría
export const obtenerVentasPorCategoria = async (fechas: {
  fechaInicio: string;
  fechaFin: string;
}): Promise<DatosParaGrafico> => {
  try {
    const ventasSnapshot = await getDocs(collection(db, 'ventas'));
    const productosSnapshot = await getDocs(collection(db, 'productos'));
    const categoriasSnapshot = await getDocs(collection(db, 'categorias'));
    
    const fechaInicio = new Date(fechas.fechaInicio);
    const fechaFin = new Date(fechas.fechaFin);
    
    // Crear mapas de productos y categorías
    const productosMap = new Map();
    productosSnapshot.docs.forEach(doc => {
      const producto = doc.data();
      productosMap.set(doc.id, {
        idCategoria: producto.idCategoria,
        nombre: producto.nombre
      });
    });
    
    const categoriasMap = new Map();
    categoriasSnapshot.docs.forEach(doc => {
      categoriasMap.set(doc.id, doc.data().nombre);
    });
    
    const ventasPorCategoria: Record<string, number> = {};
    
    ventasSnapshot.docs.forEach(doc => {
      const venta = doc.data();
      const fecha = (venta.fechaHora as Timestamp)?.toDate();
      
      if (fecha >= fechaInicio && fecha <= fechaFin && venta.detalles) {
        venta.detalles.forEach((detalle: any) => {
          // Obtener categoría del producto
          const producto = productosMap.get(detalle.idProducto);
          if (producto) {
            const nombreCategoria = categoriasMap.get(producto.idCategoria) || 'Sin categoría';
            // Usar precioUnitario en lugar de precio
            const precio = detalle.precioUnitario || detalle.precio || 0;
            const subtotal = precio * detalle.cantidad;
            ventasPorCategoria[nombreCategoria] = (ventasPorCategoria[nombreCategoria] || 0) + subtotal;
          }
        });
      }
    });
    
    const datos: DatosParaGrafico = [["Categoría", "Total"]];
    Object.entries(ventasPorCategoria)
      .sort((a, b) => b[1] - a[1]) // Ordenar de mayor a menor
      .forEach(([categoria, total]) => {
        datos.push([categoria, total]);
      });
    
    return datos;
  } catch (error) {
    console.error("Error al obtener ventas por categoría:", error);
    return [["Categoría", "Total"]];
  }
};