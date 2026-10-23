// POST /api/senal — crea un pago de señal en Stripe Checkout.
// Solo funciona si el estudio ha configurado STRIPE_SECRET_KEY y DEPOSIT_AMOUNT_EUR.
// El importe se lee del servidor, nunca del navegador.

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Método no permitido." }); }

  const { STRIPE_SECRET_KEY, DEPOSIT_AMOUNT_EUR, SITE_URL } = process.env;
  const amount = Math.round(Number(DEPOSIT_AMOUNT_EUR) * 100);
  if (!STRIPE_SECRET_KEY || !amount || amount < 100 || !SITE_URL) {
    return res.status(503).json({ error: "El pago online de la señal no está activado." });
  }

  let ref = "";
  try { ref = String((typeof req.body === "string" ? JSON.parse(req.body) : req.body)?.ref || "").replace(/[^\w-]/g, "").slice(0, 40); } catch { /* sin referencia */ }

  const form = new URLSearchParams({
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": String(amount),
    "line_items[0][price_data][product_data][name]": "Señal de cita · TORA TORA TATTOO",
    "line_items[0][price_data][product_data][description]": "Se descuenta del precio final del tatuaje.",
    success_url: `${SITE_URL}/senal?pago=ok`,
    cancel_url: `${SITE_URL}/senal?pago=cancelado`,
    locale: "es",
  });
  if (ref) form.set("client_reference_id", ref);

  try {
    const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST", headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" }, body: form,
    });
    const data = await r.json();
    if (!r.ok || !data.url) { console.error("[senal] Stripe", r.status, data?.error?.message); throw new Error(); }
    return res.status(200).json({ url: data.url });
  } catch {
    return res.status(502).json({ error: "No se ha podido iniciar el pago." });
  }
}
