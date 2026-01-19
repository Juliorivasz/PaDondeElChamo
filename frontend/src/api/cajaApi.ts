import apiClient from "./interceptors/apiClient";

export const getDashboardData = async () => {
    const response = await apiClient.get('/caja/dashboard');
    return response.data;
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
