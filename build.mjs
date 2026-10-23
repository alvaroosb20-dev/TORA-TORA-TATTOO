// Genera la web estática en /public a partir de site.config.mjs.
// Uso:  node build.mjs            → producción (Vercel lo ejecuta solo)
//       node build.mjs --preview  → vista previa con enlaces .html y CSS/JS en línea
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import C from "./site.config.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PREVIEW = process.argv.includes("--preview");
const OUT = path.join(ROOT, PREVIEW ? "preview" : "public");
const SRC = path.join(ROOT, "src");

/* ---------- utilidades ---------- */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const url = p => PREVIEW ? (p === "" ? "index.html" : p.replace(/#.*$/, "") + ".html" + (p.match(/#.*$/)?.[0] || "")) : "/" + p;
const img = f => "img/portfolio/" + f;
const phoneDisplay = C.phone.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
const tel = "tel:+34" + C.phone;
const wa = C.whatsapp ? `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(C.whatsappMessage)}` : "";
const fullAddress = [C.address.street, C.address.postalCode, C.address.city].filter(Boolean).join(", ");
const mapQuery = `TORA TORA TATTOO, ${C.address.street}, ${C.address.postalCode ? C.address.postalCode + " " : ""}${C.address.city}, España`;
const directions = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(mapQuery);
const mapsSearch = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(mapQuery);
const styleName = id => C.styles.find(s => s.id === id)?.name || id;
const hoursText = C.hours.map(h => `${h.opens}–${h.closes}`).join(" / ");
const year = new Date().getFullYear();
const P = txt => `<mark>[PENDIENTE: ${esc(txt)}]</mark>`;

const icon = {
  wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91A9.9 9.9 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.24 8.24 0 0 1 8.24 8.25c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23a7.46 7.46 0 0 1-1.38-1.72c-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  brush: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M14 4l6 6-8.5 8.5a3 3 0 0 1-2.1.9H4v-5.4a3 3 0 0 1 .9-2.1L14 4Z"/><path d="M11 7l6 6"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3Z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/><path d="M8.5 11h7M8.5 14h4"/></svg>',
  ruler: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 17 17 3l4 4L7 21l-4-4Z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/></svg>',
};

const logo = (tag = "a") => `<${tag} class="logo" ${tag === "a" ? `href="${url("")}" aria-label="TORA TORA TATTOO, inicio"` : ""}>
  <span class="seal" aria-hidden="true">虎</span>
  <span class="logo-word"><b>TORA TORA</b><small>TATTOO · ${esc(C.address.city.toUpperCase())}</small></span>
</${tag}>`;

const nav = [
  ["", "Inicio"], ["portfolio", "Portfolio"], ["estudio", "Estudio"], ["reservar", "Reservar"], ["contacto", "Contacto"],
];

/* ---------- datos estructurados (solo información real) ---------- */
const jsonLd = () => {
  const d = {
    "@context": "https://schema.org", "@type": "TattooParlor", name: C.name,
    address: { "@type": "PostalAddress", streetAddress: C.address.street, addressLocality: C.address.city, addressRegion: C.address.region, addressCountry: C.address.country, ...(C.address.postalCode && { postalCode: C.address.postalCode }) },
    telephone: "+34" + C.phone,
    openingHoursSpecification: C.hours.map(h => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.schemaDays.map(x => ({ Mo: "Monday", Tu: "Tuesday", We: "Wednesday", Th: "Thursday", Fr: "Friday", Sa: "Saturday", Su: "Sunday" }[x])), opens: h.opens, closes: h.closes })),
    sameAs: [C.social.instagram, C.social.tiktok, C.social.facebook].filter(Boolean),
  };
  if (C.siteUrl) { d.url = C.siteUrl + "/"; d.image = C.siteUrl + "/img/og-toratora.jpg"; }
  if (C.email) d.email = C.email;
  return `<script type="application/ld+json">${JSON.stringify(d)}</script>`;
};

/* ---------- plantilla común ---------- */
const css = fs.readFileSync(path.join(SRC, "assets/styles.css"), "utf8");
const js = fs.readFileSync(path.join(SRC, "assets/app.js"), "utf8");
const siteData = JSON.stringify({ phone: C.phone, phoneDisplay, whatsapp: C.whatsapp, gaId: C.googleAnalyticsId }).replace(/</g, "\\u003c");

function layout({ slug, title, description, body, entry = false, noindex = false, kanji = "" }) {
  const canonical = C.siteUrl ? `${C.siteUrl}/${slug}` : "";
  const head = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="claude:viewport-fit-sides" content="cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex, nofollow">' : ""}
${canonical ? `<link rel="canonical" href="${canonical}">` : ""}
<meta name="theme-color" content="#0c0b0b">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_ES">
<meta property="og:site_name" content="${esc(C.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${C.siteUrl ? `<meta property="og:url" content="${canonical}"><meta property="og:image" content="${C.siteUrl}/img/og-toratora.jpg">` : '<meta property="og:image" content="img/og-toratora.jpg">'}
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
${C.googleSiteVerification ? `<meta name="google-site-verification" content="${esc(C.googleSiteVerification)}">` : ""}
<link rel="icon" href="${slug === "404" && !PREVIEW ? "/" : ""}favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@700;800&text=${encodeURIComponent("虎和伝墨心手清寅")}&display=swap">
${PREVIEW ? `<style>${css}</style>` : `<link rel="stylesheet" href="/assets/styles.css">`}
${slug === "" ? jsonLd() : ""}
${slug === "404" && !PREVIEW ? '<base href="/">' : ""}`;

  const header = `<a class="skip" href="#main">Saltar al contenido</a>
<header class="site-header"><div class="wrap nav">
  ${logo()}
  <nav aria-label="Principal">
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="Abrir menú"><span></span><span></span><span></span></button>
    <ul class="nav-links" id="nav-links">
      ${nav.map(([p, l]) => `<li><a href="${url(p)}"${p === slug ? ' aria-current="page"' : ""}>${l}</a></li>`).join("")}
    </ul>
  </nav>
  <a class="btn btn-red nav-cta" href="${url("reservar")}">Reservar cita</a>
</div></header>`;

  const footer = `<footer class="site-footer"><div class="wrap">
  <div class="foot-grid">
    <div style="display:grid;gap:18px;align-content:start">${logo("div")}<p>${esc(C.slogan)}</p></div>
    <div><h2>Estudio</h2><ul>
      <li>${esc(C.address.street)}</li><li>${esc([C.address.postalCode, C.address.city].filter(Boolean).join(" "))}</li>
      <li><a href="${directions}" target="_blank" rel="noopener">Cómo llegar ↗</a></li></ul></div>
    <div><h2>Horario</h2><ul><li>Lunes a sábado</li>${C.hours.map(h => `<li>${h.opens} – ${h.closes}</li>`).join("")}<li>${esc(C.closedNote)}</li></ul></div>
    <div><h2>Contacto</h2><ul>
      <li><a href="${tel}">${phoneDisplay}</a></li>
      ${wa ? `<li><a href="${wa}" target="_blank" rel="noopener">WhatsApp</a></li>` : ""}
      ${C.email ? `<li><a href="mailto:${esc(C.email)}">${esc(C.email)}</a></li>` : ""}
      ${C.social.instagram ? `<li><a href="${C.social.instagram}" target="_blank" rel="noopener">Instagram ${esc(C.social.instagramHandle)}</a></li>` : ""}
      ${C.social.tiktok ? `<li><a href="${C.social.tiktok}" target="_blank" rel="noopener">TikTok</a></li>` : ""}
      ${C.social.facebook ? `<li><a href="${C.social.facebook}" target="_blank" rel="noopener">Facebook</a></li>` : ""}
    </ul></div>
  </div>
  <div class="foot-bottom">
    <span>© ${year} ${esc(C.name)} · ${esc(C.address.city)}</span>
    <span style="display:flex;flex-wrap:wrap;gap:8px 18px">
      <a href="${url("aviso-legal")}">Aviso legal</a><a href="${url("privacidad")}">Privacidad</a><a href="${url("cookies")}">Cookies</a><a href="${url("condiciones-reserva")}">Condiciones de reserva</a>
      <button type="button" data-open-cookies>Configurar cookies</button>
    </span>
  </div>
</div></footer>
${wa
  ? `<a class="float-contact" href="${wa}" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp a TORA TORA TATTOO">${icon.wa}</a>`
  : `<a class="float-contact phone" href="${tel}" aria-label="Llamar a TORA TORA TATTOO, ${phoneDisplay}">${icon.phone}</a>`}
<div class="mobile-bar">
  ${wa ? `<a class="btn wa" href="${wa}" target="_blank" rel="noopener">${icon.wa} WhatsApp</a>` : `<a class="btn" href="${tel}">${icon.phone} Llamar</a>`}
  <a class="btn btn-red" href="${url("reservar")}">Reservar cita</a>
</div>
<div class="cookie" id="cookie" role="dialog" aria-label="Preferencias de cookies" hidden>
  <p>Usamos solo almacenamiento técnico necesario. Si aceptas, cargaremos también Google Maps${C.googleAnalyticsId ? " y Google Analytics (estadísticas anónimas)" : ""}, que pueden instalar cookies de terceros. <a href="${url("cookies")}">Más información</a>.</p>
  <div class="row"><button class="btn btn-red" type="button" data-consent="all">Aceptar</button><button class="btn" type="button" data-consent="essential">Solo necesarias</button></div>
</div>
<script id="site-data" type="application/json">${siteData}</script>
${PREVIEW ? `<script>${js}</script>` : `<script src="/assets/app.js" defer></script>`}`;

  const inner = `${header}\n<main id="main">${kanji ? "" : ""}${body}</main>\n${footer}`;
  if (PREVIEW && entry) return `${head}\n${inner}`; // el visor añade html/head/body
  return `<!doctype html>\n<html lang="es">\n<head>\n${head}\n</head>\n<body>\n${inner}\n</body>\n</html>\n`;
}

const pageHead = (eyebrow, h1, lead, k) => `<section class="page-head" style="isolation:isolate"><div class="wrap">
  <span class="eyebrow">${eyebrow}</span><h1>${h1}</h1>${lead ? `<p class="lead">${lead}</p>` : ""}
</div>${k ? `<span class="bg-k" aria-hidden="true">${k}</span>` : ""}</section>`;

const pic = (p, sizes, cls = "", loading = "lazy") => `<img src="${img(p.thumb || p.file)}" ${p.thumb ? `srcset="${img(p.thumb)} 640w, ${img(p.file)} 1200w" sizes="${sizes}"` : ""} width="${p.w}" height="${p.h}" alt="${esc(p.alt)}" loading="${loading}" decoding="async"${cls ? ` class="${cls}"` : ""}>`;

/* ================= PÁGINAS ================= */
const featured = C.portfolio.filter(p => p.featured);
const hero = C.portfolio.find(p => p.file.startsWith("tigre")) || C.portfolio[0];
const offered = C.styles.filter(s => s.offered);

// Las reseñas reales llegan en vivo desde Google (api/resenas.js). Mientras cargan,
// o si la API no está configurada, se ve el bloque de respaldo.
const reviewsBlock = () => `<div id="google-reviews" data-src="${PREVIEW ? "" : "/api/resenas"}" aria-live="polite">${reviewsFallback()}</div>`;
const reviewsFallback = () => C.reviews.length
  ? `<div class="reviews">${C.reviews.map(r => `<figure class="review"><div class="stars" aria-label="${r.rating} de 5">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div><blockquote>${esc(r.text)}</blockquote><figcaption>${esc(r.author)} · Google${r.date ? " · " + esc(r.date) : ""}</figcaption></figure>`).join("")}</div>
     <p style="margin-top:22px"><a class="link-arrow" href="${mapsSearch}" target="_blank" rel="noopener">Ver todas en Google ${icon.arrow}</a></p>`
  : `<div class="reviews-empty"><span class="g" aria-hidden="true">G</span>
      <p>Las opiniones de nuestros clientes están en Google. Léelas allí, sin filtros, antes de reservar.</p>
      <a class="btn" href="${mapsSearch}" target="_blank" rel="noopener">Ver reseñas en Google</a></div>`;

const pages = {};

pages[""] = {
  title: `${C.name} | Estudio de tatuajes en ${C.address.city} · Japonés, tradicional y blackwork`,
  description: `Estudio de tatuajes en ${C.address.street}, ${C.address.city}. Japonés, tradicional y blackwork. Solicita tu cita online o llama al ${phoneDisplay}.`,
  body: `
<section class="hero" aria-labelledby="hero-title">
  <span class="hero-kanji" aria-hidden="true">虎</span>
  <div class="wrap hero-grid">
    <div>
      <span class="eyebrow reveal">Estudio de tatuaje · ${esc(C.address.city)}</span>
      <h1 class="hero-title" id="hero-title" style="margin-top:22px">
        <span class="row reveal d1">Tora</span><span class="row reveal d2">Tora</span>
        <span class="row tattoo reveal d3">Tattoo</span>
      </h1>
      <p class="hero-slogan reveal d3">Tu piel. Tu historia. <em>Nuestro arte.</em></p>
      <p class="hero-intro reveal d4">Tatuaje japonés, tradicional y blackwork en el centro de ${esc(C.address.city)}. Escuchamos tu idea, la adaptamos a tu cuerpo y la trabajamos con calma, de la primera línea al último sombreado.</p>
      <div class="hero-actions reveal d4">
        <a class="btn btn-red" href="${url("reservar")}">Reservar cita ${icon.arrow}</a>
        <a class="btn" href="${url("portfolio")}">Ver portfolio</a>
      </div>
      <div class="hero-meta reveal d4">
        <span>${icon.pin} ${esc(C.address.street)}</span>
        <span>${icon.clock} L–S · ${hoursText}</span>
      </div>
    </div>
    <figure class="hero-figure">
      ${pic(hero, "(max-width: 860px) 86vw, 40vw", "ink-in", "eager").replace('loading="eager"', 'loading="eager" fetchpriority="high"')}
      <span class="seal" aria-hidden="true">虎</span>
      <figcaption>Tigre · japonés en negro</figcaption>
    </figure>
  </div>
</section>

<section class="section band" aria-labelledby="estilos-t"><div class="wrap">
  <div class="sec-head"><span class="eyebrow">Estilos</span><h2 class="h2" id="estilos-t">Lo que tatuamos</h2></div>
  <div class="styles-grid">
    ${offered.map(s => `<a class="style-card" href="${url("portfolio#" + s.id)}" style="text-decoration:none">
      <span class="k" aria-hidden="true">${s.kanji}</span><h3>${esc(s.name)}</h3><p>${esc(s.text)}</p></a>`).join("")}
  </div>
  <p class="styles-note">¿Tienes en mente otro estilo? <a href="${url("reservar")}">Cuéntanos tu idea</a> y te diremos con sinceridad si encaja con el estudio.</p>
</div></section>

<section class="section" aria-labelledby="trabajos-t"><div class="wrap">
  <div class="sec-head split"><div style="display:grid;gap:18px"><span class="eyebrow">Trabajos seleccionados</span><h2 class="h2" id="trabajos-t">Hecho en el estudio</h2></div>
    <a class="link-arrow" href="${url("portfolio")}">Ver portfolio completo ${icon.arrow}</a></div>
  <div class="works">
    ${featured.slice(0, 4).map(p => `<figure class="work"><a href="${url("portfolio#" + p.style)}" aria-label="${esc(p.alt)} — ver en el portfolio">${pic(p, "(max-width: 760px) 50vw, 40vw")}</a><figcaption><span>${esc(styleName(p.style))}</span><span>虎</span></figcaption></figure>`).join("")}
  </div>
</div></section>

<section class="section band" aria-labelledby="porque-t"><div class="wrap why">
  <div class="sec-head why-head"><span class="eyebrow">Por qué TORA TORA</span><h2 class="h2" id="porque-t">Un tatuaje es para siempre. Hazlo bien.</h2>
    <p class="lead">Un estudio pequeño donde cada pieza se piensa antes de empezar.</p></div>
  <ul class="why-list">
    <li>${icon.brush}<h3>Diseño a tu medida</h3><p>Partimos de tu idea y de tus referencias para dibujar una pieza que funcione en tu piel y en la zona elegida.</p></li>
    <li>${icon.chat}<h3>Asesoramiento sincero</h3><p>Te orientamos sobre tamaño, ubicación y estilo para que el tatuaje se lea bien hoy y dentro de muchos años.</p></li>
    <li>${icon.shield}<h3>Higiene y seguridad</h3><p>Material de un solo uso y protocolo de limpieza en cada sesión. Te explicamos cómo cuidar el tatuaje después.</p></li>
    <li>${icon.ruler}<h3>Atención personalizada</h3><p>Hablas directamente con el estudio, sin intermediarios. Resolvemos tus dudas antes, durante y después de la sesión.</p></li>
  </ul>
</div></section>

<section class="section" aria-labelledby="proceso-t"><div class="wrap">
  <div class="sec-head"><span class="eyebrow">Cómo se reserva</span><h2 class="h2" id="proceso-t">De la idea a la piel</h2></div>
  <ol class="steps">
    <li><h3>Envía tu solicitud</h3><p>Rellena el formulario con tu idea, la zona y el tamaño. Puedes adjuntar fotos de referencia.</p></li>
    <li><h3>Te contactamos</h3><p>El estudio revisa tu propuesta y te escribe o llama para concretar diseño y presupuesto.</p></li>
    <li><h3>Confirmamos la cita</h3><p>Acordamos fecha y hora según la agenda real del estudio${C.deposit.amount ? ` y se abona la señal de ${C.deposit.amount} €` : ""}.</p></li>
    <li><h3>Día de la sesión</h3><p>Ven descansado, comido e hidratado. Del resto nos encargamos nosotros.</p></li>
  </ol>
</div></section>

<section class="section band" aria-labelledby="resenas-t"><div class="wrap">
  <div class="sec-head"><span class="eyebrow">Opiniones</span><h2 class="h2" id="resenas-t">Lo que dicen de nosotros</h2></div>
  ${reviewsBlock()}
</div></section>

${C.social.instagram ? `<section class="section" aria-labelledby="ig-t"><div class="wrap ig">
  <div><span class="eyebrow">Instagram</span><h2 class="sr-only" id="ig-t">Síguenos en Instagram</h2>
    <a class="ig-handle" href="${C.social.instagram}" target="_blank" rel="noopener">${esc(C.social.instagramHandle)}</a>
    <p class="lead" style="margin-top:16px">Trabajos recientes, diseños disponibles y huecos en la agenda. Lo publicamos primero en Instagram.</p>
    <p style="margin-top:22px"><a class="btn" href="${C.social.instagram}" target="_blank" rel="noopener">${icon.ig} Seguir en Instagram</a></p></div>
  <div class="ig-strip">${C.portfolio.slice(-3).map(p => `<a href="${C.social.instagram}" target="_blank" rel="noopener" aria-label="Ver más trabajos en Instagram">${pic(p, "(max-width: 820px) 33vw, 20vw")}</a>`).join("")}</div>
</div></section>` : ""}

<section class="section band cta-final" aria-labelledby="cta-t"><div class="wrap">
  <span class="eyebrow">Tu próxima pieza</span>
  <h2 class="h2" id="cta-t" style="margin-top:18px">¿Hablamos de <em>tu idea</em>?</h2>
  <p class="lead">Envíanos tu solicitud. No es una cita cerrada: te respondemos para concretar diseño, fecha y presupuesto.</p>
  <div class="row"><a class="btn btn-red" href="${url("reservar")}">Solicitar cita ${icon.arrow}</a><a class="btn" href="${tel}">${icon.phone} ${phoneDisplay}</a>${wa ? `<a class="btn" href="${wa}" target="_blank" rel="noopener">${icon.wa} WhatsApp</a>` : ""}</div>
</div></section>`,
};

/* ----- Portfolio ----- */
const withPhotos = C.styles.filter(s => C.portfolio.some(p => p.style === s.id));
pages.portfolio = {
  title: `Portfolio de tatuajes | ${C.name} ${C.address.city}`,
  description: `Trabajos reales de ${C.name} en ${C.address.city}: tatuaje japonés, tradicional y blackwork. Filtra por estilo y amplía cada pieza.`,
  body: `${pageHead("Portfolio", "Trabajos", "Piezas reales hechas en el estudio. Filtra por estilo y pulsa una foto para verla ampliada.", "墨")}
<section class="section" style="padding-top:40px" aria-label="Galería"><div class="wrap">
  <div class="filters" role="group" aria-label="Filtrar por estilo">
    <button class="filter" type="button" data-filter="all" aria-pressed="true">Todos<span class="n">${C.portfolio.length}</span></button>
    ${withPhotos.map(s => `<button class="filter" type="button" data-filter="${s.id}" aria-pressed="false">${esc(s.name)}<span class="n">${C.portfolio.filter(p => p.style === s.id).length}</span></button>`).join("")}
  </div>
  <p class="sr-only" id="gallery-status" aria-live="polite"></p>
  <div class="masonry" id="gallery">
    ${C.portfolio.map((p, i) => `<figure class="tile" data-style="${p.style}" data-full="${img(p.file)}" style="animation-delay:${i * 60}ms">
      <button type="button" aria-label="Ampliar: ${esc(p.alt)}">${pic(p, "(max-width: 700px) 100vw, 33vw", "", i < 3 ? "eager" : "lazy")}</button>
      <span class="tag">${esc(styleName(p.style))}</span></figure>`).join("")}
  </div>
  <div class="portfolio-note"><p>Más trabajos y novedades en ${C.social.instagram ? `<a href="${C.social.instagram}" target="_blank" rel="noopener">${esc(C.social.instagramHandle)}</a>` : "Instagram"}.</p>
    <a class="btn btn-red" href="${url("reservar")}">Quiero un tatuaje así</a></div>
</div></section>
<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Vista ampliada" hidden>
  <div class="lb-top"><span class="lb-count" id="lb-count"></span><button class="icon-btn lb-close" type="button" aria-label="Cerrar">${icon.close}</button></div>
  <div class="lb-stage"><img id="lb-img" alt=""><button class="icon-btn lb-prev" type="button" aria-label="Anterior">${icon.left}</button><button class="icon-btn lb-next" type="button" aria-label="Siguiente">${icon.right}</button></div>
  <p class="lb-cap" id="lb-cap"></p>
</div>`,
};

/* ----- Reservar ----- */
const d = C.deposit;
const depositPanel = `<div class="panel"><h2>Señal y condiciones</h2>
  ${d.amount
    ? `<p>Para bloquear la fecha se abona una señal de <strong style="color:var(--bone)">${d.amount} €</strong>, que se descuenta del precio final. Solo se pide <strong style="color:var(--bone)">después</strong> de que el estudio confirme tu cita.</p>`
    : `<p>Si tu cita requiere señal, el estudio te indicará el importe y la forma de pago <strong style="color:var(--bone)">al confirmarla</strong>. Enviar esta solicitud no tiene ningún coste.</p>`}
  <dl>
    <dt>Métodos de pago</dt><dd>${d.methods.length ? esc(d.methods.join(", ")) : '<span class="pending">Te lo indicamos al confirmar</span>'}</dd>
  </dl>
  ${d.cancellationPolicy ? `<h3>Cancelación</h3><p>${esc(d.cancellationPolicy)}</p>` : ""}
  ${d.changePolicy ? `<h3>Cambios de cita</h3><p>${esc(d.changePolicy)}</p>` : ""}
  <p><a href="${url("condiciones-reserva")}" style="color:var(--bone)">Condiciones de reserva y cancelación</a></p>
</div>`;

pages.reservar = {
  title: `Reservar cita de tatuaje | ${C.name} ${C.address.city}`,
  description: `Solicita tu cita en ${C.name} (${C.address.city}). Cuéntanos tu idea, zona, tamaño y estilo y adjunta referencias. El estudio te contactará para confirmar.`,
  body: `${pageHead("Solicitud de cita", "Reservar", "Rellena el formulario en unos minutos. Es una <strong>solicitud</strong>: el estudio la revisa y te contacta para confirmar diseño, fecha y presupuesto.", "寅")}
<section class="section" style="padding-top:48px"><div class="wrap booking">
  <div style="min-width:0">
    <form class="form" id="booking-form" novalidate>
      <fieldset class="fieldset"><legend><span>01</span> Tus datos</legend>
        <div class="field full" data-field="nombre"><label for="f-nombre">Nombre y apellidos <span class="req">*</span></label>
          <input class="input" id="f-nombre" name="nombre" autocomplete="name" required maxlength="100"><span class="err" role="alert"></span></div>
        <div class="field" data-field="telefono"><label for="f-tel">Teléfono o WhatsApp <span class="req">*</span></label>
          <input class="input" id="f-tel" name="telefono" type="tel" autocomplete="tel" inputmode="tel" required maxlength="20" placeholder="6XX XXX XXX"><span class="err" role="alert"></span></div>
        <div class="field" data-field="email"><label for="f-email">Correo electrónico <span class="req">*</span></label>
          <input class="input" id="f-email" name="email" type="email" autocomplete="email" required maxlength="120"><span class="err" role="alert"></span></div>
      </fieldset>

      <fieldset class="fieldset"><legend><span>02</span> Tu tatuaje</legend>
        <div class="field" data-field="zona"><label for="f-zona">Zona del cuerpo <span class="req">*</span></label>
          <select class="input" id="f-zona" name="zona" required><option value="">Elige una zona</option>
            ${["Brazo", "Antebrazo", "Manga completa", "Hombro", "Mano", "Pecho", "Espalda", "Costado / costillas", "Abdomen", "Cuello", "Pierna", "Muslo", "Gemelo", "Tobillo / pie", "Otra zona"].map(z => `<option>${z}</option>`).join("")}
          </select><span class="err" role="alert"></span></div>
        <div class="field" data-field="estilo"><label for="f-estilo">Estilo <span class="req">*</span></label>
          <select class="input" id="f-estilo" name="estilo" required><option value="">Elige un estilo</option>
            ${C.styles.filter(s => s.offered || C.portfolio.some(p => p.style === s.id)).map(s => `<option>${esc(s.name)}</option>`).join("")}
            <option>Otro estilo</option><option>No lo sé, quiero asesoramiento</option>
          </select><span class="err" role="alert"></span></div>
        <div class="field full" data-field="tamano"><span class="label" id="l-tam">Tamaño aproximado <span class="req">*</span></span>
          <div class="chips" role="radiogroup" aria-labelledby="l-tam">
            ${[["Pequeño", "hasta 10 cm"], ["Mediano", "10–20 cm"], ["Grande", "20–30 cm"], ["Pieza grande", "manga, espalda…"]].map(([v, h], i) => `<label class="chip"><input type="radio" name="tamano" value="${v} (${h})" id="f-tam-${i}"><span>${v} · ${h}</span></label>`).join("")}
          </div><span class="err" role="alert"></span></div>
        <div class="field full" data-field="idea"><label for="f-idea">Describe tu idea <span class="req">*</span></label>
          <textarea class="input" id="f-idea" name="idea" required maxlength="2000" placeholder="Qué quieres tatuarte, qué significa para ti, colores o negro, si cubre otro tatuaje…"></textarea>
          <span class="hint">Cuanto más detalle, más preciso será el presupuesto.</span><span class="err" role="alert"></span></div>
        <div class="field full" data-field="ref"><span class="label">Fotos de referencia <span class="hint" style="text-transform:none;letter-spacing:0">(opcional, máx. 3)</span></span>
          <div class="drop" id="drop">
            <label class="btn" for="f-ref" style="cursor:pointer">Adjuntar imágenes</label>
            <input id="f-ref" type="file" accept="image/*" multiple class="sr-only">
            <span class="hint">Diseños que te gusten, la zona del cuerpo o un tatuaje a tapar. Se reducen automáticamente antes de enviarse.</span>
            <div class="thumbs" id="thumbs"></div>
          </div><span class="err" role="alert"></span></div>
      </fieldset>

      <fieldset class="fieldset"><legend><span>03</span> Disponibilidad y presupuesto</legend>
        <div class="field" data-field="fecha"><label for="f-fecha">Fecha preferida</label>
          <input class="input" id="f-fecha" name="fecha" type="date"><span class="hint">Abrimos de lunes a sábado.</span><span class="err" role="alert"></span></div>
        <div class="field" data-field="horario"><label for="f-horario">Horario preferido</label>
          <select class="input" id="f-horario" name="horario"><option value="">Indiferente</option>
            ${C.hours.map((h, i) => `<option>${i === 0 ? "Mañana" : "Tarde"} (${h.opens}–${h.closes})</option>`).join("")}</select></div>
        <div class="field full" data-field="presupuesto"><label for="f-presu">Presupuesto aproximado</label>
          <select class="input" id="f-presu" name="presupuesto"><option value="">Prefiero que me orientéis</option>
            <option>Menos de 100 €</option><option>100 – 250 €</option><option>250 – 500 €</option><option>Más de 500 €</option><option>Proyecto por sesiones</option></select>
          <span class="hint">Es orientativo. El precio final lo da el estudio según diseño, tamaño y sesiones.</span></div>
      </fieldset>

      <div class="hp" aria-hidden="true"><label for="f-web">No rellenar</label><input id="f-web" name="web" tabindex="-1" autocomplete="off"></div>

      <div class="form-foot">
        <div class="field" data-field="privacidad">
          <label class="check" for="f-priv" style="text-transform:none;letter-spacing:0;font-weight:400"><input type="checkbox" id="f-priv" name="privacidad" required>
            <span>He leído y acepto la <a href="${url("privacidad")}" target="_blank">política de privacidad</a>. Mis datos se usarán solo para responder a esta solicitud. <span class="req">*</span></span></label>
          <span class="err" role="alert"></span></div>
        <div class="notice" id="form-status" role="alert" hidden></div>
        <button class="btn btn-red" id="submit-btn" type="submit">Enviar solicitud de cita ${icon.arrow}</button>
        <p class="hint" style="color:var(--mute);font-size:.88rem">Enviar la solicitud no confirma la cita ni tiene coste. Los campos con <span class="req" style="color:var(--red-hi)">*</span> son obligatorios.</p>
      </div>
    </form>

    <div class="success" id="booking-success" hidden>
      <span class="seal" aria-hidden="true">心</span>
      <h2 tabindex="-1">Solicitud recibida, <span id="s-name"></span></h2>
      <p class="lead" style="font-size:1.05rem">Tu cita <strong style="color:var(--bone)">todavía no está confirmada</strong>. Esto es lo que pasa ahora:</p>
      <ol>
        <li><strong>El estudio revisa tu idea</strong> y las referencias que has enviado.</li>
        <li><strong>Te contactamos</strong> en <span id="s-contact"></span> para concretar diseño, presupuesto y fecha disponible.</li>
        <li><strong>Confirmamos la cita</strong>${d.amount ? ` con el abono de la señal (${d.amount} €)` : ""}. Solo entonces queda reservada.</li>
      </ol>
      <p style="color:var(--mute)">¿Es urgente? Llámanos al <a href="${tel}">${phoneDisplay}</a> en horario de ${hoursText}, de lunes a sábado.</p>
      <p><a class="btn" href="${url("portfolio")}">Ver más trabajos</a></p>
    </div>
  </div>

  <aside class="aside" aria-label="Información de la reserva">
    <div class="panel"><h2>Así funciona</h2>
      <ul><li>Envías tu solicitud (gratis y sin compromiso).</li><li>El estudio la revisa y te contacta.</li><li>Concretáis diseño, fecha y presupuesto.</li><li>La cita queda confirmada cuando el estudio te lo dice.</li></ul></div>
    ${depositPanel}
    <div class="panel"><h2>¿Prefieres hablar?</h2>
      <p>${C.hours.length ? `Lunes a sábado, ${hoursText}.` : ""}</p>
      <p style="display:flex;flex-wrap:wrap;gap:10px"><a class="btn" href="${tel}">${icon.phone} ${phoneDisplay}</a>${wa ? `<a class="btn" href="${wa}" target="_blank" rel="noopener">${icon.wa} WhatsApp</a>` : ""}</p></div>
  </aside>
</div></section>`,
};

/* ----- Estudio ----- */
pages.estudio = {
  title: `El estudio | ${C.name}, tatuajes en ${C.address.city}`,
  description: `Conoce ${C.name}: estudio de tatuajes en ${C.address.city} especializado en japonés, tradicional y blackwork. Higiene, asesoramiento y atención personalizada.`,
  body: `${pageHead("El estudio", "Tora Tora", "<em style='font-style:normal;color:var(--red-hi)'>Tora</em> significa tigre en japonés. Dos veces, por si quedaba alguna duda.", "虎")}
<section class="section"><div class="wrap about">
  <div class="text">
    <span class="eyebrow">Filosofía</span>
    ${C.history ? C.history.split(/\n\n+/).map(p => `<p>${esc(p)}</p>`).join("") : ""}
    <p>En TORA TORA TATTOO el tatuaje se entiende como un oficio con tradición. Nos mueven el tatuaje japonés, la fuerza del tradicional y la tinta negra de los grabados antiguos.</p>
    <p>Cada proyecto empieza con una conversación. Escuchamos lo que quieres contar, miramos tu cuerpo y tus referencias, y proponemos un diseño que tenga sentido en tu piel, hoy y dentro de veinte años.</p>
    <p>Preferimos hacer menos piezas y hacerlas bien.</p>
  </div>
  <figure>${pic(C.portfolio.find(p => p.file.startsWith("manga")) || C.portfolio[0], "(max-width: 860px) 100vw, 45vw")}</figure>
</div></section>

<section class="section band" aria-labelledby="val-t"><div class="wrap">
  <div class="sec-head"><span class="eyebrow">Cómo trabajamos</span><h2 class="h2" id="val-t">Nuestro compromiso</h2></div>
  <div class="values">
    <div><span class="k" aria-hidden="true">墨</span><h3>Pasión por el oficio</h3><p>Dibujo, línea y color trabajados con paciencia. El tatuaje como arte que se lleva puesto.</p></div>
    <div><span class="k" aria-hidden="true">清</span><h3>Higiene y seguridad</h3><p>Material de un solo uso, superficies protegidas y protocolo de limpieza en cada sesión.</p></div>
    <div><span class="k" aria-hidden="true">心</span><h3>Atención personalizada</h3><p>Te acompañamos antes, durante y después: cuidados, curación y revisiones.</p></div>
    <div><span class="k" aria-hidden="true">手</span><h3>De la idea al diseño</h3><p>Convertimos una idea, una foto o un recuerdo en un diseño propio adaptado a la zona.</p></div>
  </div>
</div></section>

<section class="section" aria-labelledby="team-t"><div class="wrap">
  <div class="sec-head"><span class="eyebrow">Equipo</span><h2 class="h2" id="team-t">Quién te tatúa</h2></div>
  ${C.artists.length
    ? `<div class="team">${C.artists.map(a => `<article class="artist">${a.photo ? `<img src="img/${esc(a.photo)}" alt="${esc(a.name)}, tatuador en ${esc(C.name)}" loading="lazy">` : ""}<div><span class="sp">${esc(a.specialty || "")}</span><h3>${esc(a.name)}</h3>${a.bio ? `<p>${esc(a.bio)}</p>` : ""}${a.instagram ? `<a class="link-arrow" href="${a.instagram}" target="_blank" rel="noopener">Instagram ${icon.arrow}</a>` : ""}</div></article>`).join("")}</div>`
    : `<div class="reviews-empty"><span class="g" aria-hidden="true" style="font-family:var(--f-jp);color:var(--red)">虎</span><p>Muy pronto presentaremos aquí al equipo y sus especialidades. Mientras tanto, puedes ver su trabajo en el portfolio y en Instagram.</p><a class="btn" href="${url("portfolio")}">Ver portfolio</a></div>`}
</div></section>

<section class="section band cta-final"><div class="wrap">
  <h2 class="h2">Ven a <em>conocernos</em></h2>
  <p class="lead">${esc(C.address.street)}, ${esc(C.address.city)}. Lunes a sábado, ${hoursText}.</p>
  <div class="row"><a class="btn btn-red" href="${url("reservar")}">Reservar cita</a><a class="btn" href="${url("contacto")}">Cómo llegar</a></div>
</div></section>`,
};

/* ----- Contacto ----- */
pages.contacto = {
  title: `Contacto y ubicación | ${C.name} ${C.address.city}`,
  description: `${C.name}: ${fullAddress}. Teléfono ${phoneDisplay}. Lunes a sábado ${hoursText}. Cómo llegar y contacto.`,
  body: `${pageHead("Contacto", "Visítanos", `Estamos en ${esc(C.address.street)}, ${esc(C.address.city)}.`, "虎")}
<section class="section" style="padding-top:48px"><div class="wrap contact">
  <ul class="contact-list">
    <li><span class="k">Dirección</span><span class="v">${esc(C.address.street)}<br>${esc([C.address.postalCode, C.address.city].filter(Boolean).join(" "))}</span></li>
    <li><span class="k">Teléfono</span><span class="v"><a href="${tel}">${phoneDisplay}</a></span></li>
    ${wa ? `<li><span class="k">WhatsApp</span><span class="v"><a href="${wa}" target="_blank" rel="noopener">Escribir por WhatsApp</a></span></li>` : ""}
    ${C.email ? `<li><span class="k">Correo</span><span class="v"><a href="mailto:${esc(C.email)}">${esc(C.email)}</a></span></li>` : ""}
    <li><span class="k">Horario</span><span class="v"><table class="hours"><tbody>${C.hours.map((h, i) => `<tr><td>${i === 0 ? "Lunes a sábado" : ""}</td><td>${h.opens} – ${h.closes}</td></tr>`).join("")}<tr><td>Domingo</td><td>Cerrado</td></tr></tbody></table></span></li>
    <li><span class="k">Redes</span><span class="v" style="display:flex;flex-wrap:wrap;gap:8px 18px">
      ${C.social.instagram ? `<a href="${C.social.instagram}" target="_blank" rel="noopener">Instagram ${esc(C.social.instagramHandle)}</a>` : ""}
      ${C.social.tiktok ? `<a href="${C.social.tiktok}" target="_blank" rel="noopener">TikTok</a>` : ""}
      ${C.social.facebook ? `<a href="${C.social.facebook}" target="_blank" rel="noopener">Facebook</a>` : ""}</span></li>
  </ul>
  <div>
    <div class="map" data-map="${esc(mapQuery)}">
      <div class="map-placeholder">${icon.pin.replace("<svg", '<svg style="width:40px;height:40px;color:var(--red-hi)"')}
        <p>El mapa lo sirve Google y puede usar cookies. Se carga solo si lo pides.</p>
        <button class="btn" type="button" data-load-map>Mostrar mapa</button></div>
    </div>
    <div class="map-actions"><a class="btn btn-red" href="${directions}" target="_blank" rel="noopener">${icon.pin} Cómo llegar</a><a class="btn" href="${mapsSearch}" target="_blank" rel="noopener">Abrir en Google Maps</a></div>
  </div>
</div></section>`,
};

/* ----- Página de pago de la señal (se envía al cliente tras confirmar) ----- */
pages.senal = {
  noindex: true,
  title: `Señal de tu cita | ${C.name}`,
  description: `Pago de la señal de una cita ya confirmada por ${C.name}.`,
  body: `${pageHead("Cita confirmada", "Señal", "Esta página es solo para citas que el estudio ya te ha confirmado.", "")}
<section class="section"><div class="wrap" style="max-width:720px;margin-left:0">
  ${d.amount && d.onlinePayment
    ? `<div class="panel" style="gap:20px"><span class="eyebrow">Importe de la señal</span><p class="deposit-amount">${d.amount} €</p>
       <p>Se descuenta del precio final del tatuaje. El pago se hace en la pasarela segura de Stripe; esta web no ve ni guarda los datos de tu tarjeta.</p>
       <button class="btn btn-red" id="pay-deposit" type="button">Pagar señal con tarjeta</button><p class="notice error" id="pay-status" hidden></p>
       ${d.cancellationPolicy ? `<p><strong style="color:var(--bone)">Cancelación:</strong> ${esc(d.cancellationPolicy)}</p>` : ""}</div>`
    : `<div class="panel"><h2>Pago online no disponible</h2><p>El estudio te indicará cómo abonar la señal${d.methods.length ? ` (${esc(d.methods.join(", "))})` : ""}. Si tienes dudas, llama al <a href="${tel}">${phoneDisplay}</a>.</p></div>`}
</div></section>`,
};

/* ----- Legales ----- */
const L = C.legal;
const owner = L.owner ? esc(L.owner) : P("titular: nombre y apellidos o razón social");
const nif = L.taxId ? esc(L.taxId) : P("NIF/CIF");
const lemail = L.legalEmail ? esc(L.legalEmail) : (C.email ? esc(C.email) : P("correo de contacto legal"));
const legal = (slug, h, eyebrow, html) => pages[slug] = {
  title: `${h} | ${C.name}`, description: `${h} de ${C.name}, estudio de tatuajes en ${C.address.city}.`,
  body: `${pageHead(eyebrow, h, "", "")}<section class="section" style="padding-top:48px"><div class="wrap"><div class="legal">${html}</div></div></section>`,
};

legal("aviso-legal", "Aviso legal", "Legal", `
<p>En cumplimiento de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de los datos del titular de este sitio web:</p>
<ul><li><strong>Titular:</strong> ${owner}</li><li><strong>NIF/CIF:</strong> ${nif}</li><li><strong>Nombre comercial:</strong> ${esc(C.name)}</li>
<li><strong>Domicilio:</strong> ${esc(fullAddress)}</li><li><strong>Teléfono:</strong> ${phoneDisplay}</li><li><strong>Correo:</strong> ${lemail}</li>
${L.registry ? `<li><strong>Datos registrales:</strong> ${esc(L.registry)}</li>` : `<li><strong>Datos registrales:</strong> ${P("solo si es sociedad mercantil")}</li>`}</ul>
<h2>Objeto</h2><p>Este sitio web informa sobre los servicios del estudio de tatuajes ${esc(C.name)} y permite enviar solicitudes de cita, que no constituyen una reserva confirmada.</p>
<h2>Propiedad intelectual</h2><p>Las fotografías de tatuajes, diseños, textos y la identidad visual de este sitio pertenecen al titular o a sus autores. Queda prohibida su reproducción, distribución o transformación sin autorización expresa.</p>
<h2>Responsabilidad</h2><p>El titular no se hace responsable del mal uso de los contenidos ni de los daños derivados de interrupciones del servicio o de enlaces a sitios de terceros.</p>
<h2>Legislación aplicable</h2><p>Este aviso se rige por la legislación española.</p>`);

legal("privacidad", "Política de privacidad", "Legal", `
<p>Este texto explica cómo tratamos los datos personales que nos facilitas a través de esta web, conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).</p>
<h2>Responsable del tratamiento</h2><p>${owner} (${nif}), ${esc(C.name)}, ${esc(fullAddress)}. Contacto: ${lemail}.</p>
<h2>Qué datos tratamos</h2><ul><li>Datos de contacto: nombre, teléfono y correo electrónico.</li><li>Datos de tu solicitud: zona del cuerpo, estilo, tamaño, descripción, fechas preferidas, presupuesto orientativo e imágenes de referencia que adjuntes.</li></ul>
<p>Te pedimos que no incluyas datos de salud en la descripción. Si alguna condición médica pudiera afectar al tatuaje, la trataremos en persona en el estudio.</p>
<h2>Para qué los usamos</h2><p>Para responder a tu solicitud, preparar el presupuesto y gestionar tu cita. No los usamos para enviarte publicidad.</p>
<h2>Base legal</h2><p>Tu consentimiento al enviar el formulario y la aplicación de medidas precontractuales a petición tuya (art. 6.1.a y 6.1.b RGPD).</p>
<h2>Cuánto tiempo los guardamos</h2><p>Mientras gestionamos tu solicitud y, si no se llega a realizar el tatuaje, un máximo de ${P("plazo, p. ej. 12 meses")}. Si eres cliente, durante los plazos que exija la ley.</p>
<h2>Quién más accede</h2><p>No cedemos tus datos a terceros salvo obligación legal. Usamos proveedores que tratan datos por cuenta nuestra: alojamiento web (Vercel Inc.) y envío de correo (${P("proveedor de correo, p. ej. Resend")}). Algunos pueden estar fuera del Espacio Económico Europeo con garantías adecuadas (cláusulas contractuales tipo).</p>
<h2>Tus derechos</h2><p>Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a ${lemail}. Si consideras que no hemos atendido tus derechos, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>`);

legal("cookies", "Política de cookies", "Legal", `
<p>Esta web usa el mínimo imprescindible. No instalamos cookies publicitarias.</p>
<h2>Qué usamos</h2>
<div class="table-scroll"><table><thead><tr><th>Nombre</th><th>Proveedor</th><th>Finalidad</th><th>Tipo</th></tr></thead><tbody>
<tr><td>tt-consent-v1</td><td>${esc(C.name)}</td><td>Recordar tu elección sobre cookies (almacenamiento local)</td><td>Técnica, necesaria</td></tr>
<tr><td>Cookies de Google Maps</td><td>Google</td><td>Mostrar el mapa integrado. Solo se carga si aceptas o pulsas «Mostrar mapa»</td><td>Terceros, opcional</td></tr>
${C.googleAnalyticsId ? `<tr><td>_ga, _ga_*</td><td>Google</td><td>Estadísticas anónimas de visitas. Solo si aceptas</td><td>Analítica, opcional</td></tr>` : ""}
</tbody></table></div>
<h2>Cómo cambiar tu elección</h2><p>Pulsa «Configurar cookies» en el pie de cualquier página. También puedes borrar las cookies desde la configuración de tu navegador.</p>`);

legal("condiciones-reserva", "Condiciones de reserva", "Legal", `
<h2>Solicitud de cita</h2><p>Enviar el formulario de esta web es una <strong>solicitud</strong>, no una reserva. La cita solo queda confirmada cuando el estudio te lo comunica expresamente por teléfono, WhatsApp o correo.</p>
<h2>Presupuesto</h2><p>El precio depende del diseño, tamaño, zona y número de sesiones. El estudio te dará un presupuesto antes de confirmar la cita. El presupuesto orientativo que indicas en el formulario no es vinculante.</p>
<h2>Señal</h2><p>${d.amount ? `Para confirmar la cita se abona una señal de ${d.amount} €, que se descuenta del precio final.` : `Si el estudio requiere señal, te indicará el importe y la forma de pago al confirmar la cita. ${P("importe de la señal")}`}</p>
<p><strong>Métodos de pago:</strong> ${d.methods.length ? esc(d.methods.join(", ")) : P("métodos de pago aceptados")}</p>
<h2>Cancelación</h2><p>${d.cancellationPolicy ? esc(d.cancellationPolicy) : P("política de cancelación: plazo de aviso y si la señal se devuelve o se pierde")}</p>
<h2>Cambios de cita</h2><p>${d.changePolicy ? esc(d.changePolicy) : P("condiciones para mover una cita: con cuánta antelación y cuántas veces")}</p>
<h2>Edad mínima</h2><p>Para tatuarse es necesario ser mayor de edad o cumplir los requisitos que marque la normativa sanitaria aplicable en la Comunitat Valenciana. El estudio puede pedir documento de identidad.</p>`);

pages["404"] = {
  noindex: true, title: `Página no encontrada | ${C.name}`, description: "La página que buscas no existe.",
  body: `${pageHead("Error 404", "Perdido", "Esta página no existe o ha cambiado de dirección.", "虎")}
<section class="section" style="padding-top:40px"><div class="wrap" style="display:flex;flex-wrap:wrap;gap:14px"><a class="btn btn-red" href="${url("")}">Volver al inicio</a><a class="btn" href="${url("portfolio")}">Ver portfolio</a></div></section>`,
};

/* ================= ESCRITURA ================= */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const copyDir = (from, to) => { fs.mkdirSync(to, { recursive: true }); for (const f of fs.readdirSync(from)) { const s = path.join(from, f), t = path.join(to, f); fs.statSync(s).isDirectory() ? copyDir(s, t) : fs.copyFileSync(s, t); } };
copyDir(path.join(SRC, "img"), path.join(OUT, "img"));
fs.copyFileSync(path.join(SRC, "favicon.svg"), path.join(OUT, "favicon.svg"));
fs.copyFileSync(path.join(SRC, "logo-tora-tora.svg"), path.join(OUT, "logo-tora-tora.svg"));
if (!PREVIEW) copyDir(path.join(SRC, "assets"), path.join(OUT, "assets"));

for (const [slug, p] of Object.entries(pages)) {
  const file = (slug === "" ? "index" : slug) + ".html";
  fs.writeFileSync(path.join(OUT, file), layout({ slug, ...p, entry: slug === "" }));
}

// SEO: robots y sitemap
const indexable = Object.entries(pages).filter(([, p]) => !p.noindex).map(([s]) => s);
const base = C.siteUrl || "https://DOMINIO-PENDIENTE.es";
fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /senal\nDisallow: /api/\n\nSitemap: ${base}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map(s => `  <url><loc>${base}/${s}</loc><changefreq>${["", "portfolio"].includes(s) ? "weekly" : "yearly"}</changefreq><priority>${s === "" ? "1.0" : ["reservar", "portfolio"].includes(s) ? "0.9" : s.match(/legal|privacidad|cookies|condiciones/) ? "0.2" : "0.7"}</priority></url>`).join("\n")}\n</urlset>\n`);

console.log(`✔ ${Object.keys(pages).length} páginas generadas en ${path.relative(ROOT, OUT)}/${C.siteUrl ? "" : "  (aviso: siteUrl vacío en site.config.mjs)"}`);
