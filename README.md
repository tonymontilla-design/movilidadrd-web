# MovilidadRD — Frontend (sitio público)

Sitio estático PWA de MovilidadRD (transporte privado en República Dominicana).
Backend: Google Apps Script Web App (su URL vive en `js/config.js`).

- Público: `index.html` (reservas + consulta por código con token privado)
- Admin: `admin.html` · Portal conductor: `conductor.html`

`js/config.js` solo contiene valores públicos (apiKey web de Firebase y la URL del Web App). Sin secretos.
