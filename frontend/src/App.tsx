// src/App.tsx
import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import HamburgerButton from './components/HamburgerButton';
import { useUsuarioStore } from './store/usuarioStore';
import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAutenticacionStore } from './store/autenticacionStore';
import { renovarToken } from './api/autenticacionApi';

function App() {
  const token = useAutenticacionStore((state) => state.token);
  const { cerrarSesion: logoutTotal } = useAutenticacionStore();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validarTokenInicial = async () => {
      if (token) {
        try {
          // Intentamos renovar/validar el token al iniciar la app
          await renovarToken(token);
        } catch (error) {
          console.error("Token inválido al iniciar:", error);
          logoutTotal();
          useUsuarioStore.getState().clearUsuario();
        }
      }
      setIsValidating(false);
    };

    validarTokenInicial();
  }, [token, logoutTotal]);

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