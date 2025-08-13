import React, { useState } from 'react';
import { X } from 'lucide-react';

const AsistenciaForm = ({ profesoras, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    profesora_id: '',
    fecha: new Date().toISOString().split('T')[0],
    presente: true,
    observaciones: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      profesora_id: parseInt(formData.profesora_id),
      fecha: new Date(formData.fecha + 'T00:00:00').toISOString()
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Nueva Asistencia</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha *
            </label>
            <input
              type="date"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.fecha}
              onChange={(e) => handleChange('fecha', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado de Asistencia *
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="presente"
                  checked={formData.presente === true}
                  onChange={() => handleChange('presente', true)}
                  className="mr-2 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Presente</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="presente"
                  checked={formData.presente === false}
                  onChange={() => handleChange('presente', false)}
                  className="mr-2 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Ausente</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Agregar comentarios adicionales..."
              value={formData.observaciones}
              onChange={(e) => handleChange('observaciones', e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
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
              Guardar Asistencia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AsistenciaForm;