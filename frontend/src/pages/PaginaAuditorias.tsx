"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Cctv, Search, Filter } from "lucide-react"
import { obtenerAuditorias } from "../api/auditoriaApi"
import type { AuditoriaDTO } from "../types/dto/Auditoria"
import { ModalRealizarAuditoria } from "../components/auditorias/ModalRealizarAuditoria"
import { ModalDetallesAuditoria } from "../components/auditorias/ModalDetallesAuditoria"
import { obtenerUsuarios } from "../api/usuarioApi"
import type { Usuario } from "../types/dto/Usuario"
import { useAuditoriaStore } from "../store/auditoriaStore"
import { useUsuarioStore } from "../store/usuarioStore"

const PaginaAuditorias: React.FC = () => {
  const [auditorias, setAuditorias] = useState<AuditoriaDTO[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)
  const [modalRealizarOpen, setModalRealizarOpen] = useState(false)
  const [modalDetallesOpen, setModalDetallesOpen] = useState(false)
  const [auditoriaSeleccionada, setAuditoriaSeleccionada] = useState<AuditoriaDTO | null>(null)

  // Filtros
  const [filtroUsuario, setFiltroUsuario] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("TODAS") // TODAS, FINALIZADA, PENDIENTE

  const usuario = useUsuarioStore((state) => state.usuario)

  const cargarDatos = async () => {
    try {
      setCargando(true)
      const [auditoriasData, usuariosData] = await Promise.all([
        obtenerAuditorias(),
        obtenerUsuarios()
      ])
      setAuditorias(auditoriasData)
      setUsuarios(usuariosData)

      // Si hay una auditoría seleccionada, actualizarla también
      if (auditoriaSeleccionada) {
        const actualizada = auditoriasData.find(a => a.idAuditoria === auditoriaSeleccionada.idAuditoria)
        if (actualizada) {
          setAuditoriaSeleccionada(actualizada)
        }
      }
    } catch (error) {
      console.error("Error al cargar datos:", error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const handleRowClick = (auditoria: AuditoriaDTO) => {
    setAuditoriaSeleccionada(auditoria)
    setModalDetallesOpen(true)
  }

  // Lógica de filtrado
  const auditoriasFiltradas = auditorias.filter(auditoria => {
    const cumpleUsuario = filtroUsuario === "" || auditoria.usuario === usuarios.find(u => u.idUsuario.toString() === filtroUsuario)?.nombre

    let cumpleEstado = true
    if (filtroEstado !== "TODAS") {
      cumpleEstado = auditoria.estado === filtroEstado
    }

    return cumpleUsuario && cumpleEstado
  })

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4 md:gap-0">
        <div className="flex items-center gap-3">
          <Cctv className="text-azul" size={32} />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Auditorías</h1>
            <p className="text-sm md:text-base text-gray-600">Auditorías y revisiones de inventario</p>
          </div>
        </div>
        <button
          onClick={() => setModalRealizarOpen(true)}
          className="w-full md:w-auto px-4 py-2 bg-verde text-white rounded-lg hover:bg-verde-dark flex items-center justify-center gap-2"
        >
          <Cctv size={18} />
          Simular Auditoría (Empleado)
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4">

          {/* Filtro de Usuario */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">Todos los usuarios</option>
              {Array.isArray(usuarios) && usuarios.map(u => (
                <option key={u.idUsuario} value={u.idUsuario}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Estado */}
          <div className="relative w-full md:w-48">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="TODAS">Todos los estados</option>
              <option value="FINALIZADA">Finalizada</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="A_REVISAR">A Revisar</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha y Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado Revisión
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cargando ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    Cargando auditorías...
                  </td>
                </tr>
              ) : auditoriasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No se encontraron registros
                  </td>
                </tr>
              ) : (
                auditoriasFiltradas.map((auditoria) => (
                  <tr
                    key={auditoria.idAuditoria}
                    onClick={() => handleRowClick(auditoria)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{auditoria.idAuditoria}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(auditoria.fechaHora).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{auditoria.usuario}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${auditoria.estado === "FINALIZADA"
                          ? "bg-green-100 text-green-800"
                          : auditoria.estado === "PENDIENTE"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-red-100 text-red-900"
                          }`}
                      >
                        {auditoria.estado === "FINALIZADA" ? "Finalizada" : auditoria.estado === "PENDIENTE" ? "Pendiente" : "A Revisar"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ModalRealizarAuditoria
        isOpen={modalRealizarOpen}
        onClose={() => {
          setModalRealizarOpen(false)
          cargarDatos()
        }}
        idUsuario={usuario?.idUsuario ? parseInt(usuario.idUsuario) : 1}
      />

      <ModalDetallesAuditoria
        isOpen={modalDetallesOpen}
        onClose={() => setModalDetallesOpen(false)}
        auditoria={auditoriaSeleccionada}
        onUpdate={() => {
          cargarDatos()
          useAuditoriaStore.getState().triggerRefresh()
        }}
      />
    </div>
  )
}

export default PaginaAuditorias
