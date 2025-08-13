import React, { useState, useEffect } from 'react';
import { Users, Calendar, CheckCircle, XCircle, MapPin, Clock } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { formatDate, formatDateTime } from '../utils/dateUtils';

const Dashboard = ({ token, user }) => {
  const [stats, setStats] = useState({
    totalProfesoras: 0,
    asistenciasHoy: 0,
    clasesHoy: 0,
    proximasClases: []
  });
  const [loading, setLoading] = useState(true);
  const [recentAsistencias, setRecentAsistencias] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      // Fetch profesoras
      const profesorasResponse = await fetch(`${API_BASE_URL}/profesoras`, { headers });
      const profesoras = await profesorasResponse.json();

      // Fetch asistencias recientes
      const asistenciasResponse = await fetch(`${API_BASE_URL}/asistencia`, { headers });
      const asistencias = await asistenciasResponse.json();

      // Fetch clases de hoy y próximas
      const hoy = new Date();
      const mañana = new Date(hoy);
      mañana.setDate(hoy.getDate() + 7); // Próxima semana

      const clasesResponse = await fetch(
        `${API_BASE_URL}/clases?fecha_inicio=${hoy.toISOString()}&fecha_fin=${mañana.toISOString()}`,
        { headers }
      );
      const clases = await clasesResponse.json();

      // Calcular estadísticas
      const today = hoy.toISOString().split('T')[0];
      const asistenciasHoy = asistencias.filter(a => 
        a.fecha.split('T')[0] === today
      ).length;

      const clasesHoy = clases.filter(c => 
        c.fecha_inicio.split('T')[0] === today
      ).length;

      setStats({
        totalProfesoras: profesoras.length,
        asistenciasHoy,
        clasesHoy,
        proximasClases: clases.slice(0, 5)
      });

      setRecentAsistencias(asistencias.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          ¡Bienvenida, {user.nombre}!
        </h1>
        <p className="text-indigo-100">
          Especialidad en {user.especialidad}
        </p>
        <p className="text-indigo-100 text-sm mt-2">
          {formatDate(new Date())}
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="text-blue-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Profesoras</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProfesoras}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Asistencias Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.asistenciasHoy}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <Calendar className="text-purple-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Clases Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.clasesHoy}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-full">
              <Clock className="text-orange-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Próximas Clases</p>
              <p className="text-2xl font-bold text-gray-900">{stats.proximasClases.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas clases */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Próximas Clases</h2>
          </div>
          <div className="p-6">
            {stats.proximasClases.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay clases programadas</p>
            ) : (
              <div className="space-y-4">
                {stats.proximasClases.map((clase) => (
                  <div key={clase.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="bg-indigo-100 p-2 rounded-full">
                      <Calendar className="text-indigo-600" size={16} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{clase.titulo}</h3>
                      <p className="text-sm text-gray-600">{clase.profesora.nombre}</p>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <Clock size={12} className="mr-1" />
                        {formatDateTime(clase.fecha_inicio)}
                      </div>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <MapPin size={12} className="mr-1" />
                        {clase.ubicacion}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Asistencias recientes */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Asistencias Recientes</h2>
          </div>
          <div className="p-6">
            {recentAsistencias.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay registros de asistencia</p>
            ) : (
              <div className="space-y-4">
                {recentAsistencias.map((asistencia) => (
                  <div key={asistencia.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {asistencia.presente ? (
                        <CheckCircle className="text-green-500" size={20} />
                      ) : (
                        <XCircle className="text-red-500" size={20} />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{asistencia.profesora.nombre}</p>
                        <p className="text-sm text-gray-600">{formatDate(asistencia.fecha)}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      asistencia.presente 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {asistencia.presente ? 'Presente' : 'Ausente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;