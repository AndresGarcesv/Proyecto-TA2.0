// Configuración de la API
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Función para hacer peticiones autenticadas
export const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${url}`, config);

  // Si el token ha expirado, redirigir al login
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
    return;
  }

  return response;
};

// Funciones específicas de la API
export const api = {
  // Autenticación
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return response;
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return response;
  },

  // Profesoras
  getProfesoras: async () => {
    return authenticatedFetch('/profesoras');
  },

  getCurrentUser: async () => {
    return authenticatedFetch('/me');
  },

  // Asistencias
  getAsistencias: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return authenticatedFetch(`/asistencia?${params}`);
  },

  createAsistencia: async (asistenciaData) => {
    return authenticatedFetch('/asistencia', {
      method: 'POST',
      body: JSON.stringify(asistenciaData),
    });
  },

  // Clases
  getClases: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return authenticatedFetch(`/clases?${params}`);
  },

  getCalendarioClases: async (mes, año) => {
    return authenticatedFetch(`/clases/calendario?mes=${mes}&año=${año}`);
  },

  createClase: async (claseData) => {
    return authenticatedFetch('/clases', {
      method: 'POST',
      body: JSON.stringify(claseData),
    });
  },
};