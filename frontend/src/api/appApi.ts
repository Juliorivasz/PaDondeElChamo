import apiClient from "./interceptors/apiClient"

export const apagarServidor = async (): Promise<void> => {
  try {
    // Llama al endpoint de apagado.
    await apiClient.post("/shutdownApp")
  } catch (error) {
    // Es normal y esperado que esta llamada falle con un error de red,
    // ya que el servidor se apaga antes de poder responder.
    console.log("El servidor se está apagando, el error de red es esperado.")
  }
}
