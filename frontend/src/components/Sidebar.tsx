"use client"

import React, { useState, useEffect } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import {
  Package,
  Package2,
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
  ChevronDown,
  ChevronRight,
  DollarSign,
  Store,
  TrendingUp,
  Wrench,
  Bell,
  AlertTriangle,
} from "lucide-react"
import { useUsuarioStore } from "../store/usuarioStore"
import { useAutenticacionStore } from "../store/autenticacionStore"
import { useAlertasStore } from "../store/alertasStore"
import { cerrarSesion } from "../api/autenticacionApi"
import ModalConfirmacionApagado from "./ModalConfirmacionApagado"
import ModalCambioPassword from "./ModalCambioPassword"
import ModalCierreCaja from "./caja/ModalCierreCaja"
import { getEstadoStock } from "../api/cajaApi"
import { obtenerAlertasInventario, suscribirAlertasInventario } from "../api/alertasApi"
import type { AlertaInventario } from "../types/dto/Alertas"
import ModalAlertasInventario from "./alertas/ModalAlertasInventario"

interface ItemNavegacion {
  label: string | React.ReactNode
  path: string
  icon: React.ReactElement
  adminOnly?: boolean
}

interface SeccionNavegacion {
  titulo: string
  icon: React.ReactElement
  items: ItemNavegacion[]
  adminOnly?: boolean
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
  const debeRecargar = useAlertasStore((state) => state.debeRecargar)
  const resetRecarga = useAlertasStore((state) => state.resetRecarga)
  const [mostrarModalApagado, setMostrarModalApagado] = useState(false)
  const [mostrarModalPassword, setMostrarModalPassword] = useState(false)
  const [mostrarModalCierreCaja, setMostrarModalCierreCaja] = useState(false)
  const [realizoControlStock, setRealizoControlStock] = useState(true)
  const [alertas, setAlertas] = useState<AlertaInventario[]>([])
  const [mostrarModalAlertas, setMostrarModalAlertas] = useState(false)
  
  // Estado para secciones colapsadas
  const [seccionesColapsadas, setSeccionesColapsadas] = useState<Record<string, boolean>>({
    inventario: true,
    ventas: true,
    configuracion: true,
  })

  useEffect(() => {
    if (weakPassword) {
      setMostrarModalPassword(true)
    }
  }, [weakPassword])

  useEffect(() => {
    if (usuario?.rol === 'EMPLEADO' && usuario.idUsuario) {
      getEstadoStock(parseInt(usuario.idUsuario))
        .then(res => setRealizoControlStock(res.realizado))
        .catch(console.error)
    }
  }, [usuario])

  // Cargar alertas de inventario en tiempo real
  useEffect(() => {
    const unsubscribe = suscribirAlertasInventario((nuevasAlertas) => {
      setAlertas(nuevasAlertas)
      if (nuevasAlertas.length > 0) {
        // Opcional: Sonido o efecto visual adicional
      }
    })

    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    if (usuario?.rol === 'EMPLEADO') {
      setMostrarModalCierreCaja(true)
    } else {
      try {
        await cerrarSesion();
        clearUsuario();
        navigate("/seleccionar-usuario");
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        // Even if there's an error, clear local state and redirect
        clearUsuario();
        navigate("/seleccionar-usuario");
      }
    }
  }

  const handleCierreExit = async () => {
    setMostrarModalCierreCaja(false)
    try {
      await cerrarSesion();
      clearUsuario();
      navigate("/seleccionar-usuario");
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      clearUsuario();
      navigate("/seleccionar-usuario");
    }
  }

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  const toggleSeccion = (seccion: string) => {
    setSeccionesColapsadas(prev => ({
      ...prev,
      [seccion]: !prev[seccion]
    }))
  }



  // Definir secciones de navegación
  const getSecciones = (): SeccionNavegacion[] => {
    const secciones: SeccionNavegacion[] = [
      {
        titulo: "Inventario",
        icon: <Store size={18} />,
        items: [
          { label: "Productos", path: "/productos", icon: <Package size={18} /> },
          { label: "Insumos", path: "/insumos", icon: <Package2 size={18} />, adminOnly: true },
          { label: "Categorías", path: "/categorias", icon: <Tag size={18} />, adminOnly: true },
          { label: "Proveedores", path: "/proveedores", icon: <Truck size={18} />, adminOnly: true },
        ],
      },
      {
        titulo: "Ventas",
        icon: <TrendingUp size={18} />,
        items: [
          { label: "Historial", path: "/historial", icon: <ScrollText size={18} /> },
          { label: "Compras", path: "/compras", icon: <ShoppingCart size={18} />, adminOnly: true },
          { label: "Gastos", path: "/gastos", icon: <ReceiptText size={18} />, adminOnly: true },
          { label: "Caja", path: "/caja", icon: <DollarSign size={18} />, adminOnly: true },
        ],
      },
    ];

    if (usuario?.rol === 'ADMIN') {
      secciones.push({
        titulo: "Configuración",
        icon: <Wrench size={18} />,
        adminOnly: true,
        items: [
          { label: "Usuarios", path: "/usuarios", icon: <Users size={18} /> },
          { label: "Estadísticas", path: "/estadisticas", icon: <ChartNoAxesCombined size={18} /> },
          { label: "Configuración", path: "/configuracion", icon: <Settings size={18} /> },
        ],
      });
    }

    return secciones;
  };

  const secciones = getSecciones();

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
        className={`h-[100dvh] w-64 bg-gray-800 text-gray-200 fixed top-0 flex flex-col z-40 transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 lg:left-0`}
      >
        {/* Logo */}
        <div className="flex items-center p-4 m-1 border-b border-gray-700">
          <img
            src="/paDondeLosChamos_logo.png"
            alt="Logo de PaDondeLosChamos"
            className="h-[65px] w-auto flex-shrink-0"
          />
          <div className="ml-3">
            <p className="text-xl font-titulo font-medium leading-tight">
              <span className="text-yellow-400 drop-shadow-sm">Pa' Donde</span>{" "}
              <span className="text-blue-400 drop-shadow-sm">"El</span>{" "}
              <span className="text-red-500 drop-shadow-sm">Chamo"</span>
            </p>
          </div>
        </div>

        {/* User profile */}
        {usuario && (
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <User size={32} className="text-gray-300" />
                <div>
                  <p className="text-sm font-medium text-white">{usuario.nombre}</p>
                  <p className="text-xs text-gray-400">Usuario activo</p>
                </div>
              </div>

              {/* Bell notification icon */}
              <button
                onClick={() => setMostrarModalAlertas(true)}
                className="relative p-2 hover:bg-gray-700 rounded-full transition-colors"
                title="Alertas de inventario"
              >
                <Bell size={20} className="text-gray-300" />
                {alertas.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {alertas.length > 9 ? '9+' : alertas.length}
                  </span>
                )}
              </button>
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

        {/* Botón Nueva Venta */}
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

        {/* Botón Control de Stock (Empleados) */}


        {/* Navegación con secciones colapsables */}
        <nav className="flex-1 py-2 overflow-y-auto scrollbar-custom">
          <ul className="space-y-1">
            {secciones.map((seccion) => {
              // Filtrar items según rol
              const itemsFiltrados = seccion.items.filter(item => 
                !item.adminOnly || usuario?.rol === 'ADMIN'
              );

              if (itemsFiltrados.length === 0) return null;

              const estaColapsada = seccionesColapsadas[seccion.titulo.toLowerCase()];

              return (
                <li key={seccion.titulo}>
                  {/* Header de sección */}
                  <button
                    onClick={() => toggleSeccion(seccion.titulo.toLowerCase())}
                    className="w-full flex items-center justify-between px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {seccion.icon}
                      <span>{seccion.titulo}</span>
                    </div>
                    {estaColapsada ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {/* Items de la sección */}
                  {!estaColapsada && (
                    <ul className="mt-1 space-y-1">
                      {itemsFiltrados.map((item) => (
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
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
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

        {/* Estilos scrollbar */}
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
        
        .scrollbar-custom {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.5) rgba(55, 65, 81, 0.3);
        }
      `}</style>
      </div>
      <ModalCierreCaja
        isOpen={mostrarModalCierreCaja}
        onClose={() => setMostrarModalCierreCaja(false)}
        onSuccess={handleCierreExit}
        onSkip={handleCierreExit}
        idUsuario={usuario?.idUsuario ? parseInt(usuario.idUsuario) : 0}
      />
      <ModalAlertasInventario
        isOpen={mostrarModalAlertas}
        onClose={() => setMostrarModalAlertas(false)}
        alertas={alertas}
      />
    </>
  )
}

export default Sidebar
