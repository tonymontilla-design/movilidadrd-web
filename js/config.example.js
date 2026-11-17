/**
 * config.example.js — Plantilla de configuración del frontend.
 *
 * Copie este archivo como `config.js` (mismo directorio) y complete:
 *   1. WEB_APP_URL: URL de despliegue del Web App de Apps Script
 *      (script.google.com → Deploy → Web app → URL /exec)
 *   2. firebaseConfig: Configuración web de tu proyecto Firebase
 *      (Firebase Console → Project settings → Your apps → Web app)
 *      NOTA: la apiKey web de Firebase es PÚBLICA por diseño; no es un secreto.
 *      Los secretos (SPREADSHEET_ID, FIREBASE_API_KEY para accounts:lookup)
 *      NUNCA van aquí: viven en Script Properties del backend.
 *
 * `config.js` está en .gitignore y no debe subirse al repositorio.
 */
window.MRD_CONFIG = {
  WEB_APP_URL: 'https://script.google.com/macros/s/PEGAR_DEPLOYMENT_ID/exec',
  firebaseConfig: {
    apiKey: 'PEGAR_API_KEY_WEB',
    authDomain: 'tu-proyecto.firebaseapp.com',
    projectId: 'tu-proyecto',
    storageBucket: 'tu-proyecto.appspot.com',
    messagingSenderId: '000000000000',
    appId: '1:000000000000:web:0000000000000000000000'
  },
  // WhatsApp comercial del negocio (solo dígitos, con código de país). Ej.: 18295550000
  WHATSAPP_NEGOCIO: '18096131079'
};
