// Corresponde a la respuesta de GET /proveedor/abm
export interface Proveedor {
  idProveedor: string  // Changed to string for Firebase
  nombre: string
  telefono?: string  // Made optional
  email?: string  // Made optional
  estado: boolean
}

// Para el cuerpo (body) de POST /nuevo y PUT /modificar
export interface ProveedorDTO {
  nombre: string
  telefono?: string  // Made optional
  email?: string  // Made optional
}
