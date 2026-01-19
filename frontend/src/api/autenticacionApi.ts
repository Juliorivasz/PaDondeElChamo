import apiClient from './interceptors/apiClient';
import type { AccesoDTO, AccesoRespuestaDTO, RenovarTokenDTO } from '../types/dto/Autenticacion';

export const iniciarSesion = async (accesoDTO: AccesoDTO): Promise<AccesoRespuestaDTO> => {
  const response = await apiClient.post<AccesoRespuestaDTO>('/auth/login', accesoDTO);
  return response.data;
};

export const renovarToken = async (token: string): Promise<RenovarTokenDTO> => {
  const response = await apiClient.post<RenovarTokenDTO>(
    '/auth/renovarToken',
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const solicitarRecuperacion = async (email: string): Promise<void> => {
  await apiClient.post("/auth/recuperar-password", { email })
}

export const restablecerPassword = async (token: string, nuevaPassword: string): Promise<void> => {
  await apiClient.post("/auth/restablecer-password", { token, nuevaPassword })
}
