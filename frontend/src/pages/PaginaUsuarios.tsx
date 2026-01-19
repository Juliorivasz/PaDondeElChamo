import React, { useState, useEffect } from "react"
import { Users, Plus, Pencil, Trash2, Key, UserCheck, ShieldCheck, Eye } from "lucide-react"
import { toast } from "react-toastify"

// API & Types
import type { Usuario } from "../types/dto/Usuario"
import { obtenerUsuarios, eliminarUsuario, actualizarUsuario } from "../api/usuarioApi"
import { obtenerRoles } from "../api/rolesApi"

// Components
import ModalCambioPassword from "../components/ModalCambioPassword"
import { ModalNuevoUsuario } from "../components/usuarios/ModalNuevoUsuario"
import { ModalEditarUsuario } from "../components/usuarios/ModalEditarUsuario"
import { ModalDetallesUsuario } from "../components/usuarios/ModalDetallesUsuario"

const PaginaUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [rolesDisponibles, setRolesDisponibles] = useState<string[]>([])
  const [cargando, setCargando] = useState(true)

  // Estados para Modales
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false)
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false)
  const [mostrarModalDetalles, setMostrarModalDetalles] = useState(false)
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false)
  const [mostrarModalPassword, setMostrarModalPassword] = useState(false)

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null)
  const [usuarioPasswordId, setUsuarioPasswordId] = useState<number | undefined>(undefined)

  useEffect(() => {
    cargarRoles()
    cargarUsuarios()
  }, [])

  const cargarRoles = async () => {
    try {
      const roles = await obtenerRoles()
      // Filtrar el rol ADMIN para que no se pueda seleccionar al crear/editar personal común
      const rolesPermitidos = roles.filter((rol) => rol !== "ADMIN")
      setRolesDisponibles(rolesPermitidos)
    } catch (error) {
      toast.error("Error al cargar roles")
    }
  }

  const cargarUsuarios = async () => {
    try {
      setCargando(true)
      const response = await obtenerUsuarios({ limit: 1000, mostrarTodos: true })
      if (response && response.data && Array.isArray(response.data)) {
        setUsuarios(response.data)
      } else {
        setUsuarios([])
      }
    } catch (error) {
      toast.error("Error al cargar usuarios")
    } finally {
      setCargando(false)
    }
  }

  const handleReactivar = async (usuario: Usuario) => {
    try {
      await actualizarUsuario(usuario.idUsuario, { isActive: true })
      toast.success("Usuario reactivado correctamente")
      cargarUsuarios()
    } catch (error: any) {
      const mensaje = error.response?.data?.message || "Error al reactivar usuario"
      toast.error(mensaje)
    }
  }

  const handleEliminar = async () => {
    if (!usuarioSeleccionado) return

    try {
      await eliminarUsuario(usuarioSeleccionado.idUsuario)
      toast.success("¡Usuario desactivado correctamente!")
      setMostrarModalEliminar(false)
      setUsuarioSeleccionado(null)
      cargarUsuarios()
    } catch (error: any) {
      const mensaje = error.response?.data?.message || "Error al desactivar usuario"
      toast.error(mensaje)
    }
  }

  const renderTablaUsuarios = (listaUsuarios: Usuario[], esInactivo: boolean = false) => {
    if (listaUsuarios.length === 0) {
      return (
        <div className="p-8 text-center bg-white">
          <p className="text-gray-400 italic text-sm">No hay usuarios en esta sección.</p>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-left font-semibold text-gray-600">
                Usuario / Email
              </th>
              <th className="px-6 py-3 text-left font-semibold text-gray-600">
                Rol Asignado
              </th>
              <th className="px-6 py-3 text-right font-semibold text-gray-600">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {listaUsuarios.map((usuario) => (
              <tr key={usuario.idUsuario} className="group hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${usuario.rol === "ADMIN" ? "bg-blue-100 text-azul" : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {usuario.nombre.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 group-hover:text-azul transition-colors">
                        {usuario.nombre}
                      </span>
                      <span className="text-xs text-gray-500">{usuario.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${usuario.rol === "ADMIN" ? "bg-blue-100 text-azul" : "bg-green-100 text-verde"
                      }`}
                  >
                    {usuario.rol === "ADMIN" && <ShieldCheck size={12} />}
                    {usuario.rol}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end">
                    {!esInactivo ? (
                      <>
                        <button
                          onClick={() => {
                            setUsuarioSeleccionado(usuario)
                            setMostrarModalDetalles(true)
                          }}
                          className="p-2 text-gray-800 hover:text-black transition-colors rounded-lg"
                          title="Ver Detalles"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setUsuarioSeleccionado(usuario)
                            setMostrarModalEditar(true)
                          }}
                          className="p-2 text-gray-800 hover:text-black transition-colors rounded-lg"
                          title="Editar Perfil"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setUsuarioPasswordId(usuario.idUsuario)
                            setMostrarModalPassword(true)
                          }}
                          className="p-2 text-gray-800 hover:text-black transition-colors rounded-lg"
                          title="Cambiar Password"
                        >
                          <Key size={18} />
                        </button>
                        {usuario.rol !== "ADMIN" && (
                          <button
                            onClick={() => {
                              setUsuarioSeleccionado(usuario)
                              setMostrarModalEliminar(true)
                            }}
                            className="p-2 text-gray-800 hover:text-black transition-colors rounded-lg"
                            title="Desactivar Acceso"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => handleReactivar(usuario)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-verde hover:bg-green-50 rounded-lg transition-all font-bold text-xs uppercase"
                        title="Reactivar Usuario"
                      >
                        <UserCheck size={16} />
                        <span>Reactivar</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50/30 min-h-screen">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="text-azul" size={28} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Usuarios</h1>
              <p className="text-sm sm:text-base text-gray-600">Gestión del personal y accesos al sistema</p>
            </div>
          </div>
          <button
            onClick={() => setMostrarModalNuevo(true)}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-azul text-white rounded-md font-semibold hover:bg-azul-dark shadow-md transition-all active:scale-95 text-sm sm:text-base"
          >
            <Plus size={20} />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-md border border-gray-100">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-azul rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500 font-semibold italic text-sm">Cargando usuarios...</p>
          </div>
        ) : (
          <>
            {/* Administradores */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <ShieldCheck size={18} className="text-azul" />
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Administradores</h2>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                {renderTablaUsuarios(usuarios.filter((u) => u.rol === "ADMIN"))}
              </div>
            </div>

            {/* Empleados Activos */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Personal Activo</h2>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                {renderTablaUsuarios(usuarios.filter((u) => u.rol !== "ADMIN" && u.isActive))}
              </div>
            </div>

            {/* Empleados Inactivos */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Personal Inactivo</h2>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                {renderTablaUsuarios(usuarios.filter((u) => u.rol !== "ADMIN" && !u.isActive), true)}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modales */}
      <ModalNuevoUsuario
        isOpen={mostrarModalNuevo}
        onClose={() => setMostrarModalNuevo(false)}
        onSuccess={cargarUsuarios}
        rolesDisponibles={rolesDisponibles}
      />

      {usuarioSeleccionado && (
        <>
          <ModalEditarUsuario
            isOpen={mostrarModalEditar}
            onClose={() => {
              setMostrarModalEditar(false)
              setUsuarioSeleccionado(null)
            }}
            onSuccess={cargarUsuarios}
            usuario={usuarioSeleccionado}
            rolesDisponibles={rolesDisponibles}
          />

          <ModalDetallesUsuario
            isOpen={mostrarModalDetalles}
            onClose={() => {
              setMostrarModalDetalles(false)
              setUsuarioSeleccionado(null)
            }}
            usuario={usuarioSeleccionado}
          />

          {/* Modal Confirmar Eliminación */}
          {mostrarModalEliminar && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                <div className="bg-gradient-to-r from-rojo to-rojo-darker p-6 text-white">
                  <h2 className="text-xl font-bold">Confirmar Eliminación</h2>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 mb-6">
                    ¿Estás seguro de que deseas eliminar al usuario <strong>{usuarioSeleccionado.nombre}</strong>?
                    Esta acción no se puede deshacer.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setMostrarModalEliminar(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleEliminar}
                      className="flex-1 px-4 py-2 bg-rojo text-white rounded-lg hover:bg-rojo-darker transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <ModalCambioPassword
        isOpen={mostrarModalPassword}
        onClose={() => {
          setMostrarModalPassword(false)
          setUsuarioPasswordId(undefined)
        }}
        userId={usuarioPasswordId}
      />
    </div>
  )
}

export default PaginaUsuarios
