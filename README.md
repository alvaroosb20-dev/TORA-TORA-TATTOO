# TORA TORA TATTOO — web

Web del estudio TORA TORA TATTOO (C/ Editor Manuel Aguilar 2, Valencia).
HTML/CSS/JS estático generado con Node + funciones serverless de Vercel. Sin dependencias.

## Estructura
```
site.config.mjs     ← TODOS los datos del estudio (teléfono, WhatsApp, fotos, señal, legales…)
build.mjs           ← genera /public (Vercel lo ejecuta solo)
src/assets/         ← styles.css y app.js
src/img/portfolio/  ← fotos del portfolio (WebP optimizadas)
api/reserva.js      ← recibe solicitudes de cita y las envía por correo (Resend)
api/senal.js        ← pago de señal con Stripe (desactivado hasta configurarlo)
vercel.json         ← URLs limpias (/portfolio, /reservar…) y cabeceras de seguridad
```

Páginas: `/` · `/portfolio` · `/reservar` · `/estudio` · `/contacto` · `/aviso-legal` · `/privacidad` · `/cookies` · `/condiciones-reserva` · `/senal` (no indexada, se envía al cliente tras confirmar) · 404.

## Publicar en Vercel (desde el móvil)
1. Sube esta carpeta a un repo de GitHub (p. ej. `alvaroosb20-dev/toratoratattoo`).
2. Vercel → Add New Project → importa el repo. No toques nada: `vercel.json` ya indica cómo construir.
3. Settings → Environment Variables → añade las de `.env.example` (ver abajo) y vuelve a desplegar.

## Variables de entorno (nunca en el código)
| Variable | Para qué | Obligatoria |
|---|---|---|
| `RESEND_API_KEY` | Enviar las solicitudes por correo (cuenta gratuita en resend.com) | Sí, para el formulario |
| `RESERVAS_EMAIL_TO` | Correo del estudio que recibe las solicitudes | Sí |
| `RESERVAS_EMAIL_FROM` | Remitente de un dominio verificado en Resend | Sí |
| `SEND_CLIENT_COPY` | `true` = acuse de recibo al cliente | No |
| `STRIPE_SECRET_KEY`, `DEPOSIT_AMOUNT_EUR`, `SITE_URL` | Cobro online de la señal | Solo si el estudio lo quiere |
| `GOOGLE_PLACES_API_KEY` | Reseñas reales de Google en la portada (nota media, total y hasta 5 reseñas) | Sí, para ver reseñas |
| `GOOGLE_PLACE_ID` | Ficha exacta del estudio en Google (si falta, se busca sola) | No |

**Reseñas de Google:** en console.cloud.google.com crea un proyecto, activa «Places API (New)», crea una clave en Credenciales y restríngela a esa API. Google pide tener facturación activada, pero con este uso (1 consulta por hora gracias a la caché) entra de sobra en el crédito mensual gratuito. Sin la clave, la web muestra el botón «Ver reseñas en Google».

Sin estas variables el formulario muestra un error claro y el teléfono del estudio; **nunca** finge que se ha enviado.

## Datos PENDIENTES (rellenar en `site.config.mjs`)
- `siteUrl` (dominio) → activa canonical, sitemap y metadatos para redes.
- `whatsapp` → convierte el botón flotante (ahora «Llamar») en WhatsApp con mensaje preparado.
- `email`, `address.postalCode`, `social.tiktok`, `social.facebook`.
- `history`, `artists` (nombres reales y especialidades), `reviews` (solo reseñas reales de Google).
- `deposit` (importe, métodos, cancelación, cambios) y `legal` (titular, NIF).
- `googleAnalyticsId` / `googleSiteVerification` (opcionales; Analytics solo se carga tras aceptar cookies).

## Añadir fotos al portfolio
Sube la imagen a `src/img/portfolio/` (JPG o WebP, máx. 1600 px) y añade una línea en `portfolio` de `site.config.mjs` con `file`, `style`, `alt`, `w` y `h`. Los filtros se crean solos según los estilos que tengan fotos.

## Siguientes pasos preparados
- **Calendario real**: `api/reserva.js` es el único punto de entrada; ahí se puede añadir guardado en Supabase y consulta de disponibilidad sin cambiar el formulario.
- **Señal online**: poner `deposit.amount` y `deposit.onlinePayment: true` en la config + variables de Stripe. Tras confirmar una cita, el estudio envía al cliente el enlace `/senal`.
