// Corresponde a la respuesta de GET /proveedor/abm
export interface Proveedor {
  idProveedor: number
  nombre: string
  telefono: string
  email: string
  estado: boolean
}

// Para el cuerpo (body) de POST /nuevo y PUT /modificar
export interface ProveedorDTO {
  nombre: string
  telefono: string | null
  email: string | null
}
