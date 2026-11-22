/**
 * firebase-init.js — Inicialización de Firebase Auth (SDK modular v10 vía CDN).
 * Expone window.MRD_AUTH con login/logout/esperarSesion.
 * Requiere config.js cargado ANTES que este archivo.
 *
 * Expiración de sesión: tras 60 minutos de INACTIVIDAD se cierra la sesión
 * automáticamente (al volver a abrir la página o al estar el tab abierto).
 * Cada interacción (clic/tecla/toque) reinicia el contador — mientras se use
 * el panel, la sesión no vence.
 */
(function (global) {
  'use strict';

  // ── Expiración por inactividad (espejo probado en shared/validaciones.js) ──
  var TIMEOUT_SESION_MS = 60 * 60 * 1000; // 60 minutos
  var CLAVE_ACTIVIDAD = 'mrdSesionActividad';
  var INTERVALO_CHEQUEO_MS = 60000;
  var ultimaEscritura = 0;

  function sesionExpiradaPura(ultimaActividad, ahora, timeoutMs) {
    var ult = Number(ultimaActividad);
    var now = Number(ahora);
    var timeout = Number(timeoutMs);
    if (!isFinite(ult) || ult <= 0) return true;              // sin actividad → expirada
    if (!isFinite(now) || !isFinite(timeout) || timeout <= 0) return true;
    if (now < ult) return false;                              // reloj atrasado → vigente
    return (now - ult) >= timeout;
  }

  function marcarActividad() {
    try { global.localStorage.setItem(CLAVE_ACTIVIDAD, String(Date.now())); } catch (e) { /* modo privado */ }
  }

  function ultimaActividad() {
    try { return Number(global.localStorage.getItem(CLAVE_ACTIVIDAD)) || 0; } catch (e) { return 0; }
  }

  function sesionExpirada(ahora) {
    return sesionExpiradaPura(ultimaActividad(), ahora, TIMEOUT_SESION_MS);
  }

  function actividadDeUsuario() {
    var ahora = Date.now();
    if (ahora - ultimaEscritura < 60000) return; // throttling: 1 escritura por minuto
    ultimaEscritura = ahora;
    marcarActividad();
  }

  async function inicializar() {
    const cfg = global.MRD_CONFIG;
    if (!cfg || !cfg.firebaseConfig || String(cfg.firebaseConfig.apiKey).includes('PEGAR_')) {
      throw new Error('Firebase no está configurado: complete js/config.js (vea INSTALACION.md §Firebase).');
    }
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
    const authMod = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js');
    const app = initializeApp(cfg.firebaseConfig);
    const auth = authMod.getAuth(app);
    return { auth, authMod };
  }

  let instancia = null;
  async function obtenerAuth() {
    if (!instancia) instancia = await inicializar();
    return instancia;
  }

  async function iniciarSesion(email, password) {
    const { auth, authMod } = await obtenerAuth();
    const cred = await authMod.signInWithEmailAndPassword(auth, email, password);
    marcarActividad(); // la sesión comienza con actividad fresca
    return cred.user;
  }

  async function cerrarSesion() {
    const { auth, authMod } = await obtenerAuth();
    await authMod.signOut(auth);
    try { global.localStorage.removeItem(CLAVE_ACTIVIDAD); } catch (e) { /* ignorar */ }
  }

  async function esperarSesion() {
    const { auth, authMod } = await obtenerAuth();
    return new Promise((resolve) => {
      const desuscribir = authMod.onAuthStateChanged(auth, (user) => {
        desuscribir();
        if (user && sesionExpirada(Date.now())) {
          // Firebase aún tiene la sesión, pero venció por inactividad → forzar login
          authMod.signOut(auth).catch(() => {}).then(() => resolve(null));
          return;
        }
        resolve(user);
      });
    });
  }

  async function obtenerIdToken() {
    const user = await esperarSesion();
    if (!user) return null;
    return user.getIdToken();
  }

  // ── Vigilancia de expiración ──
  // a) Interacciones del usuario reinician el contador (throttled).
  ['click', 'keydown', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, actividadDeUsuario, { passive: true, capture: true });
  });

  // b) Chequeo periódico: si la sesión venció y había un usuario → cerrar + recargar
  //    (así las pantallas de admin/conductor vuelven a mostrar el login).
  setInterval(function () {
    if (!sesionExpirada(Date.now())) return;
    obtenerAuth().then(function (ref) {
      if (!ref.auth.currentUser) return; // ya está en pantalla de login: nada que hacer
      return ref.authMod.signOut(ref.auth).catch(function () {}).then(function () {
        global.location.reload();
      });
    }).catch(function () { /* Firebase sin configurar */ });
  }, INTERVALO_CHEQUEO_MS);

  global.MRD_AUTH = { iniciarSesion, cerrarSesion, esperarSesion, obtenerIdToken };
})(window);
