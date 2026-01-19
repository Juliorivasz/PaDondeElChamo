// src/App.tsx
import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import HamburgerButton from './components/HamburgerButton';
import { useUsuarioStore } from './store/usuarioStore';
import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ModalSesion } from './components/ModalSesion';
import { useSessionMonitor } from './hooks/useSessionMonitor';
import { useAutenticacionStore } from './store/autenticacionStore';
import { renovarToken } from './api/autenticacionApi';

function App() {
  const { showWarning, timeRemaining, renovarSesion, cerrarSesion } = useSessionMonitor();
  // Solo necesitamos el usuario para saber si mostrar la interfaz, pero el routing lo maneja ProtectedRoute
  // const usuario = useUsuarioStore((state) => state.usuario); // Already imported but maybe unused in render if completely hidden by layout. Kept for logic if needed.
  const token = useAutenticacionStore((state) => state.token);
  const { cerrarSesion: logoutTotal } = useAutenticacionStore();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validarTokenInicial = async () => {
      if (token) {
        try {
          // Intentamos renovar/validar el token al iniciar la app
          // Si falla (por ejemplo, servidor reiniciado), el catch lo capturará
          await renovarToken(token);
        } catch (error) {
          console.error("Token inválido al iniciar:", error);
          logoutTotal();
          useUsuarioStore.getState().clearUsuario();
          // El routing se encargará de redirigir si ProtectedRoute detecta que no hay usuario
        }
      }
      setIsValidating(false);
    };

    validarTokenInicial();
  }, [token, logoutTotal]);

  // Advertir al usuario cuando intente cerrar el navegador sin cerrar sesión
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Solo mostrar advertencia si hay un token activo (sesión iniciada)
      if (token) {
        e.preventDefault();
        // Mensaje personalizado (algunos navegadores modernos ignoran el mensaje personalizado y muestran uno genérico)
        e.returnValue = '¿Estás seguro de que quieres salir? Tienes una sesión activa.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [token]);

  if (isValidating && token) {
     // Opcional: Mostrar un loader mientras validamos
     return <div className="flex h-screen items-center justify-center">Cargando sistema...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <HamburgerButton 
        isOpen={isSidebarOpen} 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      <main className="flex-1 p-4 pt-10 sm:p-6 lg:p-8 lg:pt-8 overflow-y-auto lg:ml-64">
        <Outlet />
      </main>

      <ModalSesion
        isOpen={showWarning}
        timeRemaining={timeRemaining}
        onRenovar={renovarSesion}
        onCerrar={cerrarSesion}
      />

      <ToastContainer
        position="bottom-right"
        theme='colored'
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        pauseOnHover
        style={{ zIndex: 99999 }}
      />
    </div>
  );
}

export default App;