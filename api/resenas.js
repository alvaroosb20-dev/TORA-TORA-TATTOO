// GET /api/resenas — reseñas REALES del estudio desde Google (Places API New).
// Variables de entorno: GOOGLE_PLACES_API_KEY (obligatoria), GOOGLE_PLACE_ID (opcional:
// si falta, se busca el estudio por nombre y dirección).
// Google devuelve la nota media, el total de reseñas y hasta 5 reseñas "más relevantes".
// No se filtran ni se editan: se muestran tal cual, con su autor y enlace a Google.

const QUERY = "TORA TORA TATTOO, C/ Editor Manuel Aguilar 2, Valencia";
let cachedPlaceId = null;

export default async function handler(req, res) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).json({ ok: false }); }
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return res.status(503).json({ ok: false, error: "Reseñas de Google no configuradas." });

  try {
    let placeId = process.env.GOOGLE_PLACE_ID || cachedPlaceId;
    if (!placeId) {
      const s = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.id,places.displayName" },
        body: JSON.stringify({ textQuery: QUERY, languageCode: "es", regionCode: "ES" }),
      });
      const sd = await s.json();
      placeId = sd.places?.[0]?.id;
      if (!s.ok || !placeId) { console.error("[resenas] búsqueda", s.status, JSON.stringify(sd).slice(0, 300)); throw new Error("no encontrado"); }
      cachedPlaceId = placeId;
      console.log("[resenas] Place ID encontrado:", placeId, "(guárdalo en GOOGLE_PLACE_ID)");
    }

    const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=es`, {
      headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "displayName,rating,userRatingCount,reviews,googleMapsUri,googleMapsLinks" },
    });
    const p = await r.json();
    if (!r.ok) { console.error("[resenas] detalle", r.status, JSON.stringify(p).slice(0, 300)); throw new Error("detalle"); }

    const data = {
      ok: true,
      name: p.displayName?.text || "",
      rating: p.rating ?? null,
      total: p.userRatingCount ?? 0,
      url: p.googleMapsLinks?.reviewsUri || p.googleMapsUri || "",
      writeUrl: p.googleMapsLinks?.writeAReviewUri || "",
      reviews: (p.reviews || []).map(v => ({
        rating: v.rating,
        text: v.text?.text || v.originalText?.text || "",
        when: v.relativePublishTimeDescription || "",
        author: v.authorAttribution?.displayName || "Usuario de Google",
        authorUrl: v.authorAttribution?.uri || "",
        photo: v.authorAttribution?.photoUri || "",
        link: v.googleMapsUri || "",
      })),
    };
    // Caché corta en la CDN de Vercel: pocas llamadas a Google y datos siempre recientes.
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=600");
    return res.status(200).json(data);
  } catch {
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ ok: false, error: "Google no ha respondido." });
  }
}
