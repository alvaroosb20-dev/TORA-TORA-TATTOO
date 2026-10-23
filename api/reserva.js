// POST /api/reserva — recibe una SOLICITUD de cita (no la confirma) y la envía
// por correo al estudio mediante Resend. Validación completa en el servidor.
// Variables de entorno: RESEND_API_KEY, RESERVAS_EMAIL_TO, RESERVAS_EMAIL_FROM, SEND_CLIENT_COPY

const MAX_FILES = 3;
const MAX_FILE_BYTES = 1.5 * 1024 * 1024; // tras la compresión del navegador
const LIMITS = { nombre: 100, telefono: 20, email: 120, zona: 60, estilo: 60, tamano: 60, idea: 2000, fecha: 10, horario: 40, presupuesto: 40 };

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);

function validate(b) {
  const d = {}; for (const [k, max] of Object.entries(LIMITS)) d[k] = clean(b[k], max);
  const errors = [];
  if (d.nombre.length < 3) errors.push("nombre");
  if (!/^\+?[\d\s().-]{9,20}$/.test(d.telefono)) errors.push("teléfono");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) errors.push("correo");
  if (!d.zona) errors.push("zona");
  if (!d.estilo) errors.push("estilo");
  if (!d.tamano) errors.push("tamaño");
  if (d.idea.length < 15) errors.push("descripción");
  if (d.fecha && !/^\d{4}-\d{2}-\d{2}$/.test(d.fecha)) errors.push("fecha");
  if (b.privacidad !== true) errors.push("aceptación de la privacidad");

  const files = Array.isArray(b.referencias) ? b.referencias.slice(0, MAX_FILES) : [];
  const attachments = [];
  for (const [i, f] of files.entries()) {
    if (!f || typeof f.data !== "string" || !/^image\/(jpeg|png|webp)$/.test(f.type || "")) { errors.push(`imagen ${i + 1}`); continue; }
    const bytes = Math.floor(f.data.length * 3 / 4);
    if (bytes > MAX_FILE_BYTES || !/^[A-Za-z0-9+/=]+$/.test(f.data)) { errors.push(`imagen ${i + 1}`); continue; }
    attachments.push({ filename: `referencia-${i + 1}.${f.type.split("/")[1].replace("jpeg", "jpg")}`, content: f.data });
  }
  return { d, attachments, errors };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ ok: false, error: "Método no permitido." }); }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== "object") return res.status(400).json({ ok: false, error: "Solicitud no válida." });

  // Antispam: campo trampa relleno o envío en menos de 3 s → se acepta en silencio sin enviar nada
  if (body.web || (typeof body.elapsed === "number" && body.elapsed < 3000)) return res.status(200).json({ ok: true });

  const { d, attachments, errors } = validate(body);
  if (errors.length) return res.status(422).json({ ok: false, error: "Revisa estos campos: " + errors.join(", ") + "." });

  const { RESEND_API_KEY, RESERVAS_EMAIL_TO, RESERVAS_EMAIL_FROM, SEND_CLIENT_COPY } = process.env;
  if (!RESEND_API_KEY || !RESERVAS_EMAIL_TO || !RESERVAS_EMAIL_FROM) {
    console.error("[reserva] Faltan variables de entorno RESEND_API_KEY / RESERVAS_EMAIL_TO / RESERVAS_EMAIL_FROM");
    return res.status(503).json({ ok: false, error: "El formulario online todavía no está activado." });
  }

  const fecha = d.fecha ? new Date(d.fecha + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Sin preferencia";
  const rows = [
    ["Nombre", d.nombre], ["Teléfono / WhatsApp", d.telefono], ["Correo", d.email],
    ["Zona", d.zona], ["Estilo", d.estilo], ["Tamaño", d.tamano],
    ["Fecha preferida", fecha], ["Horario", d.horario || "Indiferente"], ["Presupuesto", d.presupuesto || "Sin indicar"],
    ["Referencias", attachments.length ? `${attachments.length} imagen(es) adjunta(s)` : "Ninguna"],
  ];
  const phoneDigits = d.telefono.replace(/[^\d+]/g, "").replace(/^\+/, "");
  const waLink = "https://wa.me/" + (phoneDigits.length === 9 ? "34" + phoneDigits : phoneDigits);
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;color:#111">
<h2 style="margin:0 0 4px">Nueva solicitud de cita</h2>
<p style="margin:0 0 18px;color:#b3261e"><strong>Pendiente de confirmar por el estudio.</strong> El cliente sabe que aún no tiene cita.</p>
<table style="border-collapse:collapse;width:100%">${rows.map(([k, v]) => `<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;width:170px">${k}</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${esc(v)}</strong></td></tr>`).join("")}</table>
<h3 style="margin:22px 0 6px">Idea</h3><p style="white-space:pre-wrap;margin:0">${esc(d.idea)}</p>
<p style="margin-top:22px"><a href="${waLink}">Responder por WhatsApp</a> · <a href="tel:${esc(d.telefono.replace(/\s/g, ""))}">Llamar</a> · Responde a este correo para escribir al cliente.</p></div>`;

  const send = payload => fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });

  try {
    const r = await send({
      from: RESERVAS_EMAIL_FROM, to: RESERVAS_EMAIL_TO.split(",").map(s => s.trim()), reply_to: d.email,
      subject: `Solicitud de cita · ${d.nombre} · ${d.estilo} · ${d.zona}`, html, attachments,
    });
    if (!r.ok) { console.error("[reserva] Resend", r.status, await r.text()); throw new Error("envío"); }

    if (SEND_CLIENT_COPY === "true") {
      await send({
        from: RESERVAS_EMAIL_FROM, to: [d.email], subject: "Hemos recibido tu solicitud · TORA TORA TATTOO",
        html: `<div style="font-family:Arial,sans-serif;max-width:560px"><p>Hola ${esc(d.nombre.split(" ")[0])},</p><p>Hemos recibido tu solicitud de cita. <strong>Todavía no está confirmada</strong>: el estudio revisará tu idea y te contactará para concretar diseño, presupuesto y fecha.</p><p>TORA TORA TATTOO</p></div>`,
      }).catch(e => console.error("[reserva] copia cliente", e));
    }
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ ok: false, error: "El servidor de correo no ha respondido." });
  }
}
