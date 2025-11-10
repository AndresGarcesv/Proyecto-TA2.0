import React, { useState, useEffect, useCallback } from 'react';
import { Plus, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { authenticatedFetch } from '../utils/api';
import { formatDate } from '../utils/dateUtils';
import AsistenciaForm from './AsistenciaForm';
import { asistenciaService } from './AsistenciaService';

const AsistenciaModule = ({ token }) => {
  const [asistencias, setAsistencias] = useState([]);
  const [profesoras, setProfesoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    profesora_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    presente: ''
  });
  
  // Estado local para las fechas antes de aplicar el filtro
  const [tempDates, setTempDates] = useState({
    fecha_inicio: '',
    fecha_fin: ''
  });

  // Paginación y vista
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20); // mostrar 20 por página por defecto
  const pageSizeOptions = [10, 20, 50];

  // Debounce para las fechas
  const [dateTimeout, setDateTimeout] = useState(null);

  const [file, setFile] = useState(null);
  const [nombreLista, setNombreLista] = useState("");

  useEffect(() => {
    fetchAsistencias();
    fetchProfesoras();
  }, []);

  // Re-fetch when filters change and reset page
  useEffect(() => {
    setCurrentPage(1);
    fetchAsistencias();
  }, [filters, pageSize]);

  // Ajustar currentPage si queda fuera de rango cuando cambia el total de páginas
  useEffect(() => {
    const pages = Math.max(1, Math.ceil(asistencias.length / pageSize));
    if (currentPage > pages) {
      setCurrentPage(pages);
    }
  }, [asistencias.length, pageSize, currentPage]);

  const fetchAsistencias = async () => {
    try {
      setLoading(true);
      const data = await asistenciaService.obtenerAsistencias(filters);
      
      // Aplicar filtro de presente si está definido
      let filteredData = data || [];
      if (filters.presente !== '') {
        filteredData = filteredData.filter(a => a.presente === (filters.presente === 'true'));
      }

      // Ordenar primero por fecha y luego por nombre de aprendiz
      filteredData.sort((a, b) => {
        // Primero ordenar por fecha
        const fechaA = new Date(a.fecha || 0);
        const fechaB = new Date(b.fecha || 0);
        if (fechaA.getTime() !== fechaB.getTime()) {
          return fechaA - fechaB;
        }
        
        // Si las fechas son iguales, ordenar por nombre de aprendiz
        const nombreA = (a.aprendiz?.nombre || '').toLowerCase();
        const nombreB = (b.aprendiz?.nombre || '').toLowerCase();
        return nombreA.localeCompare(nombreB);
      });

      // Guardar todas las asistencias filtradas para paginación en cliente
      setAsistencias(filteredData);
    } catch (error) {
      console.error('Error fetching asistencias:', error);
      alert('Error al cargar asistencias: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfesoras = async () => {
    try {
      const response = await authenticatedFetch('/profesoras');
      if (response && response.ok) {
        const data = await response.json();
        setProfesoras(data || []);
      }
    } catch (error) {
      console.error('Error fetching profesoras:', error);
    }
  };

  const handleCreateAsistencia = async (asistenciaData) => {
    try {
      await asistenciaService.crearAsistencia(asistenciaData);
      fetchAsistencias();
      setShowForm(false);
      alert('Asistencia creada correctamente');
    } catch (error) {
      console.error('Error creating asistencia:', error);
      alert('Error al crear asistencia: ' + error.message);
    }
  };

  // Función para validar fechas
  const isValidDate = (dateStr) => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
  };

  // Manejador de cambios en filtros con debounce para fechas
  const handleFilterChange = useCallback((field, value) => {
    // Si el campo es una fecha, actualizamos el estado temporal
    if (field.includes('fecha_')) {
      setTempDates(prev => ({
        ...prev,
        [field]: value
      }));

      // Limpiar timeout anterior si existe
      if (dateTimeout) {
        clearTimeout(dateTimeout);
      }

      // Crear nuevo timeout para aplicar el filtro
      const newTimeout = setTimeout(() => {
        // Validar la fecha antes de aplicar el filtro
        if (isValidDate(value)) {
          setFilters(prev => ({
            ...prev,
            [field]: value
          }));
        }
      }, 500); // 500ms de delay

      setDateTimeout(newTimeout);
    } else {
      // Para otros campos, actualizar inmediatamente
      setFilters(prev => ({
        ...prev,
        [field]: value
      }));
    }
  }, [dateTimeout]);

  const clearFilters = () => {
    setFilters({
      profesora_id: '',
      fecha_inicio: '',
      fecha_fin: '',
      presente: ''
    });
    setTempDates({
      fecha_inicio: '',
      fecha_fin: ''
    });
  };

  async function handleImport(e) {
    e.preventDefault();
    if (!file) return alert("Selecciona un archivo");
    try {
      await asistenciaService.importarExcel(file, nombreLista);
      alert("Importado correctamente");
      setFile(null);
      setNombreLista("");
      fetchAsistencias(); // Actualizar la lista después de importar
    } catch (e) {
      console.error(e);
      alert("Error al importar: " + e.message);
    }
  }

  async function handleExport() {
    try {
      const csvContent = await asistenciaService.exportarCSV();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "asistencia.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Error al exportar: " + e.message);
    }
  }
  // ----------------------------------------

  // Función auxiliar para obtener nombre seguro
  const getNombreSeguro = (obj, defaultValue = 'N/A') => {
    return obj && obj.nombre ? obj.nombre : defaultValue;
  };

  // Función auxiliar para obtener especialidad segura
  const getEspecialidadSegura = (profesora, defaultValue = 'Sin especialidad') => {
    return profesora && profesora.especialidad ? profesora.especialidad : defaultValue;
  };

  // Buscar profesora por id en la lista cargada
  const findProfesoraById = (id) => {
    if (!id) return null;
    return profesoras.find(p => p.id === id) || null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Cálculos de paginación
  const total = asistencias.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(total, currentPage * pageSize);
  const paginated = asistencias.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lista de Asistencia</h1>
          <p className="text-gray-600">Gestiona los registros de asistencia de las facilitadora</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nueva Asistencia
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h2 className="text-lg font-medium text-gray-900">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profesora</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.profesora_id}
              onChange={(e) => handleFilterChange('profesora_id', e.target.value)}
            >
              <option value="">Todas las profesoras</option>
              {profesoras.map((profesora) => (
                <option key={profesora.id} value={profesora.id}>
                  {getNombreSeguro(profesora)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input
              type="date"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                tempDates.fecha_inicio && !isValidDate(tempDates.fecha_inicio) ? 'border-red-500' : 'border-gray-300'
              }`}
              value={tempDates.fecha_inicio}
              onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
              min={`${new Date().getFullYear()}-01-01`}
              max={`${new Date().getFullYear()}-12-31`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input
              type="date"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                tempDates.fecha_fin && !isValidDate(tempDates.fecha_fin) ? 'border-red-500' : 'border-gray-300'
              }`}
              value={tempDates.fecha_fin}
              onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
              min={tempDates.fecha_inicio || `${new Date().getFullYear()}-01-01`}
              max={`${new Date().getFullYear()}-12-31`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.presente}
              onChange={(e) => handleFilterChange('presente', e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="true">Presente</option>
              <option value="false">Ausente</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Formulario nueva asistencia */}
      {showForm && (
        <AsistenciaForm
          profesoras={profesoras}
          onSubmit={handleCreateAsistencia}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Resumen compacto + tabla de asistencias con paginación */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gray-50 px-4 py-2 rounded-md">
              <div className="text-xs text-gray-500">Registros</div>
              <div className="text-lg font-semibold text-gray-900">{total}</div>
            </div>
            <div className="bg-green-50 px-4 py-2 rounded-md">
              <div className="text-xs text-green-600">Presentes</div>
              <div className="text-lg font-semibold text-green-700">{asistencias.filter(a => a.presente).length}</div>
            </div>
            <div className="bg-red-50 px-4 py-2 rounded-md">
              <div className="text-xs text-red-600">Ausentes</div>
              <div className="text-lg font-semibold text-red-700">{asistencias.filter(a => !a.presente).length}</div>
            </div>
            <div className="bg-white px-4 py-2 rounded-md text-sm text-gray-600">
              {filters.fecha_inicio || filters.fecha_fin ? (
                <>
                  <div>Rango:</div>
                  <div className="font-medium text-gray-900">{filters.fecha_inicio || '...'} — {filters.fecha_fin || '...'}</div>
                </>
              ) : (
                <div className="text-sm text-gray-500">Rango: todos</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">Mostrar</div>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="px-2 py-1 border rounded-md">
              {pageSizeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>

            <div className="text-sm text-gray-600">|</div>

            <div className="text-sm text-gray-600">
              Mostrando {startIndex+1}-{endIndex} de {total} (pág. {currentPage}/{totalPages})
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200" disabled={currentPage === 1}>Anterior</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200" disabled={currentPage >= totalPages}>Siguiente</button>
            </div>
          </div>
        </div>

        {asistencias.length === 0 ? (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay registros</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron registros de asistencia con los filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facilitadora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aprendiz</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginated.map((asistencia, index) => {
                  const currentDate = new Date(asistencia.fecha);
                  const prevDate = index > 0 ? new Date(paginated[index - 1].fecha) : null;
                  const isNewDate = !prevDate || currentDate.getTime() !== prevDate.getTime();

                  return [
                    isNewDate && (
                      <tr key={`header-${asistencia.id}`}>
                        <td colSpan="4" className="bg-gray-50 px-6 py-2 border-t border-b border-gray-200">
                          <div className="text-sm font-semibold text-gray-700">
                            {asistencia.fecha ? formatDate(asistencia.fecha) : 'Sin fecha'}
                          </div>
                        </td>
                      </tr>
                    ),
                    <tr key={`row-${asistencia.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {asistencia.fecha ? formatDate(asistencia.fecha) : 'Sin fecha'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-indigo-100 h-10 w-10 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-medium text-sm">
                              {getNombreSeguro(asistencia.profesora, 'P').charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {getNombreSeguro(asistencia.profesora || findProfesoraById(asistencia.profesora_id))}
                            </div>
                            <div className="text-sm text-gray-500">
                              {getEspecialidadSegura(asistencia.profesora || findProfesoraById(asistencia.profesora_id))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getNombreSeguro(asistencia.aprendiz)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {asistencia.aprendiz?.documento || 'Sin documento'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-3 h-4 w-4"
                            checked={!!asistencia.presente}
                            onChange={async () => {
                              try {
                                await asistenciaService.toggleAsistencia(asistencia.aprendiz_id || asistencia.aprendiz?.id, asistencia.fecha, !asistencia.presente);
                                setAsistencias(prev => prev.map(a => a.id === asistencia.id ? { ...a, presente: !a.presente } : a));
                              } catch (e) {
                                console.error('Error toggling asistencia row:', e);
                                alert('No se pudo actualizar asistencia: ' + (e.message || e));
                              }
                            }}
                          />
                          {asistencia.presente ? (
                            <>
                              <CheckCircle className="text-green-500 mr-2" size={20} />
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Presente
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="text-red-500 mr-2" size={20} />
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                Ausente
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ].filter(Boolean);
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Módulo de Importar / Exportar */}
      <div className="p-4 border rounded bg-white">
        <div className="mb-4">
          <form onSubmit={handleImport} className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Nombre lista (opcional)"
              value={nombreLista}
              onChange={e => setNombreLista(e.target.value)}
              className="border p-2 rounded"
            />
            <input type="file" accept=".xlsx,.xls,.csv" onChange={e => setFile(e.target.files[0])} />
            <button className="bg-green-500 text-white px-3 py-2 rounded" type="submit">Importar Excel</button>
            <button type="button" onClick={handleExport} className="bg-blue-500 text-white px-3 py-2 rounded">Exportar CSV</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AsistenciaModule;