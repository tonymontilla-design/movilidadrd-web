/**
 * portal.js — Lógica del portal público (FASE 1).
 * Renderiza servicios, flota, destinos y FAQ desde datos estáticos de catálogo
 * (el contenido de catálogo no es dato sensible). Los formularios quedan
 * deshabilitados hasta que la Fase 2 registre 'crearReservaPublica' en el backend.
 */
(function () {
  'use strict';

  const SERVICIOS = [
    { icono: 'bi-airplane', img: 'svc-aeropuerto.jpg', titulo: 'Traslados al Aeropuertos', texto: 'SDQ, STI, PUJ, POP, AZS. Monitoreo de vuelo y espera sin costo hasta 60 minutos.' },
    { icono: 'bi-building', img: 'svc-ejecutivo.jpg', titulo: 'Transporte ejecutivo', texto: 'Servicio corporativo discreto, puntual y con presentación impecable.' },
    { icono: 'bi-map', img: 'svc-interior.jpg', titulo: 'Viajes al interior', texto: 'Santiago, Punta Cana, La Romana, Samaná, Puerto Plata y todo el país.' },
    { icono: 'bi-camera', img: 'svc-turismo.jpg', titulo: 'Turismo', texto: 'Tours privados con conductor bilingüe bajo solicitud.' },
    { icono: 'bi-clock-history', img: 'svc-horas.jpg', titulo: 'Servicio por horas', texto: 'Disponibilidad por bloque horario para reuniones, eventos y diligencias.' },
    { icono: 'bi-shield-check', img: 'svc-seguros.jpg', titulo: 'Viajes seguros', texto: 'Conductores verificados, vehículos asegurados y soporte en ruta.' }
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
    '<div class="col-6 col-lg-4"><div class="mrd-card p-3 p-md-4">' +
    '<img class="mrd-card-img" src="assets/img/' + s.img + '" alt="' + s.titulo + '" loading="lazy">' +
    '<div class="mrd-card-icono mt-3"><i class="bi ' + s.icono + '"></i></div>' +
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

  // ── Conversores fecha/hora (date picker + selects 12h AM/PM) ──
  // Espejo probado en shared/validaciones.js (fechaISOaDMY, hora12a24…)
  function fechaISOaDMY(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
  }
  function fechaDMYaISO(dmy) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(dmy || '').trim());
    return m ? m[3] + '-' + m[2] + '-' + m[1] : '';
  }
  function horaSelectsA24() {
    const h = Number($('hora').value);
    const min = Number($('minuto').value);
    const pm = $('ampm').value === 'PM';
    if (!h || Number.isNaN(min)) return '';
    const h24 = (h % 12) + (pm ? 12 : 0);
    return (h24 < 10 ? '0' : '') + h24 + ':' + (min < 10 ? '0' : '') + min;
  }
  function hora24aSelects(hhmm) {
    const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(hhmm || '').trim());
    if (!m) return false;
    $('hora').value = String(Number(m[1]) % 12 || 12);
    $('minuto').value = m[2];
    $('ampm').value = Number(m[1]) >= 12 ? 'PM' : 'AM';
    return true;
  }
  function iniciarCampoFechaHora() {
    const hoy = new Date();
    const pad = (n) => (n < 10 ? '0' : '') + n;
    const fecha = $('fecha');
    if (fecha) fecha.min = hoy.getFullYear() + '-' + pad(hoy.getMonth() + 1) + '-' + pad(hoy.getDate());
    let hs = '';
    for (let h = 1; h <= 12; h++) hs += '<option value="' + h + '">' + h + '</option>';
    $('hora').innerHTML = hs;
    let ms = '';
    for (let m = 0; m < 60; m++) ms += '<option value="' + pad(m) + '">' + pad(m) + '</option>';
    $('minuto').innerHTML = ms;
    // Hora por defecto: 08:00 AM
    $('hora').value = '8';
    $('minuto').value = '00';
    $('ampm').value = 'AM';
  }

  function validarCliente() {
    const errores = [];
    const tipo = $('tipoServicio').value;
    const categoria = $('categoria').value;
    const origen = $('origen').value.trim();
    const destino = $('destino').value.trim();
    const fechaRaw = fechaISOaDMY($('fecha').value);
    const hora = horaSelectsA24();
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
      errores.push('Selecciona la fecha de recogida.');
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

    // Servicio por horas: las horas definen la cotización (1–12)
    if (tipo === 'POR_HORAS') {
      const horas = Number($('horas').value);
      if (!Number.isInteger(horas) || horas < 1 || horas > 12) errores.push('Indica las horas requeridas (entre 1 y 12).');
    }

    return errores;
  }

  // Envío real de la reserva (el servidor vuelve a validar TODO)
  const form = $('formReserva');
  iniciarCampoFechaHora();

  // Servicio por horas: mostrar/ocultar el campo de horas requeridas
  $('tipoServicio').addEventListener('change', () => {
    $('campoHoras').classList.toggle('d-none', $('tipoServicio').value !== 'POR_HORAS');
  });

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
      fecha: fechaISOaDMY($('fecha').value),
      hora: horaSelectsA24(),
      pasajeros: Number($('pasajeros').value),
      maletas: Number($('maletas').value || 0),
      nombreCliente: $('nombreCliente').value.trim(),
      telefono: $('telefono').value.trim(),
      email: $('email').value.trim(),
      numeroVuelo: $('numeroVuelo').value.trim(),
      aerolinea: $('aerolinea').value.trim(),
      observaciones: $('observaciones').value.trim(),
      viajeRegreso: $('viajeRegreso').checked,
      horas: $('tipoServicio').value === 'POR_HORAS' ? Number($('horas').value || 0) : 0,
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
      const notaCorreo = d.emailEnviado ? 'También te enviamos el detalle por correo.' : 'Guarda estos datos; los necesitas para consultar tu reserva.';
      $('confirmacionMensaje').textContent = (d.mensaje ? d.mensaje + ' ' : '') + notaCorreo;
      $('confBtnWhatsApp').href = d.enlaceWhatsApp || ('https://wa.me/' + numero.replace(/\D/g, '') + '?text=' + encodeURIComponent('Hola MovilidadRD, registré la reserva ' + (d.codigo || '') + '.'));
      panel.scrollIntoView({ behavior: 'smooth' });

      // Pagos desactivados: no hay panel de pago.
    } else {
      // Honeypot: respuesta simulada sin datos
      salida.textContent = 'Solicitud recibida.';
      salida.classList.remove('d-none');
    }
  });

  // Pagos desactivados: el flujo es simple — reserva → PENDIENTE → COTIZADA → admin confirma.
  // No hay panel de pago, no hay link de pago, no hay botones de pago.

  // Acciones del panel de confirmación
  $('btnCopiarToken').addEventListener('click', async () => {
    const token = $('confToken').textContent.trim();
    try {
      await navigator.clipboard.writeText(token);
      $('btnCopiarToken').innerHTML = '<i class="bi bi-check-lg"></i>';
      setTimeout(() => { $('btnCopiarToken').innerHTML = '<i class="bi bi-clipboard"></i>'; }, 1500);
    } catch (e) { /* portapapeles no disponible */ }
  });
  $('btnCompartirReserva').addEventListener('click', async () => {
    const codigo = $('confCodigo').textContent.trim();
    const texto = 'Mi reserva MovilidadRD: ' + codigo + '\n' + window.location.origin + '/index.html#reservar';
    try {
      if (navigator.share) { await navigator.share({ title: 'MovilidadRD — Mi viaje', text: texto }); return; }
    } catch (e) { /* cancelada por el usuario */ }
    try {
      await navigator.clipboard.writeText(texto);
      window.alert('Texto copiado al portapapeles.');
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
    const puedeAceptar = String(d.estado).toUpperCase() === 'COTIZADA' && d.tarifaTotal != null;
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
      '</ul>' +
      (puedeAceptar
        ? '<div class="d-flex flex-wrap gap-2 mt-3">' +
            '<button type="button" class="btn btn-mrd btn-sm mrd-aceptar-cotizacion"><i class="bi bi-check2-circle"></i> Aceptar cotización</button>' +
            '<button type="button" class="btn btn-mrd-outline btn-sm mrd-rechazar-cotizacion"><i class="bi bi-x-circle"></i> No aceptar</button>' +
          '</div>'
        : '');

    if (puedeAceptar) {
      const bAceptar = salida.querySelector('.mrd-aceptar-cotizacion');
      const bRechazar = salida.querySelector('.mrd-rechazar-cotizacion');
      const accionCotizacion = async (acepta) => {
        if (!acepta && !window.confirm('¿Seguro que deseas rechazar la cotización?')) return;
        if (bAceptar) bAceptar.disabled = true;
        if (bRechazar) bRechazar.disabled = true;
        const rr = await window.MRD_API.llamar('aceptarCotizacion', { codigo, token, acepta }, null);
        if (!rr.ok) {
          if (bAceptar) bAceptar.disabled = false;
          if (bRechazar) bRechazar.disabled = false;
          window.alert(rr.error || 'No se pudo procesar la solicitud.');
          return;
        }
        window.alert((rr.data && rr.data.mensaje) || 'Solicitud procesada.');
        $('formConsulta').dispatchEvent(new Event('submit', { cancelable: true }));
      };
      if (bAceptar) bAceptar.addEventListener('click', () => accionCotizacion(true));
      if (bRechazar) bRechazar.addEventListener('click', () => accionCotizacion(false));
    }
  });

  // Enlace desde el correo de solicitud: precarga código y token (?codigo=...&token=...#consultar)
  try {
    const q = new URLSearchParams(window.location.search);
    const qc = q.get('codigo');
    const qt = q.get('token');
    if (qc && qt) {
      $('codigoConsulta').value = qc;
      $('tokenConsulta').value = qt;
      const bloque = document.getElementById('bloqueConsulta');
      if (bloque) bloque.scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('formConsulta').dispatchEvent(new Event('submit', { cancelable: true }));
    }
  } catch (e) { /* sin parámetros de consulta */ }

  // ───────────── Asistente de reservas con IA ─────────────
  const btnUsarIA = $('btnUsarIA');
  const iaMensaje = $('iaMensaje');
  const iaRespuesta = $('iaMensajeRespuesta');

  if (btnUsarIA && iaMensaje && iaRespuesta) {
    btnUsarIA.addEventListener('click', async () => {
      const texto = iaMensaje.value.trim();
      if (!texto) return;
      btnUsarIA.disabled = true;
      btnUsarIA.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Procesando…';
      iaRespuesta.style.display = 'none';
      iaRespuesta.className = 'small';

      const r = await window.MRD_API.llamar('asesorIA', { mensaje: texto }, null);

      btnUsarIA.disabled = false;
      btnUsarIA.innerHTML = '<i class="bi bi-magic me-1"></i>Usar asistente';

      if (!r.ok) {
        iaRespuesta.textContent = 'Asistente no disponible por el momento. Puedes llenar el formulario manualmente.';
        iaRespuesta.className = 'small text-muted';
        iaRespuesta.style.display = 'block';
        return;
      }

      const d = r.data || {};
      const c = d.campos || {};

      const mapeo = {
        origen: 'origen',
        destino: 'destino',
        fecha: 'fecha',
        hora: 'hora',
        pasajeros: 'pasajeros',
        maletas: 'maletas',
        categoriaVehiculo: 'categoria',
        tipoServicio: 'tipoServicio'
      };

      for (const [campoIA, idForm] of Object.entries(mapeo)) {
        const el = $(idForm);
        if (el && c[campoIA] != null && String(c[campoIA]).trim() !== '') {
          const valor = String(c[campoIA]);
          // Date picker: la IA devuelve DD/MM/AAAA → convertir a AAAA-MM-DD
          if (campoIA === 'fecha') {
            const iso = fechaDMYaISO(valor);
            if (iso) el.value = iso;
            continue;
          }
          // Hora 12h: la IA devuelve HH:MM (24h) o "2:30 PM" → rellenar selects
          if (campoIA === 'hora') {
            if (!hora24aSelects(valor)) {
              const m12 = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(valor);
              if (m12) {
                $('hora').value = String(Number(m12[1]) % 12 || 12);
                $('minuto').value = m12[2];
                $('ampm').value = m12[3].toUpperCase();
              }
            }
            continue;
          }
          if (el.tagName === 'SELECT') {
            let encontrado = false;
            for (const opt of el.options) {
              if (String(opt.value).toUpperCase() === valor.toUpperCase()) {
                el.value = opt.value;
                encontrado = true;
                break;
              }
            }
            if (!encontrado) {
              for (const opt of el.options) {
                if (opt.text.toUpperCase().includes(valor.toUpperCase())) {
                  el.value = opt.value;
                  break;
                }
              }
            }
          } else {
            el.value = valor;
          }
        }
      }

      iaRespuesta.textContent = d.mensaje || 'He rellenado los campos detectados. Revisa antes de enviar.';
      iaRespuesta.className = 'small text-success';
      iaRespuesta.style.display = 'block';
      iaMensaje.value = '';
    });
  }
})();
