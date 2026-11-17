/**
 * portal.js — Lógica del portal público (FASE 1).
 * Renderiza servicios, flota, destinos y FAQ desde datos estáticos de catálogo
 * (el contenido de catálogo no es dato sensible). Los formularios quedan
 * deshabilitados hasta que la Fase 2 registre 'crearReservaPublica' en el backend.
 */
(function () {
  'use strict';

  const SERVICIOS = [
    { icono: 'bi-airplane', titulo: 'Traslados aeroportuarios', texto: 'SDQ, STI, PUJ, POP, AZS. Monitoreo de vuelo y espera sin costo hasta 60 minutos.' },
    { icono: 'bi-building', titulo: 'Transporte ejecutivo', texto: 'Servicio corporativo discreto, puntual y con presentación impecable.' },
    { icono: 'bi-map', titulo: 'Viajes al interior', texto: 'Santiago, Punta Cana, La Romana, Samaná, Puerto Plata y todo el país.' },
    { icono: 'bi-camera', titulo: 'Turismo', texto: 'Tours privados con conductor bilingüe bajo solicitud.' },
    { icono: 'bi-clock-history', titulo: 'Servicio por horas', texto: 'Disponibilidad por bloque horario para reuniones, eventos y diligencias.' },
    { icono: 'bi-shield-check', titulo: 'Viajes seguros', texto: 'Conductores verificados, vehículos asegurados y soporte en ruta.' }
  ];

  const VEHICULOS = [
    { icono: 'bi-car-front', nombre: 'Sedán', detalle: 'Hasta 4 pasajeros · 3 maletas', ideal: 'Traslados ejecutivos y aeropuerto' },
    { icono: 'bi-car-front-fill', nombre: 'SUV', detalle: 'Hasta 6 pasajeros · 4 maletas', ideal: 'Familias y equipaje extra' },
    { icono: 'bi-bus-front', nombre: 'Van', detalle: 'Hasta 8 pasajeros · 6 maletas', ideal: 'Grupos y aeropuerto' },
    { icono: 'bi-stars', nombre: 'Luxury', detalle: 'Hasta 4 pasajeros · 3 maletas', ideal: 'Ejecutivos VIP' },
    { icono: 'bi-people-fill', nombre: 'Minibús', detalle: 'Hasta 15 pasajeros · 12 maletas', ideal: 'Grupos grandes y eventos' }
  ];

  const DESTINOS = ['Aeropuerto SDQ', 'Aeropuerto PUJ', 'Aeropuerto STI', 'Aeropuerto POP', 'Santiago', 'Punta Cana', 'La Romana', 'Bávaro', 'Samaná', 'Puerto Plata', 'Boca Chica', 'Juan Dolio'];

  const FAQ = [
    ['¿Cómo reservo?', 'Completa el formulario de reserva o escríbenos por WhatsApp. Recibirás un código único (MRD-2026-00001) y la confirmación antes del viaje.'],
    ['¿Puedo viajar sin registrarme?', 'Sí. Los clientes no necesitan cuenta. Solo necesitamos tu nombre y un teléfono o WhatsApp de contacto.'],
    ['¿Cómo consulto mi reserva?', 'Con tu código de reserva y el token privado que te entregamos al registrarla. Un código por sí solo no revela información.'],
    ['¿Cuál es la política de cancelación?', 'La política se confirma al cotizar; avisa con la mayor anticipación posible para reasignar el servicio.'],
    ['¿Aceptan pago con tarjeta?', 'En esta primera versión los pagos se acuerdan con administración (efectivo, transferencia). El cobro en línea se habilitará posteriormente.'],
    ['¿Hacen viajes fuera de Santo Domingo?', 'Sí. Cobertura nacional con tarifa fija o cotización según ruta y vehículo.']
  ];

  const bloque = (html) => html;

  document.getElementById('gridServicios').innerHTML = SERVICIOS.map((s) => bloque(
    '<div class="col-6 col-lg-4"><div class="mrd-card p-3 p-md-4"><div class="mrd-card-icono"><i class="bi ' + s.icono + '"></i></div>' +
    '<h3 class="mt-3">' + s.titulo + '</h3><p class="text-muted small mb-0">' + s.texto + '</p></div></div>'
  )).join('');

  document.getElementById('gridVehiculos').innerHTML = VEHICULOS.map((v) => bloque(
    '<div class="col-6 col-lg-2 col-md-4"><div class="mrd-card p-3 text-center"><i class="bi ' + v.icono + '" style="font-size:2rem;color:#C6A56B"></i>' +
    '<h5 class="mt-2 mb-1">' + v.nombre + '</h5><p class="small text-muted mb-1">' + v.detalle + '</p><p class="small mb-0"><em>' + v.ideal + '</em></p></div></div>'
  )).join('');

  document.getElementById('chipsDestinos').innerHTML = DESTINOS.map((d) =>
    '<span class="badge rounded-pill" style="background:#151515;color:#C6A56B;font-weight:600;padding:.55em 1.1em;font-size:.82rem">' + d + '</span>'
  ).join('');

  document.getElementById('acordeonFaq').innerHTML = FAQ.map(([q, a], i) => bloque(
    '<div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button' + (i ? ' collapsed' : '') + '" type="button" data-bs-toggle="collapse" data-bs-target="#faq' + i + '" aria-expanded="' + (i === 0) + '">' + q + '</button></h2>' +
    '<div id="faq' + i + '" class="accordion-collapse collapse' + (i === 0 ? ' show' : '') + '" data-bs-parent="#acordeonFaq"><div class="accordion-body">' + a + '</div></div></div>'
  )).join('');

  // Enlaces de WhatsApp: usan el número configurado en js/config.js si existe
  const numero = (window.MRD_CONFIG && window.MRD_CONFIG.WHATSAPP_NEGOCIO) || '18096131079';
  const mensaje = encodeURIComponent('Hola, quiero cotizar un viaje con MovilidadRD.');
  ['btnWhatsAppHero', 'btnWhatsAppFlotante', 'btnContactoWA', 'enlaceContactoWA'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = 'https://wa.me/' + numero.replace(/\D/g, '') + '?text=' + mensaje;
  });

  // Utilidades del formulario
  const $ = (id) => document.getElementById(id);
  const CAPACIDAD = { SEDAN: 4, SUV: 6, VAN: 8, LUXURY: 4, MINIBUS: 15 };
  const formatearRD = (n) => 'RD$ ' + Number(n).toLocaleString('es-DO', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function validarCliente() {
    const errores = [];
    const tipo = $('tipoServicio').value;
    const categoria = $('categoria').value;
    const origen = $('origen').value.trim();
    const destino = $('destino').value.trim();
    const fechaRaw = $('fecha').value.trim();
    const hora = $('hora').value;
    const pasajeros = Number($('pasajeros').value);
    const nombre = $('nombreCliente').value.trim();
    const telefono = $('telefono').value.trim();
    const email = $('email').value.trim();

    if (!tipo) errores.push('Selecciona el tipo de servicio.');
    if (!categoria) errores.push('Selecciona la categoría de vehículo.');
    if (origen.length < 3) errores.push('Indica el origen (mínimo 3 caracteres).');
    if (destino.length < 3) errores.push('Indica el destino (mínimo 3 caracteres).');

    const mf = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fechaRaw);
    if (!mf) {
      errores.push('Fecha inválida. Use DD/MM/AAAA.');
    } else {
      const f = new Date(Number(mf[3]), Number(mf[2]) - 1, Number(mf[1]));
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      if (isNaN(f.getTime()) || f.getTime() < hoy.getTime()) errores.push('La fecha debe ser hoy o futura.');
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) errores.push('Indica la hora de recogida.');
    if (!Number.isInteger(pasajeros) || pasajeros < 1) errores.push('Pasajeros debe ser un entero ≥ 1.');
    else if (categoria && pasajeros > CAPACIDAD[categoria]) errores.push('La categoría ' + categoria + ' admite hasta ' + CAPACIDAD[categoria] + ' pasajeros.');
    if (nombre.length < 3) errores.push('Indica el nombre del pasajero.');
    if (!/^(\+?1)?[\s().-]*(809|829|849)[\s().-]*\d{3}[\s().-]*\d{4}$/.test(telefono)) errores.push('Teléfono dominicano válido (809/829/849).');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errores.push('Correo inválido.');

    return errores;
  }

  // Envío real de la reserva (el servidor vuelve a validar TODO)
  const form = $('formReserva');
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const errores = validarCliente();
    const salida = $('resultadoReserva');
    salida.className = 'alert';
    if (errores.length) {
      salida.classList.add('alert-danger');
      salida.innerHTML = '<strong>Revisa el formulario:</strong><ul class="mb-0 mt-1">' + errores.map((e) => '<li>' + escapeHtml(e) + '</li>').join('') + '</ul>';
      salida.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    const btn = $('btnEnviarReserva');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Enviando…';
    salida.classList.add('d-none');

    const payload = {
      tipoServicio: $('tipoServicio').value,
      categoria: $('categoria').value,
      origen: $('origen').value.trim(),
      destino: $('destino').value.trim(),
      fecha: $('fecha').value.trim(),
      hora: $('hora').value,
      pasajeros: Number($('pasajeros').value),
      maletas: Number($('maletas').value || 0),
      nombreCliente: $('nombreCliente').value.trim(),
      telefono: $('telefono').value.trim(),
      email: $('email').value.trim(),
      numeroVuelo: $('numeroVuelo').value.trim(),
      aerolinea: $('aerolinea').value.trim(),
      observaciones: $('observaciones').value.trim(),
      viajeRegreso: $('viajeRegreso').checked,
      sitioWeb: $('sitioWeb').value
    };

    const r = await window.MRD_API.llamar('crearReservaPublica', payload, null);

    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-send me-1"></i> Enviar solicitud';

    if (!r.ok) {
      salida.classList.remove('d-none', 'alert-info');
      salida.classList.add('alert-danger');
      let detalle = escapeHtml(r.error || 'No se pudo registrar la solicitud. Intente nuevamente.');
      if (r.campos && typeof r.campos === 'object') {
        const lista = Object.values(r.campos).filter(Boolean).map((e) => '<li>' + escapeHtml(e) + '</li>').join('');
        if (lista) detalle += '<ul class="mb-0 mt-1">' + lista + '</ul>';
      }
      salida.innerHTML = detalle;
      salida.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    const d = r.data || {};
    if (d.tokenPrivado) {
      // Confirmación completa
      form.classList.add('d-none');
      const panel = $('panelConfirmacion');
      panel.classList.remove('d-none');
      $('confCodigo').textContent = d.codigo || '—';
      const badge = $('confEstado');
      badge.textContent = d.estado || 'PENDIENTE';
      badge.className = 'mrd-badge ' + (d.estado === 'CONFIRMADA' ? 'mrd-badge-confirmada' : d.estado === 'CANCELADA' ? 'mrd-badge-cancelada' : 'mrd-badge-pendiente');
      if (d.tarifaTotal != null) {
        $('confTarifa').textContent = formatearRD(d.tarifaTotal) + (d.esTarifaEjemplo ? ' · (tarifa de ejemplo — será confirmada)' : '') + ' · ' + d.metodoTarifa;
      } else {
        $('confTarifa').textContent = 'Cotización pendiente de confirmación por el administrador';
      }
      $('confToken').textContent = d.tokenPrivado;
      $('confirmacionMensaje').textContent = d.mensaje || 'Guarda estos datos. Los necesitas para consultar el estado de tu viaje.';
      const msg = encodeURIComponent('Hola MovilidadRD, registré la reserva ' + (d.codigo || '') + '. Quedo atento a la confirmación.');
      $('confBtnWhatsApp').href = 'https://wa.me/' + numero.replace(/\D/g, '') + '?text=' + msg;
      panel.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Honeypot: respuesta simulada sin datos
      salida.textContent = 'Solicitud recibida.';
      salida.classList.remove('d-none');
    }
  });

  // Acciones del panel de confirmación
  $('btnCopiarToken').addEventListener('click', async () => {
    const token = $('confToken').textContent.trim();
    try {
      await navigator.clipboard.writeText(token);
      $('btnCopiarToken').innerHTML = '<i class="bi bi-check-lg"></i>';
      setTimeout(() => { $('btnCopiarToken').innerHTML = '<i class="bi bi-clipboard"></i>'; }, 1500);
    } catch (e) { /* portapapeles no disponible */ }
  });
  $('btnNuevaReserva').addEventListener('click', () => {
    $('panelConfirmacion').classList.add('d-none');
    form.reset();
    form.classList.remove('d-none');
    form.scrollIntoView({ behavior: 'smooth' });
  });

  // Consulta de reserva (código + token privado)
  $('formConsulta').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const salida = $('resultadoConsulta');
    const btn = $('btnConsultarReserva');
    const codigo = $('codigoConsulta').value.trim();
    const token = $('tokenConsulta').value.trim();
    btn.disabled = true;
    salida.className = 'alert';
    salida.classList.add('d-none');

    const r = await window.MRD_API.llamar('consultarReserva', { codigo, token }, null);
    btn.disabled = false;

    if (!r.ok) {
      salida.classList.remove('d-none');
      salida.classList.add('alert-danger');
      salida.textContent = r.error || 'No se pudo consultar la reserva.';
      return;
    }
    const d = r.data;
    const tarifa = (d.tarifaTotal != null) ? formatearRD(d.tarifaTotal) + ' · ' + d.metodoTarifa : 'Cotización pendiente';
    salida.classList.remove('d-none');
    salida.classList.add('alert-success');
    salida.innerHTML =
      '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2">' +
        '<strong>' + escapeHtml(d.codigo) + '</strong>' +
        '<span class="mrd-badge ' + (d.estado === 'CONFIRMADA' || d.estado === 'ASIGNADA' ? 'mrd-badge-confirmada' : 'mrd-badge-pendiente') + '">' + escapeHtml(d.estado) + '</span>' +
      '</div>' +
      '<ul class="list-unstyled small mb-0 mt-2" style="line-height:1.9;">' +
        '<li><i class="bi bi-geo-alt text-dorado me-1"></i>' + escapeHtml(d.origen) + ' → ' + escapeHtml(d.destino) + '</li>' +
        '<li><i class="bi bi-calendar3 text-dorado me-1"></i>' + escapeHtml(d.fechaViaje) + ' · ' + escapeHtml(d.horaViaje) + '</li>' +
        '<li><i class="bi bi-people text-dorado me-1"></i>' + escapeHtml(d.pasajeros) + ' pasajeros · ' + escapeHtml(d.maletas) + ' maletas · ' + escapeHtml(d.categoriaVehiculo) + '</li>' +
        '<li><i class="bi bi-person text-dorado me-1"></i>' + escapeHtml(d.nombreCliente) + ' · ' + escapeHtml(d.telefonoEnmascarado) + '</li>' +
        '<li><i class="bi bi-cash-coin text-dorado me-1"></i>' + escapeHtml(tarifa) + '</li>' +
      '</ul>';
  });
})();
