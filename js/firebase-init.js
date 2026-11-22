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
  var CLAVE_EMAIL = 'mrdEmailRecordado'; // "Recordar mi correo" (solo el correo, NUNCA la contraseña)
  var INTERVALO_CHEQUEO_MS = 60000;
  var ultimaEscritura = 0;

  // ── "Recordar mi correo": el correo se guarda; la contraseña NUNCA ──
  function recordarEmail(email) {
    try { global.localStorage.setItem(CLAVE_EMAIL, String(email || '').trim()); } catch (e) { /* modo privado */ }
  }
  function olvidarEmail() {
    try { global.localStorage.removeItem(CLAVE_EMAIL); } catch (e) { /* ignorar */ }
  }
  function emailRecordado() {
    try { return global.localStorage.getItem(CLAVE_EMAIL) || ''; } catch (e) { return ''; }
  }

  /**
   * Traduce los errores de Firebase a un mensaje claro en español.
   * Si el error NO es de Firebase (p. ej. un mensaje del backend como
   * "Usuario no autorizado…"), devuelve el mensaje original sin tocarlo.
   */
  function mensajeErrorFirebase(err) {
    var msg = String((err && err.message) || err || '');
    var codigo = String((err && err.code) || '');
    if (!codigo) {
      var m = msg.match(/auth\/[a-z0-9-]+/i);
      codigo = m ? m[0].toLowerCase() : '';
    } else {
      codigo = codigo.toLowerCase();
    }
    var mapa = {
      'auth/invalid-credential': 'Correo o contraseña incorrectos. Verifícalos e intenta de nuevo.',
      'auth/wrong-password': 'Correo o contraseña incorrectos. Verifícalos e intenta de nuevo.',
      'auth/user-not-found': 'Correo o contraseña incorrectos. Verifícalos e intenta de nuevo.',
      'auth/invalid-email': 'Escribe un correo válido.',
      'auth/missing-email': 'Escribe tu correo.',
      'auth/missing-password': 'Escribe tu contraseña.',
      'auth/user-disabled': 'Esta cuenta está desactivada. Contacta al administrador.',
      'auth/invalid-user-token': 'Tu sesión expiró. Inicia sesión de nuevo.',
      'auth/user-token-expired': 'Tu sesión expiró. Inicia sesión de nuevo.',
      'auth/requires-recent-login': 'Por seguridad, vuelve a iniciar sesión.',
      'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos y vuelve a intentar.',
      'auth/network-request-failed': 'Sin conexión a internet. Revisa tu red e intenta de nuevo.',
      'auth/operation-not-allowed': 'El acceso por correo no está habilitado. Contacta al administrador.',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
      'auth/email-already-in-use': 'Ese correo ya está registrado.',
      'auth/invalid-action-code': 'El enlace caducó o ya fue usado. Solicita uno nuevo.',
      'auth/expired-action-code': 'El enlace caducó. Solicita uno nuevo.',
      'auth/quota-exceeded': 'Demasiadas solicitudes. Intenta en unos minutos.',
      'auth/internal-error': 'Error interno. Intenta de nuevo.'
    };
    if (mapa[codigo]) return mapa[codigo];
    if (codigo.indexOf('auth/') === 0) return 'No se pudo iniciar sesión. Verifica tus datos e intenta de nuevo.';
    return msg || 'No se pudo completar la operación.';
  }

  /**
   * Autoservicio: envía el correo "Restablecer contraseña" de Firebase.
   * El usuario define su propia contraseña desde el enlace (nadie más la ve).
   */
  async function recuperarPassword(email) {
    var correo = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
      throw { code: 'auth/invalid-email', message: 'Escribe un correo válido.' };
    }
    const { auth, authMod } = await obtenerAuth();
    await authMod.sendPasswordResetEmail(auth, correo);
    return true;
  }

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
    // Persistencia LOCAL: la sesión sobrevive a cerrar el navegador (práctico).
    // El cierre automático lo gobierna la expiración por inactividad de 60 min.
    try { await authMod.setPersistence(auth, authMod.browserLocalPersistence); } catch (e) { /* usar la por defecto */ }
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

  global.MRD_AUTH = {
    iniciarSesion, cerrarSesion, esperarSesion, obtenerIdToken,
    recuperarPassword, mensajeErrorFirebase,
    recordarEmail, olvidarEmail, emailRecordado
  };
})(window);
