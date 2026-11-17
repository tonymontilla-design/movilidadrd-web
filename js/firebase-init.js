/**
 * firebase-init.js — Inicialización de Firebase Auth (SDK modular v10 vía CDN).
 * Expone window.MRD_AUTH con login/logout/esperarSesion.
 * Requiere config.js cargado ANTES que este archivo.
 */
(function (global) {
  'use strict';

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
    return cred.user;
  }

  async function cerrarSesion() {
    const { auth, authMod } = await obtenerAuth();
    await authMod.signOut(auth);
  }

  async function esperarSesion() {
    const { auth, authMod } = await obtenerAuth();
    return new Promise((resolve) => {
      const desuscribir = authMod.onAuthStateChanged(auth, (user) => {
        desuscribir();
        resolve(user);
      });
    });
  }

  async function obtenerIdToken() {
    const user = await esperarSesion();
    if (!user) return null;
    return user.getIdToken();
  }

  global.MRD_AUTH = { iniciarSesion, cerrarSesion, esperarSesion, obtenerIdToken };
})(window);
