export interface AccesoDTO {
  email: string;
  password: string;
}

export interface AccesoRespuestaDTO {
  token: string;
  nombre: string;
  rol: string;
  weakPassword?: boolean;
}

export interface RenovarTokenDTO {
  token: string;
}
