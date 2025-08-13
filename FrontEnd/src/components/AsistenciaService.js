import { API_BASE_URL, authenticatedFetch } from '../utils/api';

// Servicio para manejar asistencias
export const asistenciaService = {
  // Obtener resumen de aprendices
  obtenerResumen: async () => {
    const response = await authenticatedFetch('/asistencia/listas/');
    if (!response.ok) {
      throw new Error('Error al obtener resumen de aprendices');
    }
    return response.json();
  },

  // Obtener detalle de un aprendiz
  detalleAprendiz: async (id) => {
    const response = await authenticatedFetch(`/asistencia/detalle/${id}`);
    if (!response.ok) {
      throw new Error('Error al obtener detalle del aprendiz');
    }
    return response.json();
  },

  // Toggle asistencia
  toggleAsistencia: async (aprendizId, fechaIso, presente) => {
    const response = await authenticatedFetch('/asistencia/toggle/', {
      method: 'PATCH',
      body: JSON.stringify({
        aprendiz_id: aprendizId,
        fecha: fechaIso,
        presente: presente
      })
    });
    if (!response.ok) {
      throw new Error('Error al actualizar asistencia');
    }
    return response.json();
  },

  // Importar Excel
  importarExcel: async (file, nombreLista = '') => {
    const formData = new FormData();
    formData.append('archivo', file);
    if (nombreLista) {
      formData.append('nombre_lista', nombreLista);
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/asistencia/importar/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // NO incluir Content-Type para FormData
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error al importar archivo');
    }
    return response.json();
  },

  // Exportar CSV
  exportarCSV: async () => {
    const response = await authenticatedFetch('/asistencia/exportar/');
    if (!response.ok) {
      throw new Error('Error al exportar CSV');
    }
    return response.text(); // Retorna el contenido del CSV como texto
  },

  // Obtener asistencias con filtros (para la tabla principal)
  obtenerAsistencias: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await authenticatedFetch(`/asistencia/?${params}`);
    if (!response.ok) {
      throw new Error('Error al obtener asistencias');
    }
    return response.json();
  },

  // Crear asistencia individual
  crearAsistencia: async (asistenciaData) => {
    const response = await authenticatedFetch('/asistencia/', {
      method: 'POST',
      body: JSON.stringify(asistenciaData)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error al crear asistencia');
    }
    return response.json();
  }
};

// Exports individuales para compatibilidad
export const obtenerResumen = asistenciaService.obtenerResumen;
export const detalleAprendiz = asistenciaService.detalleAprendiz;
export const toggleAsistencia = asistenciaService.toggleAsistencia;
export const importarExcel = asistenciaService.importarExcel;
export const exportarCSV = asistenciaService.exportarCSV;