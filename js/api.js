/**
 * api.js — Cliente HTTP del Web App de Apps Script.
 * Todas las operaciones servidor pasan por aquí. Sin cache de datos sensibles.
 */
(function (global) {
  'use strict';

  function config() {
    const cfg = global.MRD_CONFIG;
    if (!cfg || !cfg.WEB_APP_URL || cfg.WEB_APP_URL.includes('PEGAR_')) {
      throw new Error('La aplicación no está configurada: falta js/config.js (vea INSTALACION.md §Frontend).');
    }
    return cfg;
  }

  /**
   * Llama al Web App.
   * @param {string} action  Nombre de la acción (ej. 'ping').
   * @param {object} payload Datos de la operación.
   * @param {string|null} idToken Token de Firebase (o null para acciones públicas).
   */
  async function llamar(action, payload, idToken) {
    let url;
    try { url = config().WEB_APP_URL; } catch (e) { return { ok: false, error: e.message }; }

    let respuesta;
    try {
      respuesta = await fetch(url, {
        method: 'POST',
        // GAS no soporta preflight CORS: content-type text/plain evita el preflight
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, payload: payload || {}, idToken: idToken || undefined }),
        redirect: 'follow'
      });
    } catch (e) {
      return { ok: false, error: 'Sin conexión con el servidor. Verifique su internet e intente nuevamente.' };
    }

    let datos;
    try { datos = await respuesta.json(); } catch (e) {
      return { ok: false, error: 'Respuesta inesperada del servidor.' };
    }
    return datos;
  }

  async function ping() {
    return llamar('ping', {}, null);
  }

  global.MRD_API = { llamar, ping };
})(window);
