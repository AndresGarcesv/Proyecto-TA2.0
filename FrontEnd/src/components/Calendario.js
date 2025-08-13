import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, User } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { formatDateTime } from '../utils/dateUtils';
import ClaseForm from './ClaseForm';

const Calendario = ({ token }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clases, setClases] = useState([]);
  const [profesoras, setProfesoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  useEffect(() => {
    fetchClases();
    fetchProfesoras();
  }, [currentDate]);

  const fetchClases = async () => {
    try {
      const año = currentDate.getFullYear();
      const mes = currentDate.getMonth() + 1;
      
      const response = await fetch(
        `${API_BASE_URL}/clases/calendario?mes=${mes}&año=${año}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setClases(data);
      }
    } catch (error) {
      console.error('Error fetching clases:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfesoras = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/profesoras`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProfesoras(data);
      }
    } catch (error) {
      console.error('Error fetching profesoras:', error);
    }
  };

  const handleCreateClase = async (claseData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/clases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(claseData),
      });

      if (response.ok) {
        fetchClases();
        setShowForm(false);
        setSelectedDate(null);
      } else {
        const errorData = await response.json();
        alert('Error al crear clase: ' + errorData.detail);
      }
    } catch (error) {
      console.error('Error creating clase:', error);
      alert('Error de conexión al crear clase');
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getDaysInMonth = () => {
    const año = currentDate.getFullYear();
    const mes = currentDate.getMonth();
    const firstDay = new Date(año, mes, 1);
    const lastDay = new Date(año, mes + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Días del mes anterior
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevMonthDay = new Date(año, mes - 1, lastDay.getDate() - i);
      days.push({
        date: prevMonthDay,
        isCurrentMonth: false,
        isToday: false
      });
    }

    // Días del mes actual
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(año, mes, day);
      days.push({
        date: date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString()
      });
    }

    // Días del próximo mes para completar la grilla
    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const nextMonthDay = new Date(año, mes + 1, day);
      days.push({
        date: nextMonthDay,
        isCurrentMonth: false,
        isToday: false
      });
    }

    return days;
  };

  const getClasesForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return clases.filter(clase => {
      const claseDate = new Date(clase.fecha_inicio).toISOString().split('T')[0];
      return claseDate === dateStr;
    });
  };

  const handleDateClick = (date) => {
    if (date.isCurrentMonth) {
      setSelectedDate(date.date);
      setShowForm(true);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario de Clases</h1>
          <p className="text-gray-600">Programa y visualiza las clases del colegio y TecnoAcademia</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nueva Clase
        </button>
      </div>

      {/* Navegación del calendario */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          
          <h2 className="text-xl font-semibold text-gray-900">
            {meses[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {diasSemana.map((dia) => (
            <div key={dia} className="p-2 text-center text-sm font-medium text-gray-500">
              {dia}
            </div>
          ))}
        </div>

        {/* Grilla del calendario */}
        <div className="grid grid-cols-7 gap-1">
          {getDaysInMonth().map((day, index) => {
            const clasesDelDia = getClasesForDate(day.date);
            return (
              <div
                key={index}
                className={`min-h-[100px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                } ${day.isToday ? 'bg-blue-50 border-blue-200' : ''}`}
                onClick={() => handleDateClick(day)}
              >
                <div className={`text-sm font-medium mb-1 ${
                  day.isToday ? 'text-blue-600' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {day.date.getDate()}
                </div>
                
                <div className="space-y-1">
                  {clasesDelDia.slice(0, 2).map((clase) => (
                    <div
                      key={clase.id}
                      className={`text-xs p-1 rounded text-white truncate ${
                        clase.ubicacion === 'Colegio' ? 'bg-green-500' : 'bg-purple-500'
                      }`}
                      title={`${clase.titulo} - ${clase.profesora.nombre}`}
                    >
                      {clase.titulo}
                    </div>
                  ))}
                  {clasesDelDia.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{clasesDelDia.length - 2} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Colegio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-sm text-gray-600">Centro TecnoAcademia</span>
          </div>
        </div>
      </div>

      {/* Lista de clases del mes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Clases de {meses[currentDate.getMonth()]} ({clases.length})
          </h3>
        </div>
        
        {clases.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay clases programadas</h3>
            <p className="mt-1 text-sm text-gray-500">
              No hay clases programadas para este mes.
            </p>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-4">
              {clases.map((clase) => (
                <div key={clase.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full ${
                    clase.ubicacion === 'Colegio' ? 'bg-green-100' : 'bg-purple-100'
                  }`}>
                    <MapPin className={`${
                      clase.ubicacion === 'Colegio' ? 'text-green-600' : 'text-purple-600'
                    }`} size={20} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-medium text-gray-900">{clase.titulo}</h4>
                    
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <User size={14} className="mr-1" />
                      {clase.profesora.nombre} - {clase.profesora.especialidad}
                    </div>
                    
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <Clock size={14} className="mr-1" />
                      {formatDateTime(clase.fecha_inicio)} - {formatDateTime(clase.fecha_fin)}
                    </div>
                    
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <MapPin size={14} className="mr-1" />
                      {clase.ubicacion}
                    </div>
                    
                    {clase.descripcion && (
                      <p className="mt-2 text-sm text-gray-600">{clase.descripcion}</p>
                    )}
                  </div>
                  
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    clase.ubicacion === 'Colegio' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {clase.ubicacion}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Formulario de nueva clase */}
      {showForm && (
        <ClaseForm
          profesoras={profesoras}
          selectedDate={selectedDate}
          onSubmit={handleCreateClase}
          onCancel={() => {
            setShowForm(false);
            setSelectedDate(null);
          }}
        />
      )}
    </div>
  );
};

export default Calendario;