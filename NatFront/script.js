document.addEventListener('DOMContentLoaded', () => {

  // ====== LÍNEAS TECNOLÓGICAS ======
  const contenidosLineas = {
    materiales: `<h2>Materiales y Biotecnología</h2><p>Formación en biotecnología y ciencia de materiales.</p>`,
    tics: `<h2>TIC's e Inteligencia Artificial</h2><p>Programación, AI y tecnologías de la información.</p>`,
    diseno: `<h2>Diseño y Producto</h2><p>Diseño industrial, prototipado y creatividad.</p>`,
    produccion: `<h2>Producción y Transformación</h2><p>Procesos de producción y optimización.</p>`
  };
  const cards = document.querySelectorAll('.card');
  const detalleLinea = document.getElementById('detalle-linea');
  if (cards && detalleLinea) {
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const linea = card.dataset.linea;
        detalleLinea.innerHTML = contenidosLineas[linea] || '<p>Contenido no disponible.</p>';
        detalleLinea.style.display = 'block';
        detalleLinea.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // ====== CAMBIO DE TEMA ======
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("light-mode");
      // Si está light-mode, mostramos icono de luna para cambiar a oscuro después
      themeToggle.textContent = document.body.classList.contains("light-mode") ? "🌙" : "☀️";
    });
  }

  // ====== CONTACTO ======
  const contactForm = document.getElementById('contact-form');
  const successMessage = document.querySelector('.success-message');
  if (contactForm && successMessage) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      successMessage.style.display = 'block';
      successMessage.style.opacity = '1';
      contactForm.reset();
      setTimeout(() => {
        successMessage.style.opacity = '0';
        setTimeout(() => { successMessage.style.display = 'none'; }, 300);
      }, 4000);
    });
  }

  // ====== LOGIN MODAL ======
  const loginModal = document.getElementById('login-modal');
  const loginLink = document.querySelector('a.btn-login');
  const closeModalBtn = document.getElementById('close-modal');
  const loginForm = document.getElementById('login-form');
  const loginMessage = document.querySelector('.login-message');

  function showLoginMessage(text, color) {
  loginMessage.textContent = text;  
  if (color) {
    loginMessage.style.color = color;
  } else {
    loginMessage.style.removeProperty('color'); // usa el del CSS
  }
  loginMessage.classList.add('show');
}

  function hideLoginMessage() {
    if (!loginMessage) return;
    loginMessage.classList.remove('show');
    loginMessage.textContent = '';
  }

  // Al hacer click en 'Iniciar sesión' redirigimos al FrontEnd principal.
  // Intentamos primero el servidor de desarrollo en localhost:3000 y, si no responde,
  // caemos al archivo estático relativo `../FrontEnd/public/index.html`.
  if (loginLink) {
    loginLink.addEventListener('click', (e) => {
      e.preventDefault();
      const devUrl = 'http://localhost:3000';
      const fallbackUrl = '../FrontEnd/public/index.html';

      // Intento rápido para saber si el dev server está activo.
      // Usamos fetch con mode 'no-cors' y un timeout; si falla, redirigimos al fallback.
      const controller = new AbortController();
      const signal = controller.signal;
      const timeoutMs = 700;

      const timer = setTimeout(() => controller.abort(), timeoutMs);

      fetch(devUrl, { method: 'GET', mode: 'no-cors', signal })
        .then(() => {
          clearTimeout(timer);
          // Si el fetch no rechaza, redirigimos al dev server
          window.location.href = devUrl;
        })
        .catch(() => {
          // En caso de error o timeout, usamos el fallback local
          window.location.href = fallbackUrl;
        });
    });
  }

  if (closeModalBtn && loginModal) {
    closeModalBtn.addEventListener('click', () => {
      loginModal.style.display = 'none';
      if (loginForm) loginForm.reset();
      hideLoginMessage();
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
      loginModal.style.display = 'none';
      if (loginForm) loginForm.reset();
      hideLoginMessage();
    }
  });

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = (loginForm.email && loginForm.email.value || '').trim();
      const password = (loginForm.password && loginForm.password.value || '').trim();
      if (!email || !password) {
        showLoginMessage('Por favor, completa todos los campos.', 'red');
        return;
      }
      loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value.trim();

  if (!email || !password) {
    showLoginMessage('Por favor, completa todos los campos.', 'red');
    return;
  }

  try {
    const response = await fetch('http://127.0.0.1:8000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      showLoginMessage(errorData.detail || 'Credenciales incorrectas', 'red');
      return;
    }

    const data = await response.json();
    console.log('Token recibido:', data.access_token);

    showLoginMessage('Inicio de sesión exitoso ✅', 'green');

    // Guardar el token para próximas peticiones
    localStorage.setItem('token', data.access_token);

    setTimeout(() => {
      loginModal.style.display = 'none';
      hideLoginMessage();
    }, 1500);

  } catch (error) {
    console.error('Error al conectar con el backend:', error);
    showLoginMessage('Error de conexión con el servidor', 'red');
  }
});
    });
  }

  // ====== CALENDARIOS FACILITADORAS ======
  const calendarModal = document.getElementById("calendarModal");
  const calendarTitle = document.getElementById("calendarTitle");
  const calendarContainer = document.getElementById("calendarContainer");
  const calendarCloseBtn = calendarModal ? calendarModal.querySelector(".close") : null;

  const calendarios = {
    jennifer: `
      <ul style="text-align:left;">
        <li><strong>Lunes</strong>: 8:00am - 10:00am</li>
        <li><strong>Miércoles</strong>: 2:00pm - 4:00pm</li>
        <li><strong>Viernes</strong>: 9:00am - 11:00am</li>
      </ul>`,
    ayxa: `
      <ul style="text-align:left;">
        <li><strong>Martes</strong>: 10:00am - 12:00pm</li>
        <li><strong>Jueves</strong>: 1:00pm - 3:00pm</li>
      </ul>`,
    maria: `
      <ul style="text-align:left;">
        <li><strong>Lunes</strong>: 3:00pm - 5:00pm</li>
        <li><strong>Viernes</strong>: 8:00am - 10:00am</li>
      </ul>`,
    martha: `
      <ul style="text-align:left;">
        <li><strong>Miércoles</strong>: 9:00am - 11:00am</li>
        <li><strong>Viernes</strong>: 2:00pm - 4:00pm</li>
      </ul>`
  };

  document.querySelectorAll(".facilitadora-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.dataset.id;
      const nombre = card.querySelector("h4") ? card.querySelector("h4").textContent : id;
      if (calendarTitle) calendarTitle.textContent = `Calendario de ${nombre}`;
      if (calendarContainer) calendarContainer.innerHTML = calendarios[id] || "<p>No hay calendario disponible</p>";
      if (calendarModal) calendarModal.style.display = "flex";
    });
  });

  if (calendarCloseBtn && calendarModal) {
    calendarCloseBtn.addEventListener('click', () => {
      calendarModal.style.display = 'none';
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === calendarModal) calendarModal.style.display = 'none';
  });

}); 
