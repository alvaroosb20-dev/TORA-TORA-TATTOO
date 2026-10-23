// =====================================================================
//  TORA TORA TATTOO — CONFIGURACIÓN DE LA WEB
//  Todo lo que cambia el contenido está aquí. Después de editar,
//  Vercel vuelve a construir la web sola al hacer commit.
//  Los campos con  null  o  ""  están PENDIENTES: la web los oculta
//  o muestra un aviso discreto hasta que se rellenen. No inventar datos.
// =====================================================================

export default {
  // Dominio definitivo, sin barra final (p. ej. "https://toratoratattoo.es").
  // PENDIENTE: se usa para sitemap.xml, robots.txt y metadatos de redes.
  siteUrl: "",

  name: "TORA TORA TATTOO",
  slogan: "Tu piel. Tu historia. Nuestro arte.",

  // ---------- CONTACTO (datos facilitados por el estudio) ----------
  address: {
    street: "C/ Editor Manuel Aguilar 2",
    city: "Valencia",
    postalCode: "", // PENDIENTE: código postal
    region: "Valencia",
    country: "ES",
  },
  phone: "961676974",          // fijo del estudio
  whatsapp: "",                // PENDIENTE: móvil con WhatsApp, con prefijo, solo cifras. Ej: "34600000000"
  whatsappMessage: "Hola, me gustaría solicitar información sobre un tatuaje en TORA TORA TATTOO.",
  email: "",                   // PENDIENTE: correo público del estudio

  // Horario (formato 24 h). "Su" = domingo cerrado si no aparece.
  hours: [
    { days: "Lunes a sábado", opens: "10:00", closes: "14:00", schemaDays: ["Mo","Tu","We","Th","Fr","Sa"] },
    { days: "Lunes a sábado", opens: "17:00", closes: "20:30", schemaDays: ["Mo","Tu","We","Th","Fr","Sa"] },
  ],
  closedNote: "Domingo cerrado",

  // ---------- REDES (vacío = no se muestra) ----------
  social: {
    instagram: "https://www.instagram.com/toratoratattoo",
    instagramHandle: "@toratoratattoo",
    tiktok: "",     // PENDIENTE
    facebook: "",   // PENDIENTE
  },

  // ---------- PORTFOLIO ----------
  // Para añadir fotos: súbelas a src/img/portfolio/ (ideal: WebP o JPG de
  // máx. 1600 px) y añade una línea aquí. "thumb" es opcional.
  // Estilos válidos: los de la lista "styles" de abajo.
  portfolio: [
    { file: "tigre-japones-costado.webp", thumb: "tigre-japones-costado-640.webp", style: "japones", featured: true,
      alt: "Tatuaje japonés de tigre en negro trepando por el costado", w: 1033, h: 1205 },
    { file: "manga-japonesa-fudo-myoo.webp", thumb: "manga-japonesa-fudo-myoo-640.webp", style: "japones", featured: true,
      alt: "Manga japonesa a color con Fudō Myōō, peonías rojas y fondo negro", w: 1083, h: 1313 },
    { file: "espalda-tradicional-serpiente.webp", thumb: "espalda-tradicional-serpiente-640.webp", style: "tradicional", featured: true,
      alt: "Espalda completa en estilo tradicional: fiera enroscada con una serpiente a color", w: 1053, h: 1288 },
    { file: "esqueletos-grabado-blackwork.webp", thumb: "esqueletos-grabado-blackwork-640.webp", style: "blackwork", featured: true,
      alt: "Dos esqueletos abrazados en estilo grabado blackwork", w: 1179, h: 1450 },
    { file: "segador-grabado-blackwork.webp", thumb: "segador-grabado-blackwork-640.webp", style: "blackwork", featured: false,
      alt: "Figura de segador con guadaña en estilo grabado antiguo, línea negra", w: 1179, h: 1165 },
  ],

  // Estilos. En el filtro del portfolio solo aparecen los que tienen fotos.
  // "offered: true" = aparece en la sección de estilos de la portada.
  styles: [
    { id: "japones", name: "Japonés", kanji: "和", offered: true,
      text: "Tigres, peonías, deidades y fondos de viento y agua. Piezas grandes pensadas para fluir con el cuerpo." },
    { id: "tradicional", name: "Tradicional", kanji: "伝", offered: true,
      text: "Línea gruesa, color sólido y diseños que siguen leyéndose bien con los años." },
    { id: "blackwork", name: "Blackwork y grabado", kanji: "墨", offered: true,
      text: "Solo tinta negra. Tramas y rayados que recuerdan a los grabados antiguos." },
    { id: "realismo", name: "Realismo", offered: false },
    { id: "minimalista", name: "Minimalista", offered: false },
    { id: "lettering", name: "Lettering", offered: false },
    { id: "otros", name: "Otros estilos", offered: false },
  ],

  // ---------- EL ESTUDIO ----------
  // PENDIENTE: historia real del estudio. Mientras esté vacío se muestra solo la filosofía.
  history: "",
  // Tatuadores. Vacío = se muestra "Equipo: información próximamente".
  // Ejemplo: { name: "Nombre", specialty: "Japonés", bio: "...", photo: "nombre.webp", instagram: "https://..." }
  artists: [],

  // ---------- RESEÑAS ----------
  // Solo reseñas reales copiadas de Google con permiso o de forma literal.
  // Ejemplo: { author: "Nombre tal como aparece en Google", rating: 5, text: "...", date: "2026-09" }
  reviews: [],

  // ---------- SEÑAL Y CONDICIONES ----------
  // Nada se cobra mientras deposit.amount sea null.
  deposit: {
    amount: null,               // PENDIENTE: importe en euros, p. ej. 50
    methods: [],                // PENDIENTE: p. ej. ["Bizum", "Efectivo en el estudio", "Tarjeta"]
    onlinePayment: false,       // true solo cuando Stripe esté configurado en Vercel
    cancellationPolicy: "",     // PENDIENTE
    changePolicy: "",           // PENDIENTE
  },

  // ---------- DATOS LEGALES (PENDIENTES, los rellena el titular) ----------
  legal: {
    owner: "",        // nombre y apellidos o razón social
    taxId: "",        // NIF / CIF
    registry: "",     // datos registrales si es sociedad
    legalEmail: "",   // correo para ejercer derechos RGPD
  },

  // ---------- ANALÍTICA (opcional; solo se carga tras aceptar cookies) ----------
  googleAnalyticsId: "",        // p. ej. "G-XXXXXXX"
  googleSiteVerification: "",   // código de Search Console (meta tag)
};
