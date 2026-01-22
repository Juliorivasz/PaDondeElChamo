import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import apiClient from "./interceptors/apiClient";

export const getDashboardData = async () => {
  try {
    const hoy = new Date();
    const diaHoy = hoy.getDate();
    const mesHoy = hoy.getMonth() + 1;
    const anioHoy = hoy.getFullYear();
    
    // Query ventas de hoy usando campos denormalizados
    const ventasHoyQuery = query(
      collection(db, 'ventas'),
      where('dia', '==', diaHoy),
      where('mes', '==', mesHoy),
      where('anio', '==', anioHoy)
    );
    
    const ventasHoySnapshot = await getDocs(ventasHoyQuery);
    
    // Calcular totales de hoy
    let totalRecaudado = 0;
    const porMetodo: Record<string, number> = {};
    
    ventasHoySnapshot.docs.forEach(doc => {
      const venta = doc.data();
      totalRecaudado += venta.total || 0;
      
      const metodo = venta.metodoDePago || 'EFECTIVO';
      porMetodo[metodo] = (porMetodo[metodo] || 0) + (venta.total || 0);
    });
    
    // Obtener ventas de últimos 7 días para gráfico
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    hace7Dias.setHours(0, 0, 0, 0);
    
    const ventasSemanalesQuery = query(
      collection(db, 'ventas'),
      orderBy('fechaHora', 'desc'),
      limit(500) // Suficiente para 7 días de ventas
    );
    
    const ventasSemanalesSnapshot = await getDocs(ventasSemanalesQuery);
    
    // Agrupar ventas por fecha
    const ventasPorDia: Record<string, number> = {};
    
    ventasSemanalesSnapshot.docs.forEach(doc => {
      const venta = doc.data();
      const fechaTimestamp = venta.fechaHora as Timestamp;
      const fecha = fechaTimestamp.toDate();
      
      if (fecha >= hace7Dias) {
        const fechaStr = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
        ventasPorDia[fechaStr] = (ventasPorDia[fechaStr] || 0) + (venta.total || 0);
      }
    });
    
    // Convertir a array y ordenar por fecha
    const chartData = Object.entries(ventasPorDia)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      totalRecaudado,
      porMetodo,
      chartData
    };
  } catch (error) {
    console.error('Error al obtener datos de caja:', error);
    throw error;
  }
};

export const getHistorialArqueos = async (filters: any = {}) => {
    // Build query string
    const params = new URLSearchParams();
    if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
    if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
    if (filters.idUsuario) params.append('idUsuario', filters.idUsuario);
    if (filters.diferencia) params.append('diferencia', 'true');
    if (filters.stockCheck !== undefined && filters.stockCheck !== null && filters.stockCheck !== '') {
         params.append('stockCheck', filters.stockCheck);
    }

    const response = await apiClient.get(`/caja/arqueos?${params.toString()}`);
    return response.data;
};

export const crearRetiro = async (data: { cantidad: number; idUsuario: number }) => {
    const response = await apiClient.post('/caja/retiro', data);
    return response.data;
};

export const cerrarTurno = async (data: { idUsuario: number; efectivoReal: number }) => {
    const response = await apiClient.post('/caja/cerrar-turno', data);
    return response.data;
};

export const getEstadoStock = async (idUsuario: number) => {
    const response = await apiClient.get(`/caja/estado-stock?idUsuario=${idUsuario}`);
    return response.data;
};

export const checkSessionStatus = async (idUsuario: number) => {
    const response = await apiClient.get(`/caja/session-status?idUsuario=${idUsuario}`);
    return response.data; // { active: boolean }
};

export const abrirCajaManual = async (idUsuario: number) => {
    const response = await apiClient.post('/caja/abrir-manual', { idUsuario });
    return response.data;
};
