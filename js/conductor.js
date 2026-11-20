/**
 * conductor.js — Portal del conductor (FASE 6, conectado al backend real).
 * Login real (Firebase), verificación de rol + vinculación a conductor.
 * Lista sus propios viajes; aceptar/rechazar; flujo EN_CAMINO → EN_PUNTO → EN_CURSO → COMPLETADO;
 * incidencias; enlaces a Google Maps y WhatsApp con el cliente.
 */
(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const mapsUrl = (o, d) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(o + ' ' + d);
  const waUrl = (tel, msg) => 'https://wa.me/' + String(tel || '').replace(/\D/g, '') + '?text=' + encodeURIComponent(msg || '');

  const vistaLogin = $('#vistaLogin');
  const vistaPortal = $('#vistaPortal');
  let viajesActuales = [];

  const idToken = () => window.MRD_AUTH.obtenerIdToken();
  async function api(accion, payload) {
    return window.MRD_API.llamar(accion, payload || {}, await idToken());
  }

  async function mostrarPortal(ctx) {
    $('#nombreConductor').textContent = ctx.nombre || 'Conductor';
    vistaLogin.classList.add('d-none');
    vistaPortal.classList.remove('d-none');
    await cargarViajes();
  }

  function accionesPorEstado(v) {
    const id = escapeHtml(v.viajeId);
    const btn = (clase, accion, texto, icono) =>
      '<button class="mrd-as-btn ' + clase + '" data-viaje="' + id + '" data-accion="' + accion + '"><i class="bi ' + icono + '"></i>' + texto + '</button>';
    switch (String(v.estadoViaje).toUpperCase()) {
      case 'ASIGNADO': return btn('mrd-as-btn-aceptar', 'aceptar', 'Aceptar', 'bi-check-lg') + btn('mrd-as-btn-rechazar', 'rechazar', 'Rechazar', 'bi-x-lg');
      case 'ACEPTADO': return btn('mrd-as-btn-aceptar', 'EN_CAMINO', 'En camino', 'bi-signpost-split');
      case 'EN_CAMINO': return btn('mrd-as-btn-aceptar', 'EN_PUNTO_DE_RECOGIDA', 'En punto de recogida', 'bi-geo');
      case 'EN_PUNTO_DE_RECOGIDA': return btn('mrd-as-btn-aceptar', 'solicitarOTP', 'Solicitar código OTP', 'bi-key');
      case 'EN_CURSO': return btn('mrd-as-btn-aceptar', 'COMPLETADO', 'Finalizar viaje', 'bi-flag-fill');
      default: return '';
    }
  }

  function etiquetaEstado(e) {
    const map = {
      ASIGNADO: 'VIAJE ASIGNADO', ACEPTADO: 'ACEPTADO', EN_CAMINO: 'EN CAMINO',
      EN_PUNTO_DE_RECOGIDA: 'EN PUNTO DE RECOGIDA', EN_CURSO: 'EN CURSO',
      COMPLETADO: 'COMPLETADO', CANCELADO: 'CANCELADO'
    };
    return map[String(e).toUpperCase()] || String(e);
  }

  function tarjetaViaje_(v) {
    const origen = v.origen || '—', destino = v.destino || '—';
    const estado = String(v.estadoViaje || '').toUpperCase();
    const activo = !['COMPLETADO', 'CANCELADO'].includes(estado);
    const telCliente = String(v.telefonoCliente || '').replace(/\D/g, '');
    const contactoCliente = telCliente
      ? '<a class="mrd-as-btn mrd-as-btn-mapa" href="' + waUrl(telCliente, 'Hola ' + (v.nombreCliente || '') + ', soy tu conductor de MovilidadRD (' + (v.codigoReserva || '') + ').') + '" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i>Cliente</a>'
      : '';
    const ep = v.estadoPago || {};
    const pagoOk = ep.autorizado;
    const pagoTexto = pagoOk ? 'Autorizado' : 'Pendiente de pago';
    const pagoCls = pagoOk ? 'mrd-badge-confirmada' : 'mrd-badge-pendiente';
    const saldoTxt = (ep.saldo != null && ep.saldo > 0) ? ' · Saldo pendiente RD$ ' + Number(ep.saldo).toFixed(2) : '';
    const recogidaHtml = estado === 'EN_PUNTO_DE_RECOGIDA'
      ? '<div class="mt-2"><div class="small text-muted">Código OTP de recogida (6 dígitos)</div>' +
        '<input class="form-control form-control-sm" id="otpCodigo_' + escapeHtml(v.viajeId) + '" placeholder="OTP" maxlength="6" inputmode="numeric">' +
        '<button class="btn btn-mrd btn-sm mt-2 w-100" data-viaje="' + escapeHtml(v.viajeId) + '" data-accion="validarOTP"><i class="bi bi-check-lg me-1"></i>Validar OTP</button>' +
        '</div>'
      : '';
    return '<div class="mrd-asignacion mb-3" style="max-width:none;">' +
      '<div class="mrd-as-body">' +
        '<div class="mrd-as-brand"><span class="mrd-as-marca">Movilidad<span style="color:#fff">RD</span></span><span class="mrd-as-tipo">' + escapeHtml(v.tipoServicio || 'Servicio') + '</span></div>' +
        '<div class="mrd-as-estado-row"><span class="mrd-as-estado" style="font-size:1.05rem;' + (estado === 'ASIGNADO' ? 'color:#E4C878;' : '') + '">' + escapeHtml(etiquetaEstado(estado)) + '</span><span class="mrd-as-codigo">#' + escapeHtml(v.codigoReserva || 'VIAJE') + '</span></div>' +
        '<hr class="mrd-as-divider">' +
        '<div class="row g-2 mb-2">' +
        '<div class="col-6"><div class="small text-muted">Pago</div><span class="mrd-badge ' + pagoCls + ' d-block w-100 small">' + escapeHtml(pagoTexto) + '</span></div>' +
        '<div class="col-6"><div class="small text-muted">Saldo</div><div class="fw-bold small d-block w-100">' + (pagoOk ? 'Pagado' : 'RD$ ' + (ep.total != null ? Number(ep.total).toFixed(2) : '—')) + escapeHtml(saldoTxt) + '</div></div>' +
        '</div>' +
        '<div class="mrd-as-grid" style="grid-template-columns:auto 1fr;">' +
        '<div class="mrd-as-fecha"><div class="mrd-as-dia">' + escapeHtml(v.fechaViaje || '—') + '</div><div class="mrd-as-hora" style="font-size:1.7rem;">' + escapeHtml(v.horaViaje || '--:--') + '</div></div>' +
        '<div class="mrd-ruta" style="min-height:64px;">' +
        '<div class="mrd-ruta-punto"><div class="mrd-ruta-origen" style="font-size:.72rem;">' + escapeHtml(origen) + '</div></div>' +
        '<div class="mrd-ruta-punto"><div class="mrd-ruta-dest" style="font-size:.72rem;">' + escapeHtml(destino) + '</div></div>' +
        '</div>' +
        '</div>' +
        '<div class="mrd-as-meta" style="font-size:.68rem;">' +
        '<span><i class="bi bi-person"></i>' + escapeHtml(v.nombreCliente || '—') + '</span>' +
        '<span><i class="bi bi-people"></i>' + escapeHtml(v.pasajeros || '—') + ' pax</span>' +
        '<span><i class="bi bi-luggage"></i>' + escapeHtml(v.maletas || '—') + '</span>' +
        (v.numeroVuelo ? '<span><i class="bi bi-airplane"></i>' + escapeHtml(v.numeroVuelo + (v.aerolinea ? ' · ' + v.aerolinea : '')) + '</span>' : '') +
        '</div>' +
        (v.instrucciones ? '<div class="small mt-2" style="color:#C6A56B;"><i class="bi bi-sticky me-1"></i>' + escapeHtml(v.instrucciones) + '</div>' : '') +
        '<div class="mrd-as-meta" style="font-size:.68rem;"><span><i class="bi bi-car-front"></i>' + escapeHtml((v.vehiculo && v.vehiculo.matricula) || '—') + '</span><span><i class="bi bi-speedometer2"></i>' + escapeHtml(v.categoriaVehiculo || '') + '</span></div>' +
        '<div class="mrd-as-acciones">' +
        '<a class="mrd-as-btn mrd-as-btn-mapa" href="' + mapsUrl(origen, destino) + '" target="_blank" rel="noopener"><i class="bi bi-map"></i>Navegar</a>' +
        contactoCliente +
        (pagoOk ? accionesPorEstado(v) : '<span class="mrd-as-badge mrd-as-badge-pago text-muted small"><i class="bi bi-exclamation-circle"></i> Espera confirmación de pago para iniciar el viaje</span>') +
        (activo ? '<button class="mrd-as-btn mrd-as-btn-rechazar" data-viaje="' + escapeHtml(v.viajeId) + '" data-accion="incidencia"><i class="bi bi-exclamation-triangle"></i>Incidencia</button>' : '') +
        recogidaHtml +
        '</div>' +
      '</div>' +
    '</div>';
  }

  async function cargarViajes() {
    const lista = $('#listaViajes');
    const vacio = $('#sinViajes');
    lista.innerHTML = '<div class="text-center py-4"><div class="mrd-spinner mx-auto"></div></div>';
    const r = await api('misViajes', {});
    lista.innerHTML = '';
    if (r.ok && Array.isArray(r.data)) {
      viajesActuales = r.data;
      if (r.data.length) {
        vacio.classList.add('d-none');
        lista.innerHTML = r.data.map(tarjetaViaje_).join('');
      } else {
        vacio.classList.remove('d-none');
      }
    } else {
      vacio.classList.remove('d-none');
      vacio.querySelector('p').textContent = (r.error || 'No se pudieron cargar los viajes.');
    }
  }

  $('#listaViajes').addEventListener('click', async (ev) => {
    const btn = ev.target.closest('[data-accion]');
    if (!btn) return;
    const viajeId = btn.dataset.viaje;
    const accion = btn.dataset.accion;
    btn.disabled = true;
    let r;
    if (accion === 'aceptar') r = await api('aceptarViaje', { viajeId });
    else if (accion === 'rechazar') {
      const motivo = window.prompt('Motivo del rechazo (obligatorio):');
      if (!motivo) { btn.disabled = false; return; }
      r = await api('rechazarViaje', { viajeId, motivo: motivo.trim() });
    } else if (accion === 'incidencia') {
      const texto = window.prompt('Describe la incidencia:');
      if (!texto) { btn.disabled = false; return; }
      r = await api('reportarIncidencia', { viajeId, texto: texto.trim() });
    } else if (accion === 'solicitarOTP') {
      r = await api('generarOTPRecogida', { viajeId });
      if (r.ok) {
        window.alert('Código OTP generado. Comuníqueselo al cliente por canal oficial de MovilidadRD (ej. WhatsApp del negocio). Código: ' + r.data.otp);
      }
    } else if (accion === 'validarOTP') {
      const inp = $('#otpCodigo_' + escapeHtml(viajeId));
      const codigo = (inp ? inp.value : '') || '';
      if (!codigo) { btn.disabled = false; return window.alert('Indica el código OTP de 6 dígitos.'); }
      r = await api('validarOTPRecogida', { viajeId, codigo: codigo.trim() });
    } else r = await api('actualizarEstadoViaje', { viajeId, nuevoEstado: accion });
    btn.disabled = false;
    if (r && !r.ok) window.alert(r.error || 'No se pudo completar la acción.');
    await cargarViajes();
  });

  $('#btnRefrescar').addEventListener('click', cargarViajes);

  $('#formLogin').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const btn = $('#btnLogin');
    const err = $('#loginError');
    err.classList.add('d-none');
    btn.disabled = true;
    try {
      await window.MRD_AUTH.iniciarSesion($('#loginEmail').value.trim(), $('#loginPass').value);
      const ctx = await api('obtenerContexto', {});
      if (!ctx.ok) throw new Error(ctx.error || 'No autorizado.');
      if (ctx.data.rol !== 'CONDUCTOR') throw new Error('Este acceso es solo para conductores. Los administradores usan el panel.');
      if (!ctx.data.conductorId) throw new Error('Tu usuario no está vinculado a un conductor. Contacta a administración.');
      await mostrarPortal(ctx.data);
    } catch (e) {
      err.textContent = e.message || 'No se pudo iniciar sesión.';
      err.classList.remove('d-none');
    } finally {
      btn.disabled = false;
    }
  });

  $('#btnSalir').addEventListener('click', async () => {
    await window.MRD_AUTH.cerrarSesion();
    window.location.reload();
  });

  if (window.MRD_AUTH) {
    window.MRD_AUTH.esperarSesion().then(async (user) => {
      if (!user) return;
      try {
        const ctx = await api('obtenerContexto', {});
        if (ctx.ok && ctx.data.rol === 'CONDUCTOR' && ctx.data.conductorId) await mostrarPortal(ctx.data);
      } catch (e) { /* mostrar login */ }
    }).catch(() => { /* Firebase sin configurar: mostrar login */ });
  }
})();
