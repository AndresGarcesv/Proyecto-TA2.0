import React, { useState } from 'react';
import { X } from 'lucide-react';

const ClaseForm = ({ profesoras, selectedDate, onSubmit, onCancel }) => {
  // Función para convertir una fecha a string en formato datetime-local
  const dateToLocalString = (date) => {
    if (!date) return '';
    
    // Crear una nueva fecha en la zona horaria local
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localDate.toISOString().slice(0, 16);
  };

  // Función para obtener la fecha inicial (fecha seleccionada o fecha actual)
  const getInitialDate = () => {
    if (selectedDate) {
      // Si hay una fecha seleccionada, usar esa fecha a las 8:00 AM
      const initialDate = new Date(selectedDate);
      initialDate.setHours(8, 0, 0, 0);
      return initialDate;
    }
    
    // Si no, usar la fecha actual
    const now = new Date();
    now.setMinutes(0, 0, 0); // Redondear a la hora más cercana
    return now;
  };

  // Función para obtener la fecha final (2 horas después de la inicial)
  const getInitialEndDate = () => {
    const startDate = getInitialDate();
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 2);
    return endDate;
  };

  const [formData, setFormData] = useState({
    profesora_id: '',
    titulo: '',
    fecha_inicio: dateToLocalString(getInitialDate()),
    fecha_fin: dateToLocalString(getInitialEndDate()),
    ubicacion: 'Colegio',
    descripcion: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Crear objetos Date para validación
    const startDate = new Date(formData.fecha_inicio);
    const endDate = new Date(formData.fecha_fin);
    
    // Validar que la fecha de fin sea posterior a la de inicio
    if (endDate <= startDate) {
      alert('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    // Validar que las fechas no sean en el pasado (excepto si es el día de hoy)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    
    if (startDay < today) {
      alert('No se pueden programar clases en fechas pasadas');
      return;
    }

    // Enviar los datos con las fechas en formato string
    // El backend se encargará de parsear correctamente las fechas
    onSubmit({
      ...formData,
      profesora_id: parseInt(formData.profesora_id),
      // Enviar las fechas como string en formato ISO
      fecha_inicio: formData.fecha_inicio,
      fecha_fin: formData.fecha_fin
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // Si se cambia la fecha de inicio, actualizar automáticamente la fecha de fin
      // para que sea 2 horas después
      if (field === 'fecha_inicio' && value) {
        try {
          const startDate = new Date(value);
          if (!isNaN(startDate.getTime())) {
            const endDate = new Date(startDate);
            endDate.setHours(endDate.getHours() + 2);
            newData.fecha_fin = dateToLocalString(endDate);
          }
        } catch (error) {
          console.error('Error al calcular fecha de fin:', error);
        }
      }

      return newData;
    });
  };

  // Función para formatear la fecha para mostrar
  const formatDisplayDate = (date) => {
    if (!date) return '';
    
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return date.toLocaleDateString('es-CO', options);
  };
    const todayMin = new Date();
    todayMin.setHours(0, 0, 0, 0);
  todayMin.setMinutes(0); // Asegurarse de que sea desde las 00:00 del día actual 
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            {selectedDate 
              ? `Nueva Clase - ${formatDisplayDate(selectedDate)}` 
              : 'Nueva Clase'
            }
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profesora *
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.profesora_id}
                onChange={(e) => handleChange('profesora_id', e.target.value)}
              >
                <option value="">Seleccionar profesora</option>
                {profesoras.map((profesora) => (
                  <option key={profesora.id} value={profesora.id}>
                    {profesora.nombre} - {profesora.especialidad}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título de la Clase *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ej: Introducción a la Programación"
                value={formData.titulo}
                onChange={(e) => handleChange('titulo', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha y Hora de Inicio *
              </label>
              <input
                type="datetime-local"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.fecha_inicio}
                onChange={(e) => handleChange('fecha_inicio', e.target.value)}
                min={todayMin.toISOString().slice(0, 16)} // ✅ hoy desde las 00:00
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha y Hora de Fin *
              </label>
              <input
                type="datetime-local"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.fecha_fin}
                onChange={(e) => handleChange('fecha_fin', e.target.value)}
                min={formData.fecha_inicio} // La fecha de fin debe ser posterior a la de inicio
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="ubicacion"
                    value="Colegio"
                    checked={formData.ubicacion === 'Colegio'}
                    onChange={(e) => handleChange('ubicacion', e.target.value)}
                    className="mr-3 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Colegio</span>
                    <p className="text-sm text-gray-500">Clases en la institución educativa</p>
                  </div>
                </label>
                
                <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="ubicacion"
                    value="Centro TecnoAcademia"
                    checked={formData.ubicacion === 'Centro TecnoAcademia'}
                    onChange={(e) => handleChange('ubicacion', e.target.value)}
                    className="mr-3 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Centro TecnoAcademia</span>
                    <p className="text-sm text-gray-500">Formación en el centro tecnológico</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Descripción de la clase, objetivos, materiales necesarios..."
                value={formData.descripcion}
                onChange={(e) => handleChange('descripcion', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!formData.profesora_id || !formData.titulo || !formData.fecha_inicio || !formData.fecha_fin}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Programar Clase
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClaseForm;