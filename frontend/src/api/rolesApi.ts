// Firebase uses static roles defined in the application
// No need to fetch from backend

export const obtenerRoles = async (): Promise<string[]> => {
  // Return static roles for Firebase
  return ['ADMIN', 'EMPLEADO'];
};
