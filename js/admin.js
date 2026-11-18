/**
 * admin.js — Panel administrativo conectado al backend real (Fase 4).
 * KPIs, reservaciones con filtros y acciones (cotizar/confirmar/rechazar/cancelar),
 * catálogos (conductores, vehículos, clientes, viajes, destinos), tarifas (alta/edición/toggle),
 * exportación CSV y notificaciones. Nada está simulado.
 */
(function () {
  'use strict';

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const mrd = (n) => 'RD$ ' + (Number(n) || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const badgeEstado = (e) => {
    const map = { PENDIENTE: 'mrd-badge-pendiente', COTIZADA: 'mrd-badge-pendiente', CONFIRMADA: 'mrd-badge-confirmada', ASIGNADA: 'mrd-badge-confirmada', EN_CURSO: 'mrd-badge-confirmada', COMPLETADA: 'mrd-badge-confirmada', CANCELADA: 'mrd-badge-cancelada', RECHAZADA: 'mrd-badge-cancelada' };
    return '<span class="mrd-badge ' + (map[e] || 'mrd-badge-info') + '">' + escapeHtml(e || '—') + '</span>';
  };

  const MENU = [
    { id: 'dashboard', icono: 'bi-speedometer2', texto: 'Dashboard' },
    { id: 'reservaciones', icono: 'bi-calendar2-check', texto: 'Reservaciones' },
    { id: 'viajes', icono: 'bi-signpost-split', texto: 'Viajes' },
    { id: 'conductores', icono: 'bi-person-badge', texto: 'Conductores' },
    { id: 'vehiculos', icono: 'bi-car-front', texto: 'Vehículos' },
    { id: 'clientes', icono: 'bi-people', texto: 'Clientes' },
    { id: 'tarifas', icono: 'bi-cash-coin', texto: 'Tarifas' },
    { id: 'destinos', icono: 'bi-geo-alt', texto: 'Destinos' },
    { id: 'notificaciones', icono: 'bi-bell', texto: 'Notificaciones' },
    { id: 'reportes', icono: 'bi-bar-chart-line', texto: 'Reportes' },
    { id: 'configuracion', icono: 'bi-gear', texto: 'Configuración' },
    { id: 'usuarios', icono: 'bi-person-gear', texto: 'Usuarios' },
    { id: 'despacho', icono: 'bi-broadcast', texto: 'Despacho de viajes' },
    { id: 'auditoria', icono: 'bi-shield-lock', texto: 'Auditoría' },
    { id: 'pagos', icono: 'bi-credit-card', texto: 'Pagos' },
    { id: 'gastos', icono: 'bi-receipt', texto: 'Gastos' },
    { id: 'comisiones', icono: 'bi-percent', texto: 'Comisiones' }
  ];

  let paginaReservas = 1;
  let seccionActual = 'dashboard';
  let contextoAdmin = null;

  const idToken = () => window.MRD_AUTH.obtenerIdToken();
  async function api(accion, payload) {
    const t = await idToken();
    return window.MRD_API.llamar(accion, payload || {}, t);
  }

  function renderTabla(tablaId, columnas, filas, vacio) {
    const tabla = $('#' + tablaId);
    tabla.querySelector('thead').innerHTML = '<tr>' + columnas.map((c) => '<th>' + escapeHtml(c.titulo) + '</th>').join('') + '</tr>';
    const tbody = tabla.querySelector('tbody');
    if (!filas || !filas.length) {
      tbody.innerHTML = '<tr><td colspan="' + columnas.length + '" class="text-center text-muted py-4">' + escapeHtml(vacio || 'Sin registros') + '</td></tr>';
      return;
    }
    tbody.innerHTML = filas.map((fila) => '<tr>' + columnas.map((c) => '<td>' + (c.fn ? c.fn(fila) : escapeHtml(fila[c.clave])) + '</td>').join('') + '</tr>').join('');
  }

  function mostrarSeccion(id) {
    seccionActual = id;
    $$('#menuLateral .mrd-side-link').forEach((a) => a.classList.toggle('activo', a.dataset.seccion === id));
    $('#barraLateral').classList.remove('abierto');
    const item = MENU.find((m) => m.id === id);
    $('#tituloSeccion').textContent = item ? item.texto : id;
    $$('.mrd-seccion-panel').forEach((s) => s.classList.add('d-none'));
    const destino = document.getElementById('seccion-' + id);
    if (destino) { destino.classList.remove('d-none'); cargarSeccion(id); return; }
    const generica = $('#seccion-generica');
    generica.classList.remove('d-none');
    $('#genericoTitulo').textContent = item.texto;
    $('#genericoDescripcion').textContent = 'Este módulo se conecta a su almacenamiento real en la fase indicada.';
    $('#genericoFase').textContent = 'Disponible en la Fase ' + (item.fase || '?') + ' del plan de implementación.';
  }

  async function cargarSeccion(id) {
    try {
      if (id === 'dashboard') return cargarDashboard();
      if (id === 'reservaciones') return cargarReservas();
      if (id === 'despacho') return cargarDespacho();
      if (id === 'pagos') return cargarPagos();
      if (id === 'gastos') return cargarGastos();
      if (id === 'comisiones') return cargarComisiones();
      if (id === 'auditoria') return cargarAuditoria();
      if (id === 'tarifas') return cargarTarifas();
      if (id === 'viajes') return tablaSimple('tablaViajes', [
        { titulo: 'Código', clave: 'codigoReserva' },
        { titulo: 'Estado', fn: (v) => badgeEstado(v.estadoViaje) },
        { titulo: 'Fecha', fn: (v) => escapeHtml(v.fechaViaje) + ' ' + escapeHtml(v.horaViaje) },
        { titulo: 'Ruta', fn: (v) => escapeHtml(v.origen) + ' → ' + escapeHtml(v.destino) },
        { titulo: 'Conductor', clave: 'conductor' },
        { titulo: 'Vehículo', clave: 'vehiculo' },
        { titulo: 'Bruto', fn: (v) => v.ingresoBruto != null ? mrd(v.ingresoBruto) : '—' }
      ], 'listarViajesAdmin', 'Sin viajes todavía (llegan con el despacho, Fase 5)');
      if (id === 'conductores') return tablaSimple('tablaConductores', [
        { titulo: 'Código', clave: 'codigo' }, { titulo: 'Nombre', clave: 'nombre' },
        { titulo: 'Modalidad', clave: 'modalidad' },
        { titulo: 'Comisión', fn: (c) => escapeHtml(c.tipoComision) + (c.valorComision ? ' ' + escapeHtml(String(c.valorComision)) : '') },
        { titulo: 'WhatsApp', clave: 'whatsapp' },
        { titulo: 'Estado', fn: (c) => '<select class="form-select form-select-sm mrd-estado-entidad" data-entidad="conductores" data-id="' + escapeHtml(c.id) + '" style="min-width:120px">' +
            ['ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'NO_DISPONIBLE'].map((s) => '<option' + (String(c.estado).toUpperCase() === s ? ' selected' : '') + '>' + s + '</option>').join('') + '</select>' },
        { titulo: '', fn: (c) => '<button class="btn btn-xs btn-outline-dark bi bi-pencil mrd-editar-entidad" data-entidad="conductores" data-id="' + escapeHtml(c.id) + '" title="Editar"></button>' }
      ], 'listarConductores', 'Sin conductores. Crea el primero con "Nuevo conductor".');
      if (id === 'vehiculos') return tablaSimple('tablaVehiculos', [
        { titulo: 'Código', clave: 'codigo' },
        { titulo: 'Vehículo', fn: (v) => escapeHtml(v.marca + ' ' + v.modelo + ' (' + v.anio + ')') },
        { titulo: 'Matrícula', clave: 'matricula' }, { titulo: 'Categoría', clave: 'categoria' },
        { titulo: 'Cap.', clave: 'capPasajeros' }, { titulo: 'Seguro venc.', clave: 'seguroVencimiento' },
        { titulo: 'Estado', fn: (v) => '<select class="form-select form-select-sm mrd-estado-entidad" data-entidad="vehiculos" data-id="' + escapeHtml(v.id) + '" style="min-width:130px">' +
            ['DISPONIBLE', 'OCUPADO', 'MANTENIMIENTO', 'INACTIVO'].map((s) => '<option' + (String(v.estado).toUpperCase() === s ? ' selected' : '') + '>' + s + '</option>').join('') + '</select>' },
        { titulo: '', fn: (v) => '<button class="btn btn-xs btn-outline-dark bi bi-pencil mrd-editar-entidad" data-entidad="vehiculos" data-id="' + escapeHtml(v.id) + '" title="Editar"></button>' }
      ], 'listarVehiculos', 'Sin vehículos. Crea el primero con "Nuevo vehículo".');
      if (id === 'clientes') return tablaSimple('tablaClientes', [
        { titulo: 'Nombre', clave: 'nombre' }, { titulo: 'Teléfono', clave: 'telefono' },
        { titulo: 'WhatsApp', clave: 'whatsapp' }, { titulo: 'Email', clave: 'email' }, { titulo: 'Estado', clave: 'estado' },
        { titulo: '', fn: (c) => '<button class="btn btn-xs btn-outline-dark bi bi-pencil mrd-editar-entidad" data-entidad="clientes" data-id="' + escapeHtml(c.id) + '" title="Editar"></button>' }
      ], 'listarClientes', 'Sin clientes todavía');
      if (id === 'destinos') return tablaSimple('tablaDestinos', [
        { titulo: 'Destino', clave: 'nombre' }, { titulo: 'Provincia', clave: 'provincia' },
        { titulo: 'Km est.', clave: 'kilometrosEst' },
        { titulo: 'Aeropuerto', fn: (d) => d.esAeropuerto === 'TRUE' ? 'Sí' : '—' }, { titulo: 'Popular', fn: (d) => d.popular === 'TRUE' ? 'Sí' : '—' },
        { titulo: 'Activo', fn: (d) => '<select class="form-select form-select-sm mrd-estado-entidad" data-entidad="destinos" data-id="' + escapeHtml(d.id) + '" style="min-width:80px">' +
            ['TRUE', 'FALSE'].map((s) => '<option' + (String(d.activo).toUpperCase() === s ? ' selected' : '') + '>' + s + '</option>').join('') + '</select>' },
        { titulo: '', fn: (d) => '<button class="btn btn-xs btn-outline-dark bi bi-pencil mrd-editar-entidad" data-entidad="destinos" data-id="' + escapeHtml(d.id) + '" title="Editar"></button>' }
      ], 'listarDestinosAdmin', 'Sin destinos');
      if (id === 'notificaciones') return cargarNotificaciones();
      if (id === 'configuracion') return cargarConfiguracion();
      if (id === 'usuarios') return renderInfoSesion();
    } catch (e) {
      console.error(id, e);
    }
  }

  async function tablaSimple(tablaId, columnas, accion, vacio) {
    const r = await api(accion);
    renderTabla(tablaId, columnas, r.ok ? r.data : [], r.ok ? vacio : ('Error: ' + r.error));
  }

  // ───────────── Dashboard ─────────────
  async function cargarDashboard() {
    const r = await api('kpisDashboard');
    const cont = $('#kpis');
    if (!r.ok) { cont.innerHTML = '<div class="col-12"><div class="alert alert-danger">' + escapeHtml(r.error) + '</div></div>'; return; }
    const k = r.data;
    const tarjetas = [
      ['Reservas hoy', k.reservasHoy], ['Pendientes', k.pendientes], ['Confirmadas', k.confirmadas],
      ['En curso', k.enCurso], ['Completadas', k.completadas], ['Canceladas/Rechazadas', k.canceladas],
      ['Conductores activos', k.conductoresDisponibles], ['Vehículos disponibles', k.vehiculosDisponibles],
      ['Ingresos registrados', mrd(k.ingresosRegistrados)], ['Gastos', mrd(k.gastosRegistrados)],
      ['Comisiones calc.', mrd(k.comisionesCalculadas)], ['Beneficio estimado', mrd(k.beneficioEstimado)]
    ];
    cont.innerHTML = tarjetas.map(([l, v]) => '<div class="col-6 col-md-4 col-xl-3"><div class="mrd-kpi"><div class="kpi-label">' + escapeHtml(l) + '</div><div class="kpi-valor" style="font-size:1.25rem;">' + escapeHtml(v) + '</div></div></div>').join('');
    $('#estadoSistema').innerHTML = '<dt class="col-sm-4">Moneda</dt><dd class="col-sm-8">' + escapeHtml(k.moneda) + '</dd>';
    const tarifas = await api('listarTarifas');
    if (tarifas.ok && tarifas.data.some((t) => t.esEjemplo && t.activa)) $('#avisoTarifasEjemplo').classList.remove('d-none'); else $('#avisoTarifasEjemplo').classList.add('d-none');
  }

  async function verificarServidor() {
    const estado = $('#estadoServidor');
    estado.textContent = 'Verificando servidor…';
    const r = await window.MRD_API.ping();
    if (r.ok) {
      estado.innerHTML = '<span style="color:var(--mrd-exito)">● Servidor operativo</span> · ' + escapeHtml(r.data.hora || '');
      $('#estadoSistema') && ($('#estadoSistema').innerHTML += '<dt class="col-sm-4">Hora servidor</dt><dd class="col-sm-8">' + escapeHtml(r.data.hora || '') + '</dd>');
    } else {
      estado.innerHTML = '<span style="color:var(--mrd-error)">● Sin conexión con el servidor</span>';
    }
  }

  // ───────────── Reservaciones ─────────────
  const leerFiltros = () => ({
    q: $('#fQ').value.trim(),
    estado: $('#fEstado').value,
    tipoServicio: $('#fTipo').value,
    fechaDesde: $('#fDesde').value.trim(),
    fechaHasta: $('#fHasta').value.trim(),
    pagina: paginaReservas
  });

  async function cargarReservas() {
    const f = leerFiltros();
    const r = await api('listarReservas', f);
    const tbody = $('#tablaReservas tbody');
    if (!r.ok) { tbody.innerHTML = '<tr><td colspan="7" class="text-danger">' + escapeHtml(r.error) + '</td></tr>'; return; }
    const d = r.data;
    $('#totalReservas').textContent = d.total + ' reserva(s) · página ' + d.pagina + ' de ' + d.paginas;
    $('#paginaInfo').textContent = 'Página ' + d.pagina + ' / ' + d.paginas;
    renderTabla('tablaReservas', [
      { titulo: 'Código', fn: (x) => '<button class="btn btn-xs btn-outline-dark mrd-abrir-reserva" data-codigo="' + escapeHtml(x.codigo) + '">' + escapeHtml(x.codigo) + '</button>' },
      { titulo: 'Estado', fn: (x) => badgeEstado(x.estado) },
      { titulo: 'Fecha', fn: (x) => escapeHtml(x.fechaViaje) + ' ' + escapeHtml(x.horaViaje) },
      { titulo: 'Cliente', fn: (x) => escapeHtml(x.nombreCliente) },
      { titulo: 'Ruta', fn: (x) => '<span class="small">' + escapeHtml(x.origen) + ' → ' + escapeHtml(x.destino) + '</span>' },
      { titulo: 'Pax', clave: 'pasajeros' },
      { titulo: 'Total', fn: (x) => x.tarifaTotal != null ? mrd(x.tarifaTotal) : '—' }
    ], d.items, 'Sin reservas con estos filtros');
  }

  // ───────────── Detalle de reserva (modal) ─────────────
  let codigoModal = null;
  const modalReserva = () => bootstrap.Modal.getOrCreateInstance($('#modalReserva'));

  async function abrirDetalle(codigo) {
    codigoModal = codigo;
    $('#mrCodigo').textContent = codigo;
    $('#mrMonto').value = ''; $('#mrNota').value = '';
    $('#mrEnlaceBox').classList.add('d-none'); $('#mrError').classList.add('d-none');
    const r = await api('obtenerReservaDetalle', { codigo });
    const det = $('#mrDetalle');
    if (!r.ok) { det.innerHTML = '<dt class="col-sm-3">Error</dt><dd class="col-sm-9 text-danger">' + escapeHtml(r.error) + '</dd>'; modalReserva().show(); return; }
    const d = r.data, x = d.reserva;
    const fila = (k, v) => v ? '<dt class="col-sm-3">' + escapeHtml(k) + '</dt><dd class="col-sm-9">' + v + '</dd>' : '';
    det.innerHTML =
      fila('Estado', badgeEstado(x.estado)) +
      fila('Tipo', escapeHtml(x.tipoServicio) + ' · ' + escapeHtml(x.categoriaVehiculo)) +
      fila('Ruta', escapeHtml(x.origen) + ' → ' + escapeHtml(x.destino)) +
      fila('Fecha y hora', escapeHtml(x.fechaViaje) + ' · ' + escapeHtml(x.horaViaje)) +
      fila('Pasajeros / maletas', escapeHtml(x.pasajeros) + ' pax · ' + escapeHtml(x.maletas) + ' maletas') +
      fila('Cliente', escapeHtml(d.cliente ? d.cliente.nombre : x.nombreCliente) + ' · ' + escapeHtml(x.telefono)) +
      fila('Email', escapeHtml(x.email || '—')) +
      fila('Vuelo', escapeHtml([x.numeroVuelo, x.aerolinea].filter(Boolean).join(' · ') || '—')) +
      fila('Observaciones', escapeHtml(d.observaciones || '—')) +
      fila('Tarifa', x.tarifaTotal != null ? (mrd(x.tarifaTotal) + ' · ' + escapeHtml(x.metodoTarifa)) : 'Cotización pendiente') +
      (d.viaje ? fila('Viaje', escapeHtml(d.viaje.estado) + ' · ' + escapeHtml(d.viaje.conductor) + ' · ' + escapeHtml(d.viaje.vehiculo)) : '') +
      (d.asignaciones.length ? fila('Asignación', d.asignaciones.map((a) => escapeHtml(a.conductor) + ' (' + escapeHtml(a.vehiculo) + ') por ' + escapeHtml(a.asignadoPor)).join('<br>')) : '') +
      fila('Notas admin', escapeHtml(d.notasAdmin || '—'));
    modalReserva().show();
  }

  async function accionReserva(nueva, boton) {
    if (!codigoModal) return;
    const err = $('#mrError'); err.classList.add('d-none');
    boton.disabled = true;
    const r = await api('cambiarEstadoReserva', { codigo: codigoModal, nuevoEstado: nueva, motivo: $('#mrNota').value.trim() });
    boton.disabled = false;
    if (!r.ok) { err.textContent = r.error || 'No se pudo cambiar el estado.'; err.classList.remove('d-none'); return; }
    if (r.data.enlaceWhatsApp) { $('#mrEnlace').href = r.data.enlaceWhatsApp; $('#mrEnlaceBox').classList.remove('d-none'); }
    $('#mrDetalle').querySelector('dd') && ($('#mrDetalle').innerHTML = $('#mrDetalle').innerHTML); // no-op refresco ligero
    await cargarReservas();
  }

  // ───────────── Tarifas ─────────────
  async function cargarTarifas() {
    const r = await api('listarTarifas');
    renderTabla('tablaTarifas', [
      { titulo: 'Ruta', fn: (t) => '<span class="small">' + escapeHtml(t.origen) + ' → ' + escapeHtml(t.destino) + '</span>' },
      { titulo: 'Categoría', fn: (t) => escapeHtml(t.categoria || 'Todas') },
      { titulo: 'Tipo', clave: 'tipo' },
      { titulo: 'Precio', fn: (t) => t.tipo === 'FIJA' ? (t.precio != null ? mrd(t.precio) : '—') : ((t.kilometrosEst || 0) + ' km × ' + (t.precioKm != null ? mrd(t.precioKm) : '?')) },
      { titulo: 'Vigencia', fn: (t) => escapeHtml(t.vigenciaDesde || '—') + ' → ' + escapeHtml(t.vigenciaHasta || '—') },
      { titulo: 'Estado', fn: (t) => (t.activa ? '<span class="mrd-badge mrd-badge-confirmada">ACTIVA</span>' : '<span class="mrd-badge mrd-badge-cancelada">INACTIVA</span>') + (t.esEjemplo ? ' <span class="badge text-bg-warning">EJEMPLO</span>' : '') },
      { titulo: 'Acciones', fn: (t) => '<button class="btn btn-xs btn-outline-dark mrd-editar-tarifa" data-id="' + escapeHtml(t.id) + '"><i class="bi bi-pencil"></i></button> <button class="btn btn-xs btn-outline-' + (t.activa ? 'danger' : 'success') + ' mrd-toggle-tarifa" data-id="' + escapeHtml(t.id) + '" data-activa="' + (t.activa ? 'TRUE' : 'FALSE') + '"><i class="bi bi-' + (t.activa ? 'pause' : 'play') + '"></i></button>' }
    ], r.ok ? r.data : [], r.ok ? 'Sin tarifas' : ('Error: ' + r.error));
  }

  function abrirModalTarifa(t) {
    $('#tfId').value = t ? t.id : '';
    $('#tfOrigen').value = t ? t.origen : '';
    $('#tfDestino').value = t ? t.destino : '';
    $('#tfCategoria').value = t ? (t.categoria || '') : '';
    $('#tfTipo').value = t ? t.tipo : 'FIJA';
    $('#tfPrecio').value = t && t.precio != null ? t.precio : '';
    $('#tfKm').value = t && t.kilometrosEst != null ? t.kilometrosEst : '';
    $('#tfBase').value = t && t.tarifaBase != null ? t.tarifaBase : '';
    $('#tfPrecioKm').value = t && t.precioKm != null ? t.precioKm : '';
    $('#tfVigDesde').value = t ? (t.vigenciaDesde || '') : '';
    $('#tfVigHasta').value = t ? (t.vigenciaHasta || '') : '';
    $('#tfError').classList.add('d-none');
    actualizarCajasTipoTarifa();
    bootstrap.Modal.getOrCreateInstance($('#modalTarifa')).show();
  }

  function actualizarCajasTipoTarifa() {
    const fija = $('#tfTipo').value === 'FIJA';
    $('#tfCajaPrecio').classList.toggle('d-none', !fija);
    $('#tfCajaKm').classList.toggle('d-none', fija);
    $('#tfCajaBase').classList.toggle('d-none', fija);
    $('#tfCajaPrecioKm').classList.toggle('d-none', fija);
  }

  async function guardarTarifa() {
    const err = $('#tfError'); err.classList.add('d-none');
    const payload = {
      id: $('#tfId').value || undefined,
      origen: $('#tfOrigen').value.trim(), destino: $('#tfDestino').value.trim(),
      categoriaVehiculo: $('#tfCategoria').value, tipo: $('#tfTipo').value,
      precio: $('#tfPrecio').value, kilometrosEst: $('#tfKm').value,
      tarifaBase: $('#tfBase').value, precioKm: $('#tfPrecioKm').value,
      vigenciaDesde: $('#tfVigDesde').value.trim(), vigenciaHasta: $('#tfVigHasta').value.trim()
    };
    const btn = $('#tfGuardar'); btn.disabled = true;
    const r = await api('guardarTarifa', payload);
    btn.disabled = false;
    if (!r.ok) { err.textContent = r.error || 'No se pudo guardar.'; err.classList.remove('d-none'); return; }
    bootstrap.Modal.getInstance($('#modalTarifa')).hide();
    cargarTarifas();
  }

  async function toggleTarifa(id, activaActual) {
    const r = await api('cambiarEstadoTarifa', { id, activa: activaActual === 'TRUE' ? 'FALSE' : 'TRUE' });
    if (!r.ok) alert(r.error || 'No se pudo cambiar el estado.');
    cargarTarifas();
  }

  // ───────────── Exportar CSV ─────────────
  async function exportarCSV() {
    const r = await api('exportarReservasCSV', leerFiltros());
    if (!r.ok) { alert(r.error || 'No se pudo exportar.'); return; }
    const blob = new Blob([r.data.contenido], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = r.data.nombreArchivo || 'movilidadrd-reservas.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ───────────── Notificaciones ─────────────
  async function cargarNotificaciones() {
    const cont = $('#listaNotificaciones');
    const r = await api('listarNotificacionesAdmin');
    if (!r.ok) { cont.innerHTML = '<div class="alert alert-danger">' + escapeHtml(r.error) + '</div>'; return; }
    if (!r.data.length) { cont.innerHTML = '<div class="mrd-vacio"><i class="bi bi-bell-slash d-block mb-2"></i><p class="mb-0">Sin notificaciones todavía.</p></div>'; return; }
    cont.innerHTML = r.data.map((n) =>
      '<div class="d-flex justify-content-between align-items-start gap-2 py-2 border-bottom">' +
        '<div class="small">' + badgeEstado(n.estado === 'PENDIENTE' ? 'PENDIENTE' : 'COMPLETADA') + ' <strong>' + escapeHtml(n.tipo) + '</strong><br><span class="text-muted">' + escapeHtml(n.mensaje) + '</span><div class="text-muted" style="font-size:.7rem;">' + escapeHtml(n.fecha) + '</div></div>' +
        '<button class="btn btn-xs btn-outline-secondary mrd-leida" data-id="' + escapeHtml(n.id) + '" title="Marcar leída"><i class="bi bi-check2"></i></button>' +
      '</div>'
    ).join('');
  }

  // ───────────── Configuración / Usuarios ─────────────
  async function cargarConfiguracion() {
    const r = await api('obtenerConfiguracionAdmin');
    const tabla = $('#tablaConfiguracion');
    if (!r.ok) { tabla.querySelector('tbody').innerHTML = '<tr><td class="text-danger">' + escapeHtml(r.error) + '</td></tr>'; return; }
    renderTabla('tablaConfiguracion', [{ titulo: 'Clave', clave: 'k' }, { titulo: 'Valor', clave: 'v' }],
      Object.keys(r.data).sort().map((k) => ({ k, v: r.data[k] })), 'Sin claves');
  }

  function renderInfoSesion() {
    if (!contextoAdmin) return;
    $('#infoSesion').innerHTML =
      '<dt class="col-sm-4">Nombre</dt><dd class="col-sm-8">' + escapeHtml(contextoAdmin.nombre) + '</dd>' +
      '<dt class="col-sm-4">Email</dt><dd class="col-sm-8">' + escapeHtml(contextoAdmin.email) + '</dd>' +
      '<dt class="col-sm-4">Rol</dt><dd class="col-sm-8">' + escapeHtml(contextoAdmin.rol) + '</dd>';
  }

  // ───────────── Despacho de viajes (Fase 5) ─────────────
  let despachoItems = [];
  let despachoSeleccion = null;
  let despachoDisponibles = [];

  async function cargarDespacho(mantenerSeleccion) {
    const lista = $('#despachoLista');
    lista.innerHTML = '<div class="text-center py-4"><div class="mrd-spinner mx-auto"></div></div>';
    const r = await api('listarPendientesDespacho');
    if (!r.ok) { lista.innerHTML = '<div class="alert alert-danger">' + escapeHtml(r.error) + '</div>'; return; }
    despachoItems = r.data || [];
    if (!despachoItems.length) {
      lista.innerHTML = '<div class="mrd-vacio"><i class="bi bi-check2-circle d-block mb-2"></i><p class="mb-0">Nada pendiente por despachar. Confirma una reserva primero.</p></div>';
      return;
    }
    lista.innerHTML = despachoItems.map((x) =>
      '<button type="button" class="mrd-despacho-card text-start" data-codigo="' + escapeHtml(x.codigo) + '">' +
        '<div class="d-flex justify-content-between align-items-center gap-2">' +
          '<strong>' + escapeHtml(x.codigo) + '</strong>' + badgeEstado(x.estado) +
        '</div>' +
        '<div class="small mt-1"><i class="bi bi-calendar3 text-dorado me-1"></i>' + escapeHtml(x.fechaViaje) + ' · ' + escapeHtml(x.horaViaje) + ' · ' + escapeHtml(x.categoriaVehiculo) + '</div>' +
        '<div class="small"><i class="bi bi-geo-alt text-dorado me-1"></i>' + escapeHtml(x.origen) + ' → ' + escapeHtml(x.destino) + '</div>' +
        '<div class="small text-muted">' + escapeHtml(x.nombreCliente) + ' · ' + escapeHtml(x.pasajeros) + ' pax · ' + (x.tarifaTotal != null ? mrd(x.tarifaTotal) : 'sin tarifa') + (x.conductorActual ? ' · <span class="text-dorado">' + escapeHtml(x.conductorActual) + '</span>' : '') + '</div>' +
      '</button>'
    ).join('');
    $$('.mrd-despacho-card', lista).forEach((b) => b.classList.toggle('seleccionada', b.dataset.codigo === despachoSeleccion));
  }

  function ticketDespachoHtml(x) {
    const maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(x.origen + ' ' + x.destino);
    return '<div class="mrd-asignacion" style="max-width:none;">' +
      '<div class="mrd-as-body">' +
        '<div class="mrd-as-brand"><span class="mrd-as-marca">Movilidad<span style="color:#fff">RD</span></span><span class="mrd-as-tipo">' + escapeHtml(x.tipoServicio) + '</span></div>' +
        '<div class="mrd-as-estado-row"><span class="mrd-as-estado" style="font-size:1.25rem;' + (x.asignado ? 'color:#fff;' : 'color:#E4C878;') + '">' + (x.asignado ? 'RE-ASIGNAR' : 'SIN ASIGNAR') + '</span><span class="mrd-as-codigo">#' + escapeHtml(x.codigo) + '</span></div>' +
        '<hr class="mrd-as-divider">' +
        '<div class="mrd-as-grid" style="grid-template-columns:auto 1fr;">' +
          '<div class="mrd-as-fecha"><div class="mrd-as-dia">' + escapeHtml((x.fechaViaje || '').slice(0, 10)) + '</div><div class="mrd-as-hora" style="font-size:2rem;">' + escapeHtml(x.horaViaje || '--:--') + '</div></div>' +
          '<div class="mrd-ruta" style="min-height:72px;">' +
            '<div class="mrd-ruta-punto"><div class="mrd-ruta-origen" style="font-size:.78rem;">' + escapeHtml(x.origen) + '</div></div>' +
            '<div class="mrd-ruta-punto"><div class="mrd-ruta-dest" style="font-size:.78rem;">' + escapeHtml(x.destino) + '</div></div>' +
          '</div>' +
        '</div>' +
        '<div class="mrd-as-meta">' +
          '<span><i class="bi bi-person"></i>' + escapeHtml(x.nombreCliente) + '</span>' +
          '<span><i class="bi bi-people"></i>' + escapeHtml(x.pasajeros) + ' pax</span>' +
          '<span><i class="bi bi-luggage"></i>' + escapeHtml(x.maletas) + ' maletas</span>' +
          (x.numeroVuelo ? '<span><i class="bi bi-airplane"></i>' + escapeHtml(x.numeroVuelo + (x.aerolinea ? ' · ' + x.aerolinea : '')) + '</span>' : '') +
          (x.tarifaTotal != null ? '<span><i class="bi bi-cash-coin"></i>' + mrd(x.tarifaTotal) + '</span>' : '') +
        '</div>' +
        '<a class="mrd-as-btn mrd-as-btn-mapa" style="margin-top:.6rem;" href="' + maps + '" target="_blank" rel="noopener"><i class="bi bi-map"></i>Ver ruta en Maps</a>' +
      '</div>' +
    '</div>';
  }

  async function seleccionarReservaDespacho(codigo) {
    despachoSeleccion = codigo;
    $$('.mrd-despacho-card').forEach((b) => b.classList.toggle('seleccionada', b.dataset.codigo === codigo));
    const x = despachoItems.find((i) => i.codigo === codigo);
    if (!x) return;

    $('#despachoVacio').classList.add('d-none');
    $('#despachoDetalle').classList.remove('d-none');
    $('#despachoExito').classList.add('d-none');
    $('#despachoError').classList.add('d-none');
    $('#despachoInstrucciones').value = '';
    $('#despachoTicket').innerHTML = ticketDespachoHtml(x);

    const selC = $('#despachoConductor');
    const selV = $('#despachoVehiculo');
    selC.innerHTML = '<option>Cargando…</option>'; selV.innerHTML = '<option>—</option>';
    $('#despachoInfoDisponibilidad').textContent = '';

    const r = await api('conductoresDisponibles', { codigo });
    if (!r.ok) {
      selC.innerHTML = '<option>—</option>';
      const e = $('#despachoError'); e.textContent = r.error || 'No se pudo consultar disponibilidad.'; e.classList.remove('d-none');
      return;
    }
    despachoDisponibles = r.data.items || [];
    if (!despachoDisponibles.length) {
      selC.innerHTML = '<option>—</option>';
      $('#despachoInfoDisponibilidad').innerHTML = '<span class="text-danger"><i class="bi bi-exclamation-triangle"></i> Ningún conductor/vehículo cumple: categoría ' + escapeHtml(r.data.categoria) + ', ' + escapeHtml(r.data.pasajeros) + ' pax, disponibilidad horaria y separación. Revisa estado de conductores/vehículos o pasa a cotización manual.</span>';
      return;
    }
    const porConductor = {};
    despachoDisponibles.forEach((i) => {
      if (!porConductor[i.conductorId]) porConductor[i.conductorId] = { nombre: i.conductorNombre, codigo: i.conductorCodigo, principal: i.principal, vehiculos: [] };
      porConductor[i.conductorId].vehiculos.push(i);
    });
    const opcionesC = Object.keys(porConductor).map((id) => {
      const c = porConductor[id];
      return '<option value="' + escapeHtml(id) + '">' + escapeHtml(c.codigo + ' — ' + c.nombre) + '</option>';
    });
    selC.innerHTML = opcionesC.join('');
    $('#despachoInfoDisponibilidad').textContent = despachoDisponibles.length + ' combinación(es) disponible(s) para ' + r.data.fecha + ' ' + r.data.hora + '.';
    actualizarVehiculosDespacho();
  }

  function actualizarVehiculosDespacho() {
    const conductorId = $('#despachoConductor').value;
    const opciones = despachoDisponibles
      .filter((i) => i.conductorId === conductorId)
      .map((i) => '<option value="' + escapeHtml(i.vehiculoId) + '">' + escapeHtml(i.vehiculoCodigo + ' · ' + i.marcaModelo + ' · ' + i.matricula + ' · cap. ' + i.capPasajeros + (i.principal ? ' · ★ principal' : '')) + '</option>');
    $('#despachoVehiculo').innerHTML = opciones.join('') || '<option>—</option>';
  }

  async function asignarViaje() {
    if (!despachoSeleccion) return;
    const err = $('#despachoError'); err.classList.add('d-none');
    const ok = $('#despachoExito'); ok.classList.add('d-none');
    const conductorId = $('#despachoConductor').value;
    const vehiculoId = $('#despachoVehiculo').value;
    if (!conductorId || !vehiculoId || conductorId.indexOf('Cargando') === 0) { err.textContent = 'Selecciona conductor y vehículo.'; err.classList.remove('d-none'); return; }
    const btn = $('#btnAsignarViaje'); btn.disabled = true;
    const r = await api('asignarViaje', {
      codigoReserva: despachoSeleccion,
      conductorId, vehiculoId,
      instrucciones: $('#despachoInstrucciones').value.trim()
    });
    btn.disabled = false;
    if (!r.ok) { err.textContent = r.error || 'No se pudo asignar.'; err.classList.remove('d-none'); return; }
    const d = r.data;
    $('#despachoExitoDetalle').innerHTML = '<strong>' + escapeHtml(d.codigoReserva) + '</strong> → ' + escapeHtml(d.conductorNombre) + ' · ' + escapeHtml(d.vehiculoMatricula);
    $('#despachoEnlaceConductor').href = d.enlaceWhatsApp;
    ok.classList.remove('d-none');
    await cargarDespacho();
  }

  // ───────────── Pagos / Gastos / Comisiones ─────────────
  async function cargarPagos() {
    const r = await api('listarPagos');
    renderTabla('tablaPagos', [
      { titulo: 'Fecha', clave: 'fechaPago' },
      { titulo: 'Reserva', clave: 'codigoReserva' },
      { titulo: 'Cliente', clave: 'cliente' },
      { titulo: 'Tipo', clave: 'tipo' },
      { titulo: 'Monto', fn: (p) => mrd(p.monto) }
    ], r.ok ? r.data : [], r.ok ? 'Sin pagos registrados' : ('Error: ' + r.error));
  }

  async function cargarGastos() {
    const r = await api('listarGastos');
    renderTabla('tablaGastos', [
      { titulo: 'Fecha', clave: 'fechaGasto' },
      { titulo: 'Reserva', clave: 'codigoReserva' },
      { titulo: 'Tipo', clave: 'tipo' },
      { titulo: 'Monto', fn: (g) => mrd(g.monto) },
      { titulo: 'Registró', clave: 'registradoPor' }
    ], r.ok ? r.data : [], r.ok ? 'Sin gastos registrados' : ('Error: ' + r.error));
  }

  async function cargarComisiones() {
    const r = await api('listarComisiones', {});
    renderTabla('tablaComisiones', [
      { titulo: 'Reserva', clave: 'codigoReserva' },
      { titulo: 'Conductor', clave: 'conductor' },
      { titulo: 'Tipo', clave: 'tipo' },
      { titulo: 'Base', fn: (c) => mrd(c.base) },
      { titulo: 'Comisión', fn: (c) => mrd(c.monto) },
      { titulo: 'Pago', fn: (c) => (c.estadoPago === 'PAGADA' ? '<span class="mrd-badge mrd-badge-confirmada">PAGADA</span>' : '<span class="mrd-badge mrd-badge-pendiente">PENDIENTE</span>') },
      { titulo: '', fn: (c) => c.estadoPago === 'PAGADA' ? '' : '<button class="btn btn-xs btn-outline-success mrd-pagar-comision" data-id="' + escapeHtml(c.id) + '"><i class="bi bi-check2"></i> Pagar</button>' }
    ], r.ok ? r.data : [], r.ok ? 'Sin comisiones calculadas' : ('Error: ' + r.error));
  }

  // ───────────── Reportes (Fase 8) ─────────────
  async function generarReporte() {
    const tipo = $('#rpTipo').value;
    const payload = { tipo, desde: $('#rpDesde').value.trim(), hasta: $('#rpHasta').value.trim() };
    const r = await api('generarReporte', payload);
    const cont = $('#rpResumen');
    const btnDesc = $('#btnDescargarReporte');
    if (!r.ok) {
      cont.innerHTML = '<div class="col-12"><div class="alert alert-danger small">' + escapeHtml(r.error) + '</div></div>';
      renderTabla('tablaReporte', [{ titulo: 'Detalle', clave: 'x' }], [], 'Sin datos');
      btnDesc.disabled = true;
      return;
    }
    const d = r.data;
    cont.innerHTML = Object.keys(d.resumen || {}).map((k) => {
      const v = d.resumen[k];
      const valor = typeof v === 'number' ? (k.toLowerCase().indexOf('moneda') === -1 && /ingreso|total|gastos|ticket|promedio/i.test(k) ? mrd(v) : String(v)) : String(v);
      return '<div class="col-6 col-md-3"><div class="mrd-kpi" style="border-left-color:var(--mrd-dorado)"><div class="kpi-label">' + escapeHtml(k) + '</div><div class="kpi-valor" style="font-size:1.1rem;">' + escapeHtml(valor) + '</div></div></div>';
    }).join('');
    renderTabla('tablaReporte', d.columnas.map((c) => ({ titulo: c.titulo, fn: (fila) => c.dinero ? mrd(fila[c.clave]) : escapeHtml(fila[c.clave]) })), d.filas, 'Sin datos en el rango');
    btnDesc.disabled = false;
    btnDesc.dataset.tipo = tipo;
  }

  async function descargarReporteCSV() {
    const payload = { tipo: $('#rpTipo').value, desde: $('#rpDesde').value.trim(), hasta: $('#rpHasta').value.trim() };
    const r = await api('exportarReporteCSV', payload);
    if (!r.ok) { window.alert(r.error || 'No se pudo exportar.'); return; }
    const blob = new Blob([r.data.contenido], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = r.data.nombreArchivo || 'reporte.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ───────────── Auditoría (Fase 9) ─────────────
  async function cargarAuditoria() {
    const accion = ($('#auAccion') && $('#auAccion').value.trim()) || '';
    const r = await api('listarAuditoria', { limite: 100, accion });
    renderTabla('tablaAuditoria', [
      { titulo: 'Fecha', clave: 'fecha' },
      { titulo: 'Usuario', clave: 'nombre' },
      { titulo: 'Rol', clave: 'rol' },
      { titulo: 'Acción', clave: 'accion' },
      { titulo: 'Entidad', fn: (a) => escapeHtml(a.entidad) + (a.entidadId ? ' · <span class="text-muted">' + escapeHtml(String(a.entidadId).slice(0, 8)) + '…</span>' : '') },
      { titulo: 'Detalle', fn: (a) => '<span class="small text-muted">' + escapeHtml(String(a.detalle || '').slice(0, 120)) + '</span>' }
    ], r.ok ? r.data.items : [], r.ok ? 'Sin eventos' : ('Error: ' + r.error));
  }

  // ───────────── CRUD genérico (Fase 11) ─────────────
  const FORMULARIOS = {
    conductores: {
      titulo: 'Conductor', crear: 'crearConductor', actualizar: 'actualizarConductor', lista: 'listarConductores', tabla: 'tablaConductores',
      campos: [
        { id: 'nombre', etiqueta: 'Nombre completo *', tipo: 'text', req: true },
        { id: 'codigo', etiqueta: 'Código (vacío = auto)', tipo: 'text' },
        { id: 'identificacion', etiqueta: 'Cédula', tipo: 'text' },
        { id: 'telefono', etiqueta: 'Teléfono / WhatsApp *', tipo: 'text', req: true },
        { id: 'email', etiqueta: 'Email', tipo: 'email' },
        { id: 'modalidad', etiqueta: 'Modalidad', tipo: 'select', opciones: ['PROPIO', 'CONTRATADO'] },
        { id: 'tipoComision', etiqueta: 'Tipo de comisión', tipo: 'select', opciones: ['PORCENTAJE', 'FIJA', 'POR_VIAJE'] },
        { id: 'valorComision', etiqueta: 'Valor comisión (% / RD$)', tipo: 'number' },
        { id: 'direccion', etiqueta: 'Dirección', tipo: 'text' },
        { id: 'comisionPorViaje', etiqueta: 'Comisión por viaje (RD$, si aplica)', tipo: 'number' }
      ],
      idClave: 'id',
      cargarListado: (lista) => lista.map((c) => ({ id: c.id, codigo: c.codigo, nombre: c.nombre, telefono: c.whatsapp, modalidad: c.modalidad, tipoComision: c.tipoComision, valorComision: c.valorComision, email: c.email }))
    },
    vehiculos: {
      titulo: 'Vehículo', crear: 'crearVehiculo', actualizar: 'actualizarVehiculo', lista: 'listarVehiculos', tabla: 'tablaVehiculos',
      campos: [
        { id: 'marca', etiqueta: 'Marca *', tipo: 'text', req: true },
        { id: 'modelo', etiqueta: 'Modelo *', tipo: 'text', req: true },
        { id: 'anio', etiqueta: 'Año *', tipo: 'number', req: true },
        { id: 'matricula', etiqueta: 'Matrícula *', tipo: 'text', req: true },
        { id: 'color', etiqueta: 'Color', tipo: 'text' },
        { id: 'categoria', etiqueta: 'Categoría *', tipo: 'select', opciones: ['SEDAN', 'SUV', 'VAN', 'LUXURY', 'MINIBUS'], req: true },
        { id: 'capPasajeros', etiqueta: 'Pasajeros (máx. categoría) *', tipo: 'number', req: true },
        { id: 'capEquipaje', etiqueta: 'Maletas', tipo: 'number' },
        { id: 'tipoPropiedad', etiqueta: 'Propiedad', tipo: 'select', opciones: ['PROPIO', 'TERCERO'] },
        { id: 'seguroVencimiento', etiqueta: 'Vencimiento seguro (DD/MM/AAAA)', tipo: 'text' }
      ],
      idClave: 'id'
    },
    destinos: {
      titulo: 'Destino', crear: 'crearDestino', actualizar: 'actualizarDestino', lista: 'listarDestinosAdmin', tabla: 'tablaDestinos',
      campos: [
        { id: 'nombre', etiqueta: 'Nombre del destino *', tipo: 'text', req: true },
        { id: 'provincia', etiqueta: 'Provincia', tipo: 'text' },
        { id: 'kilometrosEst', etiqueta: 'Kilómetros estimados *', tipo: 'number', req: true },
        { id: 'esAeropuerto', etiqueta: 'Es aeropuerto', tipo: 'select', opciones: ['FALSE', 'TRUE'] },
        { id: 'popular', etiqueta: 'Popular', tipo: 'select', opciones: ['FALSE', 'TRUE'] }
      ],
      idClave: 'id'
    },
    clientes: {
      titulo: 'Cliente', actualizar: 'actualizarCliente', lista: 'listarClientes', tabla: 'tablaClientes',
      campos: [
        { id: 'nombre', etiqueta: 'Nombre completo *', tipo: 'text', req: true },
        { id: 'telefono', etiqueta: 'Teléfono (809/829/849) *', tipo: 'text', req: true },
        { id: 'email', etiqueta: 'Email', tipo: 'email' }
      ],
      idClave: 'id'
    }
  };

  let entidadModal = null;
  let registroModal = null;

  function abrirModalGenerico(entidad, registro) {
    entidadModal = entidad;
    registroModal = registro || null;
    const def = FORMULARIOS[entidad];
    $('#mgTitulo').textContent = (registro ? 'Editar ' : 'Nuevo ') + def.titulo;
    $('#mgError').classList.add('d-none');
    const cont = $('#mgCampos');
    cont.innerHTML = def.campos.map((c) => {
      const valor = registro ? (registro[c.id] == null ? '' : registro[c.id]) : (c.valorPorDefecto || '');
      const etiqueta = '<label class="form-label" for="mgf_' + c.id + '">' + escapeHtml(c.etiqueta) + '</label>';
      if (c.tipo === 'select') {
        return etiqueta + '<select class="form-select" id="mgf_' + c.id + '">' + c.opciones.map((o) => '<option value="' + o + '"' + (String(valor).toUpperCase() === o ? ' selected' : '') + '>' + o + '</option>').join('') + '</select>';
      }
      return etiqueta + '<input class="form-control" id="mgf_' + c.id + '" type="' + c.tipo + '" value="' + escapeHtml(String(valor)) + '" ' + (c.req ? 'required' : '') + '>';
    }).join('');
    bootstrap.Modal.getOrCreateInstance($('#modalGenerico')).show();
  }

  function recolectarGenerico() {
    const def = FORMULARIOS[entidadModal];
    const out = {};
    def.campos.forEach((c) => { out[c.id] = ($('#mgf_' + c.id).value || '').trim(); });
    if (registroModal) out.id = registroModal.id;
    return out;
  }

  async function guardarGenerico() {
    const def = FORMULARIOS[entidadModal];
    const err = $('#mgError'); err.classList.add('d-none');
    for (const c of def.campos) {
      if (c.req && !($('#mgf_' + c.id).value || '').trim()) { err.textContent = 'Falta: ' + c.etiqueta; err.classList.remove('d-none'); return; }
    }
    const payload = recolectarGenerico();
    const accion = registroModal ? def.actualizar : def.crear;
    if (!accion) { err.textContent = 'Esta entidad no permite crear desde aquí.'; err.classList.remove('d-none'); return; }
    const r = await api(accion, payload);
    if (!r.ok) { err.textContent = r.error || 'No se pudo guardar.'; err.classList.remove('d-none'); return; }
    bootstrap.Modal.getInstance($('#modalGenerico')).hide();
    cargarSeccion(seccionActual);
  }

  // ───────────── Menú y arranque ─────────────
  const menuNav = $('#menuLateral');
  menuNav.innerHTML = MENU.map((m) => '<a class="mrd-side-link" href="#" data-seccion="' + m.id + '"><i class="bi ' + m.icono + '"></i>' + m.texto + '</a>').join('');
  menuNav.addEventListener('click', (ev) => {
    const a = ev.target.closest('.mrd-side-link');
    if (!a) return;
    ev.preventDefault();
    mostrarSeccion(a.dataset.seccion);
  });
  $('#btnAbrirMenu').addEventListener('click', () => $('#barraLateral').classList.toggle('abierto'));
  $('#btnRefrescar').addEventListener('click', () => { verificarServidor(); mostrarSeccion(seccionActual); });

  // Filtros y paginación
  $('#formFiltros').addEventListener('submit', (ev) => { ev.preventDefault(); paginaReservas = 1; cargarReservas(); });
  $('#btnPagPrev').addEventListener('click', () => { if (paginaReservas > 1) { paginaReservas--; cargarReservas(); } });
  $('#btnPagNext').addEventListener('click', () => { paginaReservas++; cargarReservas(); });
  $('#btnExportarCSV').addEventListener('click', exportarCSV);
  $('#formFiltrosAuditoria').addEventListener('submit', (ev) => { ev.preventDefault(); cargarAuditoria(); });
  $('#btnGenerarReporte').addEventListener('click', generarReporte);
  $('#btnDescargarReporte').addEventListener('click', descargarReporteCSV);
  $('#mgGuardar').addEventListener('click', guardarGenerico);

  // Delegación: abrir detalle de reserva / editar tarifa / toggle / leída / despacho
  document.addEventListener('click', (ev) => {
    const tarjeta = ev.target.closest('.mrd-despacho-card');
    if (tarjeta) { seleccionarReservaDespacho(tarjeta.dataset.codigo); return; }
    const abrir = ev.target.closest('.mrd-abrir-reserva');
    if (abrir) { abrirDetalle(abrir.dataset.codigo); return; }
    const editar = ev.target.closest('.mrd-editar-tarifa');
    if (editar) {
      api('listarTarifas').then((r) => {
        const t = r.ok && r.data.find((x) => x.id === editar.dataset.id);
        if (t) abrirModalTarifa(t);
      });
      return;
    }
    const toggle = ev.target.closest('.mrd-toggle-tarifa');
    if (toggle) { toggleTarifa(toggle.dataset.id, toggle.dataset.activa); return; }
    const leida = ev.target.closest('.mrd-leida');
    if (leida) { api('marcarNotificacionLeida', { id: leida.dataset.id }).then(() => cargarNotificaciones()); return; }
    const estadoSel = ev.target.closest('.mrd-estado-entidad');
    if (estadoSel) {
      const ent = estadoSel.dataset.entidad;
      const nuevo = estadoSel.value;
      const id = estadoSel.dataset.id;
      const acciones = { conductores: 'cambiarEstadoConductor', vehiculos: 'cambiarEstadoVehiculo', destinos: 'toggleDestino' };
      if (acciones[ent]) {
        const payload = ent === 'destinos' ? { id, activo: nuevo } : { id, estado: nuevo };
        api(acciones[ent], payload).then((r) => { if (!r.ok) window.alert(r.error || 'No se pudo cambiar el estado.'); });
      }
      return;
    }
    const nueva = ev.target.closest('.mrd-nueva-entidad');
    if (nueva) { abrirModalGenerico(nueva.dataset.entidad, null); return; }
    const editarEnt = ev.target.closest('.mrd-editar-entidad');
    if (editarEnt) {
      const def = FORMULARIOS[editarEnt.dataset.entidad];
      api(def.lista).then((r) => {
        const registro = r.ok && r.data.find((x) => String(x.id) === String(editarEnt.dataset.id));
        if (registro) abrirModalGenerico(editarEnt.dataset.entidad, registro);
      });
      return;
    }
    const pagar = ev.target.closest('.mrd-pagar-comision');
    if (pagar) { api('marcarComisionPagada', { id: pagar.dataset.id }).then((r) => { if (r.ok) cargarComisiones(); }); return; }  });

  // Despacho
  $('#despachoConductor').addEventListener('change', actualizarVehiculosDespacho);
  $('#btnAsignarViaje').addEventListener('click', asignarViaje);

  // Pagos
  $('#formRegistrarPago').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const err = $('#pgError'), ok = $('#pgExito');
    err.classList.add('d-none'); ok.classList.add('d-none');
    const btn = ev.target.querySelector('button[type=submit]'); btn.disabled = true;
    const r = await api('registrarPago', {
      codigoReserva: $('#pgCodigo').value.trim(), tipo: $('#pgTipo').value,
      monto: $('#pgMonto').value, referencia: $('#pgReferencia').value.trim(), notas: $('#pgNotas').value.trim()
    });
    btn.disabled = false;
    if (!r.ok) { err.textContent = r.error; err.classList.remove('d-none'); return; }
    ok.textContent = 'Pago registrado. Cobrado: ' + mrd(r.data.totalPagado) + ' · Saldo pendiente: ' + mrd(r.data.saldoPendiente);
    ok.classList.remove('d-none');
    ev.target.reset();
    cargarPagos();
  });

  // Gastos
  $('#formRegistrarGasto').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const err = $('#gsError'), ok = $('#gsExito');
    err.classList.add('d-none'); ok.classList.add('d-none');
    const btn = ev.target.querySelector('button[type=submit]'); btn.disabled = true;
    const r = await api('registrarGasto', {
      codigoReserva: $('#gsCodigo').value.trim(), tipo: $('#gsTipo').value,
      monto: $('#gsMonto').value, notas: $('#gsNotas').value.trim()
    });
    btn.disabled = false;
    if (!r.ok) { err.textContent = r.error; err.classList.remove('d-none'); return; }
    ok.textContent = 'Gasto registrado.';
    ok.classList.remove('d-none');
    ev.target.reset();
    cargarGastos();
  });

  // Comisiones
  $('#btnCalcularComision').addEventListener('click', async () => {
    const err = $('#cmError'), ok = $('#cmExito');
    err.classList.add('d-none'); ok.classList.add('d-none');
    const r = await api('calcularComisionViaje', { codigoReserva: $('#cmCodigo').value.trim() });
    if (!r.ok) { err.textContent = r.error; err.classList.remove('d-none'); return; }
    ok.textContent = 'Comisión (' + r.data.tipo + '): ' + mrd(r.data.montoCalculado) + ' para ' + r.data.conductorNombre;
    ok.classList.remove('d-none');
    cargarComisiones();
  });
  $('#btnResultadoViaje').addEventListener('click', async () => {
    const r = await api('resultadoViaje', { codigoReserva: $('#roCodigo').value.trim() });
    const cont = $('#roResultado');
    if (!r.ok) { cont.innerHTML = '<dt class="col-sm-12 text-danger">' + escapeHtml(r.error) + '</dt>'; return; }
    const d = r.data;
    cont.innerHTML =
      '<dt class="col-sm-6">Tarifa del viaje</dt><dd class="col-sm-6">' + mrd(d.tarifaTotal) + '</dd>' +
      '<dt class="col-sm-6">Cobrado</dt><dd class="col-sm-6">' + mrd(d.pagado) + '</dd>' +
      '<dt class="col-sm-6">Saldo pendiente</dt><dd class="col-sm-6">' + mrd(d.saldoPendiente) + '</dd>' +
      '<dt class="col-sm-6">Gastos</dt><dd class="col-sm-6">' + mrd(d.gastos) + '</dd>' +
      '<dt class="col-sm-6">Comisión conductor</dt><dd class="col-sm-6">' + mrd(d.comisionConductor) + '</dd>' +
      '<dt class="col-sm-6 fw-bold">Resultado operativo</dt><dd class="col-sm-6 fw-bold ' + (d.resultadoOperativo >= 0 ? '' : 'text-danger') + '">' + mrd(d.resultadoOperativo) + '</dd>';
  });

  // Modal reserva
  $('#mrBtnCotizar').addEventListener('click', async (ev) => {
    const btn = ev.currentTarget; btn.disabled = true; $('#mrError').classList.add('d-none');
    const r = await api('cotizarReservaManual', { codigo: codigoModal, monto: $('#mrMonto').value, notas: $('#mrNota').value.trim() });
    btn.disabled = false;
    if (!r.ok) { const e = $('#mrError'); e.textContent = r.error; e.classList.remove('d-none'); return; }
    if (r.data.enlaceWhatsApp) { $('#mrEnlace').href = r.data.enlaceWhatsApp; $('#mrEnlaceBox').classList.remove('d-none'); }
    await cargarReservas();
  });
  $('#mrBtnConfirmar').addEventListener('click', (ev) => accionReserva('CONFIRMADA', ev.currentTarget));
  $('#mrBtnRechazar').addEventListener('click', (ev) => accionReserva('RECHAZADA', ev.currentTarget));
  $('#mrBtnCancelar').addEventListener('click', (ev) => accionReserva('CANCELADA', ev.currentTarget));

  // Modal tarifa
  $('#btnNuevaTarifa').addEventListener('click', () => abrirModalTarifa(null));
  $('#tfTipo').addEventListener('change', actualizarCajasTipoTarifa);
  $('#tfGuardar').addEventListener('click', guardarTarifa);

  // ───────────── Login / sesión ─────────────
  const vistaLogin = $('#vistaLogin');
  const vistaPanel = $('#vistaPanel');

  function entrarPanel(ctx) {
    contextoAdmin = ctx;
    $('#usuarioActual').textContent = ctx.nombre + ' · ' + ctx.rol;
    vistaLogin.classList.add('d-none');
    vistaPanel.classList.remove('d-none');
    mostrarSeccion('dashboard');
    verificarServidor();
  }

  $('#formLogin').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const btn = $('#btnLogin');
    const err = $('#loginError');
    err.classList.add('d-none');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Verificando…';
    try {
      await window.MRD_AUTH.iniciarSesion($('#loginEmail').value.trim(), $('#loginPass').value);
      const ctx = await api('obtenerContexto', {});
      if (!ctx.ok) throw new Error(ctx.error || 'No autorizado en el panel.');
      if (ctx.data.rol !== 'SUPERADMIN' && ctx.data.rol !== 'ADMIN') throw new Error('Este acceso es solo para administradores. Usa el portal de conductores.');
      entrarPanel(ctx.data);
    } catch (e) {
      err.textContent = e.message || 'No se pudo iniciar sesión.';
      err.classList.remove('d-none');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-box-arrow-in-right me-1"></i>Entrar';
    }
  });

  $('#btnSalir').addEventListener('click', async () => { await window.MRD_AUTH.cerrarSesion(); window.location.reload(); });

  window.MRD_AUTH && window.MRD_AUTH.esperarSesion().then(async (user) => {
    if (!user) return;
    try {
      const ctx = await api('obtenerContexto', {});
      if (ctx.ok && (ctx.data.rol === 'SUPERADMIN' || ctx.data.rol === 'ADMIN')) entrarPanel(ctx.data);
    } catch (e) { /* mostrar login */ }
  }).catch(() => { /* Firebase sin configurar: mostrar login */ });
})();
