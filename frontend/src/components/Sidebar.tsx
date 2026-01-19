"use client"

import React, { useState, useEffect } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import {
  Package,
  ShoppingCart,
  Truck,
  ReceiptText,
  ChartNoAxesCombined,
  Tag,
  ScrollText,
  ListPlus,
  LogOut,
  User,
  Users,
  Cctv,
  Settings,
} from "lucide-react"
import { useUsuarioStore } from "../store/usuarioStore"
import { useAutenticacionStore } from "../store/autenticacionStore"
import ModalConfirmacionApagado from "./ModalConfirmacionApagado"
import ModalCambioPassword from "./ModalCambioPassword"
import { AlertTriangle } from "lucide-react"
import { obtenerAuditorias } from "../api/auditoriaApi"
import { ModalRealizarAuditoria } from "./auditorias/ModalRealizarAuditoria"
import ModalCierreCaja from "./caja/ModalCierreCaja"
import { DollarSign } from "lucide-react"
import { getEstadoStock } from "../api/cajaApi"

import { useAuditoriaStore } from "../store/auditoriaStore"

interface ItemNavegacion {
  label: string | React.ReactNode
  path: string
  icon: React.ReactElement
}



interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const usuario = useUsuarioStore((state) => state.usuario)
  const clearUsuario = useUsuarioStore((state) => state.clearUsuario)
  const weakPassword = useAutenticacionStore((state) => state.weakPassword)
  const refreshTrigger = useAuditoriaStore((state) => state.refreshTrigger)
  const [mostrarModalApagado, setMostrarModalApagado] = useState(false)
  const [mostrarModalPassword, setMostrarModalPassword] = useState(false)
  const [mostrarModalAuditoria, setMostrarModalAuditoria] = useState(false)
  const [mostrarModalCierreCaja, setMostrarModalCierreCaja] = useState(false)
  const [pendingAuditsCount, setPendingAuditsCount] = useState(0)
  const [realizoControlStock, setRealizoControlStock] = useState(true) // Default true prevents flash? Or false?

  useEffect(() => {
    if (weakPassword) {
      setMostrarModalPassword(true)
    }
  }, [weakPassword])

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        const auditorias = await obtenerAuditorias()
        const pendientes = auditorias.filter(a => a.estado === "A_REVISAR").length
        setPendingAuditsCount(pendientes)
      } catch (error) {
        console.error("Error al obtener auditorías:", error)
      }
    }

    if (usuario?.rol === 'ADMIN') {
      fetchAudits()
    }

    if (usuario?.rol === 'EMPLEADO') {
      getEstadoStock(usuario.idUsuario)
        .then(res => setRealizoControlStock(res.realizado))
        .catch(console.error)
    }
  }, [usuario, refreshTrigger, mostrarModalAuditoria])

  const handleLogout = () => {
    // Only show modal for EMPLEADO. Admin logs out directly.
    if (usuario?.rol === 'EMPLEADO') {
      setMostrarModalCierreCaja(true)
    } else {
      clearUsuario()
      navigate("/seleccionar-usuario")
    }
  }

  const handleCierreExit = () => {
    setMostrarModalCierreCaja(false)
    clearUsuario()
    navigate("/seleccionar-usuario")
  }

  const handleNavClick = () => {
    // Cerrar sidebar en móvil al hacer clic en un enlace
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  // Definir items de navegación según el rol del usuario
  const getNavigationItems = (): ItemNavegacion[] => {
    const items: ItemNavegacion[] = [
      { label: "Historial", path: "/historial", icon: <ScrollText size={18} /> },
      { label: "Productos", path: "/productos", icon: <Package size={18} /> },
    ];

    // Items adicionales para ADMIN
    if (usuario?.rol === 'ADMIN') {
      items.push({ label: "Categorías", path: "/categorias", icon: <Tag size={18} /> });

      const auditoriaLabel = (
        <div className="flex items-center justify-between w-full">
          <span>Auditorías</span>
          {pendingAuditsCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 ml-2 text-xs font-bold text-white bg-rojo rounded-full">
              {pendingAuditsCount}
            </span>
          )}
        </div>
      );

      items.push(
        { label: "Compras", path: "/compras", icon: <ShoppingCart size={18} /> },
        { label: "Proveedores", path: "/proveedores", icon: <Truck size={18} /> },
        { label: "Gastos", path: "/gastos", icon: <ReceiptText size={18} /> },
        { label: "Usuarios", path: "/usuarios", icon: <Users size={18} /> },
        { label: "Estadísticas", path: "/estadisticas", icon: <ChartNoAxesCombined size={18} /> },
        { label: "Caja y Arqueos", path: "/caja", icon: <DollarSign size={18} /> },
        { label: auditoriaLabel, path: "/auditorias", icon: <Cctv size={18} /> },
        { label: "Configuración", path: "/configuracion", icon: <Settings size={18} /> }
      );
    }

    return items;
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`h-screen w-64 bg-gray-800 text-gray-200 fixed top-0 flex flex-col z-40 transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 lg:left-0`}
      >
        {/* --- Logo de la aplicación --- */}
        <div className="flex items-center p-4 m-1 border-b border-gray-700">
          <img
            src="/logo.png"
            alt="Logo de Pañalera Pepa"
            className="h-[65px] w-auto flex-shrink-0"
          />
          <div className="ml-3">
            <p className="text-xl font-titulo font-medium text-white leading-tight">Pinky</p>
            <p className="text-base font-titulo font-normal text-gray-400 leading-tight">Hoops</p>
          </div>
        </div>

        {/* User profile section */}
        {usuario && (
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <User size={32} className="text-gray-300" />
              <div>
                <p className="text-sm font-medium text-white">{usuario.nombre}</p>
                <p className="text-xs text-gray-400">Usuario activo</p>
              </div>
            </div>

            {weakPassword && (
              <button
                onClick={() => setMostrarModalPassword(true)}
                className="mt-3 w-full flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/50 rounded text-amber-500 hover:bg-amber-500/20 transition-colors text-xs font-medium animate-pulse"
              >
                <AlertTriangle size={14} />
                <span>Cambiar contraseña</span>
              </button>
            )}
          </div>
        )}

        {/* Botón de Acceso Rápido a Nueva Venta */}
        <div className="px-4 py-3 border-b border-gray-700">
          <button
            onClick={() => {
              navigate("/ventas")
              handleNavClick()
            }}
            className="w-full flex items-center justify-center gap-2 pr-5 py-3 bg-gray-700 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-[1.02]"
          >
            <ListPlus size={20} />
            <span>Nueva Venta</span>
          </button>
        </div>

        {/* Botón de Auditoría para Empleados - Condicional */}
        {usuario?.rol === 'EMPLEADO' && !realizoControlStock && (
          <div className="px-4 py-3 border-b border-gray-700">
            <button
              onClick={() => {
                setMostrarModalAuditoria(true)
                handleNavClick()
              }}
              className="w-full flex items-center justify-center gap-2 pr-5 py-3 bg-gray-700 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-[1.02]"
            >
              <Cctv size={20} />
              <span>Control de Stock</span>
            </button>
          </div>
        )}

        {/* Navegación con scroll personalizado */}
        <nav className="flex-1 py-2 overflow-y-auto scrollbar-custom">
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `flex items-center px-6 py-3 text-sm font-medium transition-all duration-200 hover:bg-gray-700 hover:text-white ${isActive
                      ? "bg-gray-700 text-white border-l-4 border-gray-500 pl-5"
                      : "text-gray-300 border-l-4 border-transparent"
                    }`
                  }
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer with logout button */}
        <div className="border-t border-gray-700 mb-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-6 py-2 text-sm font-medium text-red-400 hover:underline decoration-2"
          >
            <LogOut size={18} className="mr-2" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

        <ModalConfirmacionApagado isOpen={mostrarModalApagado} onClose={() => setMostrarModalApagado(false)} />
        <ModalCambioPassword isOpen={mostrarModalPassword} onClose={() => setMostrarModalPassword(false)} isForced={!!weakPassword} />


        {/* Estilos para el scrollbar personalizado */}
        <style>{`
        .scrollbar-custom::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-track {
          background: rgba(55, 65, 81, 0.3);
          border-radius: 3px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
          transition: background 0.2s;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.8);
        }
        
        /* Firefox */
        .scrollbar-custom {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.5) rgba(55, 65, 81, 0.3);
        }
      `}</style>
      </div>
      <ModalRealizarAuditoria
        isOpen={mostrarModalAuditoria}
        onClose={() => setMostrarModalAuditoria(false)}
        idUsuario={usuario?.idUsuario || 0}
      />
      <ModalCierreCaja
        isOpen={mostrarModalCierreCaja}
        onClose={() => setMostrarModalCierreCaja(false)}
        onSuccess={handleCierreExit}
        idUsuario={usuario?.idUsuario || 0}
      />
    </>
  )
}

export default Sidebar
