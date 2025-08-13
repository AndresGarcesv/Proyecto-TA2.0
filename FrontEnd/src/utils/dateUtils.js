// Utilidades para formatear fechas
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('es-CO', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDateForInput = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

export const formatDateTimeForInput = (date) => {
  return new Date(date).toISOString().slice(0, 16);
};

export const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  return checkDate.toDateString() === today.toDateString();
};

export const isSameMonth = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
};

export const getMonthName = (month) => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril',
    'Mayo', 'Junio', 'Julio', 'Agosto',
    'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[month];
};

export const getDayName = (day) => {
  const days = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles',
    'Jueves', 'Viernes', 'Sábado'
  ];
  return days[day];
};