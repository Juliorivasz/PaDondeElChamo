// Formatear fecha ISO 8601 a formato legible
export const formatearFecha = (fechaISO: string): string => {
  try {
    const fecha = new Date(fechaISO)
    return fecha.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch (error) {
    return "Fecha inválida"
  }
}

// Formatear hora ISO 8601 a formato legible
export const formatearHora = (fechaISO: string): string => {
  try {
    const fecha = new Date(fechaISO)
    return fecha.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  } catch (error) {
    return "Hora inválida"
  }
}

// Formatear fecha para input type="date" (YYYY-MM-DD)
export const formatearFechaParaInput = (fecha: Date): string => {
  return fecha.toISOString().split("T")[0]
}
