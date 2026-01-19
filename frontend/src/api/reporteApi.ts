import apiClient from "./interceptors/apiClient"

const handleFileDownload = (response: any, filename: string) => {
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export const descargarReporteDiario = async (fecha: string, nombreArchivo: string): Promise<void> => {
  try {
    const response = await apiClient.get("/reporte/diario", {
      params: { fecha },
      responseType: "blob", 
    })
    handleFileDownload(response, nombreArchivo)
  } catch (error) {
    console.error("Error al descargar el reporte diario:", error)
    throw new Error("No se pudo descargar el reporte.")
  }
}

export const descargarReporteMensual = async (fecha: string, nombreArchivo: string): Promise<void> => {
  try {
    const response = await apiClient.get("/reporte/mensual", {
      params: { fecha },
      responseType: "blob",
    })
    handleFileDownload(response, nombreArchivo)
  } catch (error) {
    console.error("Error al descargar el reporte mensual:", error)
    throw new Error("No se pudo descargar el reporte.")
  }
}
