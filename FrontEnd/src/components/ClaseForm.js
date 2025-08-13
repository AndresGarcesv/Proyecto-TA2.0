import React, { useState } from 'react';
import { X } from 'lucide-react';

const ClaseForm = ({ profesoras, selectedDate, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    profesora_id: '',
    titulo: '',
    fecha_inicio: selectedDate ? selectedDate.toISOString().slice(0, 16) : '',
    fecha_fin: selectedDate ? selectedDate.toISOString().slice(0, 16) : '',
    ubicacion: 'Colegio',
    descripcion: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validar que la fecha de fin sea posterior a la de inicio
    if (new Date(formData.fecha_fin) <= new Date(formData.fecha_inicio)) {
      alert('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    onSubmit({
      ...formData,
      profesora_id: parseInt(formData.profesora_id),
      fecha_inicio: new Date(formData.fecha_inicio).toISOString(),
      fecha_fin: new Date(formData.fecha_fin).toISOString()
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // Si se cambia la fecha de inicio y no hay fecha de fin, 
      // establecer fecha de fin 2 horas después
      if (field === 'fecha_inicio' && !prev.fecha_fin) {
        const startDate = new Date(value);
        startDate.setHours(startDate.getHours() + 2);
        newData.fecha_fin = startDate.toISOString().slice(0, 16);
      }

      return newData;
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            {selectedDate ? `Nueva Clase - ${selectedDate.toLocaleDateString('es-CO')}` : 'Nueva Clase'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.fecha_inicio}
                onChange={(e) => handleChange('fecha_inicio', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha y Hora de Fin *
              </label>
              <input
                type="datetime-local"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.fecha_fin}
                onChange={(e) => handleChange('fecha_fin', e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
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
                
                <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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