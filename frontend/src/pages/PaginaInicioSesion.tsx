"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { User, ArrowLeft, Eye, EyeOff, X } from "lucide-react"
import { obtenerUsuariosActivos } from "../api/usuarioApi"
import { iniciarSesion, solicitarRecuperacion } from "../api/autenticacionApi"
import { useUsuarioStore } from "../store/usuarioStore"
import { useAutenticacionStore } from "../store/autenticacionStore"
import type { Usuario } from "../types/dto/Usuario"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const PaginaInicioSesion: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para el login y animación
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [iniciandoSesion, setIniciandoSesion] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  
  // Estado para recuperación de contraseña
  const [mostrarModalRecuperacion, setMostrarModalRecuperacion] = useState(false)
  const [emailRecuperacion, setEmailRecuperacion] = useState("")
  const [enviandoRecuperacion, setEnviandoRecuperacion] = useState(false)
  
  // Estado para controlar la animación FLIP
  const [animatingId, setAnimatingId] = useState<string | null>(null)
  const [cardStyle, setCardStyle] = useState<React.CSSProperties>({})
  const [isExpanded, setIsExpanded] = useState(false)
  const cardsRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const passwordInputRef = useRef<HTMLInputElement>(null)

  const navigate = useNavigate()
  const setUsuario = useUsuarioStore((state) => state.setUsuario)
  const establecerAutenticacion = useAutenticacionStore((state) => state.establecerAutenticacion)

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        setLoading(true)
        const listaUsuarios = await obtenerUsuariosActivos()
        setUsuarios(listaUsuarios)
      } catch (err: any) {
        // Self-healing: Si es 401, limpiar todo y recargar
        if (err.response?.status === 401) {
             console.log("Detectado 401 en carga inicial - Limpiando sesión corrupta");
             localStorage.clear();
             window.location.reload();
             return;
        }
        setError("Error al cargar los usuarios")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    cargarUsuarios()
  }, [])

  const handleSelectUsuario = (usuario: Usuario) => {
    const cardElement = cardsRefs.current[usuario.idUsuario]
    if (!cardElement) return

    // Capturar posición inicial
    const rect = cardElement.getBoundingClientRect()
    
    // Establece estado inicial de la animación
    setAnimatingId(usuario.idUsuario)
    setCardStyle({
      position: 'fixed',
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      zIndex: 50,
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    })

    requestAnimationFrame(() => {
      setUsuarioSeleccionado(usuario)
      setIsExpanded(true)
      
      setCardStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'calc(100% - 2rem)',
        maxWidth: '28rem',
        zIndex: 50,
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
      })
    })

    setEmail(usuario.email)
    setPassword("")
    setMostrarPassword(false)
    
    // Focus en el campo de contraseña después de la animación
    setTimeout(() => {
      const input = passwordInputRef.current
      if (input) {
        input.focus()
        setPasswordFocused(true)
        // Forzar que el cursor aparezca
        setTimeout(() => {
          input.focus()
          input.click()
        }, 50)
      }
    }, 600)
  }

  const handleVolver = () => {
    if (!usuarioSeleccionado) return
    
    const cardElement = cardsRefs.current[usuarioSeleccionado.idUsuario]
    
    setIsExpanded(false)
    
    const placeholder = document.getElementById(`placeholder-${usuarioSeleccionado.idUsuario}`)
    if (placeholder) {
      const rect = placeholder.getBoundingClientRect()
      
      setCardStyle({
        position: 'fixed',
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        transform: 'none',
        zIndex: 50,
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
      })
      
      setTimeout(() => {
        setUsuarioSeleccionado(null)
        setAnimatingId(null)
        setCardStyle({})
      }, 500)
    } else {
      setUsuarioSeleccionado(null)
      setAnimatingId(null)
      setCardStyle({})
    }

    setEmail("")
    setPassword("")
    setMostrarPassword(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error("Por favor completa todos los campos")
      return
    }

    try {
      setIniciandoSesion(true)
      const respuesta = await iniciarSesion({ email, password })
      
      establecerAutenticacion(respuesta.token, respuesta.nombre, respuesta.rol, respuesta.weakPassword)
      
      if (usuarioSeleccionado) {
        setUsuario(usuarioSeleccionado)
      }

      toast.success(`¡Bienvenido/a ${respuesta.nombre}!`)
      
      // Redirección basada en rol
      if (respuesta.rol === 'ADMIN') {
        navigate("/caja")
      } else {
        navigate("/ventas")
      }
    } catch (err: any) {
      console.error("Error al iniciar sesión:", err)
      
      // Manejo específico de errores
      if (err.response) {
        const status = err.response.status
        const message = err.response.data?.message
        
        switch (status) {
          case 401:
            toast.error("❌ Credenciales incorrectas. Verifica tu email y contraseña.")
            break
          case 403:
            toast.error("⚠️ Tu cuenta está inactiva. Contacta al administrador.")
            break
          case 404:
            toast.error("❌ Usuario no encontrado.")
            break
          case 500:
            toast.error("🔧 Error en el servidor. Intenta nuevamente más tarde.")
            break
          default:
            toast.error(message || "❌ Error al iniciar sesión. Intenta nuevamente.")
        }
      } else if (err.request) {
        toast.error("🌐 No se pudo conectar con el servidor. Verifica tu conexión.")
      } else {
        toast.error("❌ Error inesperado. Intenta nuevamente.")
      }
    } finally {
      setIniciandoSesion(false)
    }
  }

  const handleRecuperarPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailRecuperacion.trim()) return

    try {
      setEnviandoRecuperacion(true)
      await solicitarRecuperacion(emailRecuperacion)
      toast.success("Si el correo existe, recibirás instrucciones para recuperar tu contraseña")
      setMostrarModalRecuperacion(false)
      setEmailRecuperacion("")
    } catch (err) {
      console.error("Error al solicitar recuperación:", err)
      toast.error("Error al procesar la solicitud")
    } finally {
      setEnviandoRecuperacion(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header Section */}
        <div className={`text-center mb-6 md:mb-8 transition-all duration-500 ${isExpanded ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2">Bienvenido/a</h1>
          <p className="text-base md:text-lg text-gray-600">Por favor, selecciona tu perfil para continuar</p>
        </div>

        {/* User Profiles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 relative">
          {usuarios.map((usuario) => {
            const isSelected = usuarioSeleccionado?.idUsuario === usuario.idUsuario
            const isAnimatingThis = animatingId === usuario.idUsuario
            
            // Si este usuario está siendo animado (expandido o contrayendo), usamos el estilo calculado
            // Si no, estilo normal
            const currentStyle = isAnimatingThis ? cardStyle : {}

            return (
              <div key={usuario.idUsuario} className="relative">
                {/* Placeholder invisible para mantener el espacio en el grid */}
                <div 
                  id={`placeholder-${usuario.idUsuario}`}
                  className={`w-full h-full opacity-0 ${isAnimatingThis ? 'block' : 'hidden'}`}
                  style={{ height: '140px' }} // Altura aproximada del card compacto
                ></div>

                <div
                  ref={el => { cardsRefs.current[usuario.idUsuario] = el }}
                  style={currentStyle}
                  className={`bg-white rounded-lg shadow-md transition-shadow duration-300 ${
                    !isExpanded && !isAnimatingThis ? 'hover:shadow-lg hover:bg-rose-50 relative' : ''
                  } ${
                    !isAnimatingThis && isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  }`}
                >
                  {/* Contenido del Card */}
                  <div className="relative overflow-hidden h-full">
                    
                    {/* Botón volver - animado */}
                    <div className={`absolute top-0 left-0 p-4 z-10 transition-opacity duration-300 ${
                      isExpanded && isAnimatingThis ? 'opacity-100 delay-200' : 'opacity-0 pointer-events-none'
                    }`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVolver();
                        }}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <ArrowLeft size={20} />
                        <span className="text-sm font-medium">Volver</span>
                      </button>
                    </div>

                    <div 
                      onClick={() => !isExpanded && handleSelectUsuario(usuario)}
                      className={`transition-all duration-500 h-full flex flex-col ${
                        isExpanded && isAnimatingThis
                          ? 'p-4 md:p-6 cursor-default' 
                          : 'p-4 md:p-6 cursor-pointer justify-center'
                      }`}
                    >
                      {/* Avatar y Nombre */}
                      <div className={`flex flex-col items-center transition-all duration-500 ${
                        isExpanded && isAnimatingThis ? 'mt-8' : ''
                      }`}>
                        <div className={`bg-rose-100 rounded-full flex items-center justify-center transition-all duration-500 ${
                          isExpanded && isAnimatingThis ? 'w-20 h-20 mb-3' : 'w-16 h-16 mb-3'
                        }`}>
                          <User 
                            size={isExpanded && isAnimatingThis ? 40 : 32} 
                            className="text-rose-600 transition-all duration-500" 
                          />
                        </div>
                        <h2 className={`font-bold text-gray-800 text-center transition-all duration-500 ${
                          isExpanded && isAnimatingThis ? 'text-2xl mb-1' : 'text-lg mb-0'
                        }`}>
                          {usuario.nombre}
                        </h2>
                        
                        <p className={`text-sm text-gray-600 text-center transition-all duration-500 ${
                          isExpanded && isAnimatingThis
                            ? 'opacity-100 max-h-10 mt-1' 
                            : 'opacity-0 max-h-0 overflow-hidden'
                        }`}>
                          Ingresa tus credenciales
                        </p>
                      </div>

                      {/* Formulario */}
                      <form 
                        onSubmit={handleLogin}
                        className={`transition-all duration-500 w-full ${
                          isExpanded && isAnimatingThis
                            ? 'opacity-100 mt-6 flex-1' 
                            : 'opacity-0 h-0 overflow-hidden'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="space-y-4">
                          <div>
                            <label htmlFor={`email-${usuario.idUsuario}`} className="block text-sm font-medium text-gray-700 mb-2">
                              Email
                            </label>
                            <input
                              type="email"
                              id={`email-${usuario.idUsuario}`}
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                              placeholder="tu@email.com"
                              required
                              disabled={iniciandoSesion}
                            />
                          </div>

                          <div>
                            <label htmlFor={`password-${usuario.idUsuario}`} className="block text-sm font-medium text-gray-700 mb-2">
                              Contraseña
                            </label>
                            <div className="relative">
                              <input
                                ref={passwordInputRef}
                                type={mostrarPassword ? "text" : "password"}
                                id={`password-${usuario.idUsuario}`}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                                className={`w-full px-4 py-2 pr-12 border-2 rounded-md outline-none transition-all duration-200 caret-rose-600 ${
                                  passwordFocused 
                                    ? 'ring-2 ring-rose-500' 
                                    : 'border-gray-300'
                                }`}
                                placeholder="••••••••"
                                required
                                disabled={iniciandoSesion}
                              />
                              <button
                                type="button"
                                onClick={() => setMostrarPassword(!mostrarPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                tabIndex={-1}
                              >
                                {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full px-4 py-3 bg-rose-600 text-white rounded-md hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            disabled={iniciandoSesion}
                          >
                            {iniciandoSesion ? "Iniciando sesión..." : "Iniciar Sesión"}
                          </button>

                          {/* <button
                            type="button"
                            onClick={() => setMostrarModalRecuperacion(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-rose-600 hover:text-rose-700 transition-colors text-sm font-medium"
                          >
                            <KeyRound size={16} />
                            <span>¿Olvidaste tu contraseña?</span>
                          </button> */}
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className={`transition-all duration-500 ${
          isExpanded 
            ? 'opacity-0 translate-y-4' 
            : 'opacity-100 translate-y-0'
        }`}>
          <div className="text-center mt-12">
            <p className="text-sm text-gray-500">Sistema de Gestión © 2025</p>
          </div>
        </div>
      </div>

      {/* Modal Recuperar Contraseña */}
      {mostrarModalRecuperacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Recuperar Contraseña</h2>
              <button
                onClick={() => {
                  setMostrarModalRecuperacion(false)
                  setEmailRecuperacion("")
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
            </p>

            <form onSubmit={handleRecuperarPassword}>
              <div className="mb-6">
                <label htmlFor="emailRecuperacion" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="emailRecuperacion"
                  value={emailRecuperacion}
                  onChange={(e) => setEmailRecuperacion(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="ejemplo@correo.com"
                  required
                  disabled={enviandoRecuperacion}
                  autoFocus
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalRecuperacion(false)
                    setEmailRecuperacion("")
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  disabled={enviandoRecuperacion}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 disabled:opacity-50 transition-colors"
                  disabled={enviandoRecuperacion || !emailRecuperacion.trim()}
                >
                  {enviandoRecuperacion ? "Enviando..." : "Enviar solicitud"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <ToastContainer
        position="bottom-right"
        theme="colored"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        pauseOnHover
        style={{ zIndex: 99999 }}
      />
    </div>
  )
}

export default PaginaInicioSesion
