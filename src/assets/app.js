/* TORA TORA TATTOO — comportamiento de la web (sin dependencias) */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  let SITE = {};
  try { SITE = JSON.parse($("#site-data")?.textContent || "{}"); } catch { SITE = {}; }

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } },
  };

  /* ---------- Menú móvil ---------- */
  const menuBtn = $(".menu-btn"), links = $("#nav-links");
  if (menuBtn && links) {
    const close = () => { links.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); };
    menuBtn.addEventListener("click", () => {
      const open = !links.classList.contains("open");
      links.classList.toggle("open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", e => { if (e.target.closest("a")) close(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  }

  /* ---------- Consentimiento de cookies ----------
     Técnicas: siempre. Terceros (Google Maps embebido, Google Analytics): solo con consentimiento. */
  const CONSENT_KEY = "tt-consent-v1";
  const consent = () => store.get(CONSENT_KEY); // "all" | "essential" | null
  const banner = $("#cookie");
  const applyConsent = () => {
    if (consent() === "all") { loadAnalytics(); $$("[data-map]").forEach(loadMap); }
  };
  const showBanner = () => { if (banner) banner.hidden = false; };
  if (banner) {
    if (!consent()) showBanner();
    banner.addEventListener("click", e => {
      const b = e.target.closest("[data-consent]");
      if (!b) return;
      store.set(CONSENT_KEY, b.dataset.consent);
      banner.hidden = true;
      applyConsent();
    });
  }
  $$("[data-open-cookies]").forEach(b => b.addEventListener("click", showBanner));

  function loadAnalytics() {
    const id = SITE.gaId;
    if (!id || window.__ga) return;
    window.__ga = true;
    const s = document.createElement("script");
    s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date()); window.gtag("config", id, { anonymize_ip: true });
  }

  /* ---------- Mapa (carga bajo demanda) ---------- */
  function loadMap(box) {
    if (!box || box.dataset.loaded) return;
    box.dataset.loaded = "1";
    const f = document.createElement("iframe");
    f.title = "Mapa de la ubicación de TORA TORA TATTOO";
    f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade";
    f.src = "https://www.google.com/maps?q=" + encodeURIComponent(box.dataset.map) + "&output=embed";
    const ph = $(".map-placeholder", box); if (ph) ph.remove();
    box.appendChild(f);
  }
  $$("[data-load-map]").forEach(b => b.addEventListener("click", () => loadMap(b.closest("[data-map]"))));

  applyConsent();

  /* ---------- Portfolio: filtros + vista ampliada ---------- */
  const gallery = $("#gallery");
  if (gallery) {
    const tiles = $$(".tile", gallery);
    const filters = $$(".filter");
    const setFilter = id => {
      filters.forEach(f => f.setAttribute("aria-pressed", String(f.dataset.filter === id)));
      tiles.forEach(t => { t.hidden = !(id === "all" || t.dataset.style === id); });
      const st = $("#gallery-status"); if (st) st.textContent = visible().length + " trabajos";
    };
    const visible = () => tiles.filter(t => !t.hidden);
    filters.forEach(f => f.addEventListener("click", () => setFilter(f.dataset.filter)));
    const fromHash = (location.hash || "").slice(1);
    if (fromHash && filters.some(f => f.dataset.filter === fromHash)) setFilter(fromHash);

    const lb = $("#lightbox"), lbImg = $("#lb-img"), lbCap = $("#lb-cap"), lbCount = $("#lb-count");
    let idx = 0, lastFocus = null;
    const show = i => {
      const list = visible(); if (!list.length) return;
      idx = (i + list.length) % list.length;
      const t = list[idx], img = $("img", t);
      lbImg.src = t.dataset.full; lbImg.alt = img.alt;
      lbCap.textContent = img.alt;
      lbCount.textContent = String(idx + 1).padStart(2, "0") + " / " + String(list.length).padStart(2, "0");
    };
    const open = t => { lastFocus = document.activeElement; show(visible().indexOf(t)); lb.hidden = false; document.body.style.overflow = "hidden"; $(".lb-close", lb).focus(); };
    const close = () => { lb.hidden = true; document.body.style.overflow = ""; lastFocus?.focus(); };
    tiles.forEach(t => $("button", t).addEventListener("click", () => open(t)));
    $(".lb-close", lb).addEventListener("click", close);
    $(".lb-prev", lb).addEventListener("click", () => show(idx - 1));
    $(".lb-next", lb).addEventListener("click", () => show(idx + 1));
    lb.addEventListener("click", e => { if (e.target === lb || e.target.classList.contains("lb-stage")) close(); });
    document.addEventListener("keydown", e => {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
      if (e.key === "Tab") { // mantener el foco dentro
        const f = $$("button", lb); const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    let sx = null;
    lb.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); sx = null; });
  }

  /* ---------- Formulario de solicitud de cita ---------- */
  const form = $("#booking-form");
  if (form) {
    const startedAt = Date.now();
    const MAX_FILES = 3;
    const files = []; // { name, type, data(base64), url }
    const fileInput = $("#f-ref"), thumbs = $("#thumbs"), drop = $("#drop");
    const dateInput = $("#f-fecha");

    // Fecha mínima: mañana
    if (dateInput) {
      const t = new Date(); t.setDate(t.getDate() + 1);
      dateInput.min = t.toISOString().slice(0, 10);
    }

    const setErr = (name, msg) => {
      const field = form.querySelector(`[data-field="${name}"]`);
      if (!field) return;
      field.classList.toggle("invalid", !!msg);
      const e = $(".err", field); if (e) e.textContent = msg || "";
      const inp = $(".input, input", field); if (inp) inp.setAttribute("aria-invalid", msg ? "true" : "false");
    };

    const val = n => (form.elements[n]?.value || "").trim();
    const rules = {
      nombre: () => val("nombre").length < 3 ? "Escribe tu nombre y apellidos." : "",
      telefono: () => /^\+?[\d\s().-]{9,20}$/.test(val("telefono")) ? "" : "Escribe un teléfono válido (mínimo 9 cifras).",
      email: () => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val("email")) ? "" : "Escribe un correo válido, por ejemplo nombre@correo.com.",
      zona: () => val("zona") ? "" : "Elige la zona del cuerpo.",
      estilo: () => val("estilo") ? "" : "Elige un estilo (o «No lo sé»).",
      tamano: () => form.querySelector('input[name="tamano"]:checked') ? "" : "Elige un tamaño aproximado.",
      idea: () => val("idea").length < 15 ? "Cuéntanos un poco más de tu idea (mínimo 15 caracteres)." : "",
      fecha: () => {
        const v = val("fecha"); if (!v) return "";
        const d = new Date(v + "T12:00:00");
        if (dateInput.min && v < dateInput.min) return "Elige una fecha a partir de mañana.";
        if (d.getDay() === 0) return "El estudio cierra los domingos. Elige otro día.";
        return "";
      },
      privacidad: () => form.elements.privacidad.checked ? "" : "Necesitamos tu aceptación para poder responderte.",
    };
    const validate = () => {
      let first = null;
      Object.entries(rules).forEach(([k, fn]) => { const m = fn(); setErr(k, m); if (m && !first) first = k; });
      return first;
    };
    Object.keys(rules).forEach(k => {
      const els = form.querySelectorAll(`[name="${k}"]`);
      els.forEach(el => el.addEventListener(el.type === "checkbox" || el.type === "radio" || el.tagName === "SELECT" ? "change" : "blur", () => setErr(k, rules[k]())));
    });

    // Imágenes de referencia: se reducen en el navegador antes de enviar
    const compress = file => new Promise((resolve, reject) => {
      if (!/^image\//.test(file.type)) return reject(new Error("tipo"));
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const max = 1600, s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        const data = c.toDataURL("image/jpeg", .82);
        URL.revokeObjectURL(url);
        resolve({ name: file.name.replace(/\.[^.]+$/, "") + ".jpg", type: "image/jpeg", data: data.split(",")[1], url: data });
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("lectura")); };
      img.src = url;
    });
    const renderThumbs = () => {
      thumbs.innerHTML = "";
      files.forEach((f, i) => {
        const fig = document.createElement("figure");
        fig.innerHTML = `<img alt="Referencia ${i + 1}"><button type="button" aria-label="Quitar referencia ${i + 1}">×</button>`;
        fig.querySelector("img").src = f.url;
        fig.querySelector("button").addEventListener("click", () => { files.splice(i, 1); renderThumbs(); });
        thumbs.appendChild(fig);
      });
    };
    const addFiles = async list => {
      setErr("ref", "");
      for (const file of Array.from(list)) {
        if (files.length >= MAX_FILES) { setErr("ref", `Máximo ${MAX_FILES} imágenes.`); break; }
        if (file.size > 15 * 1024 * 1024) { setErr("ref", "Una imagen supera 15 MB. Prueba con otra."); continue; }
        try { files.push(await compress(file)); }
        catch { setErr("ref", "Solo se admiten imágenes (JPG, PNG, WEBP, HEIC compatible)."); }
      }
      renderThumbs(); fileInput.value = "";
    };
    fileInput?.addEventListener("change", () => addFiles(fileInput.files));
    if (drop) {
      ["dragenter", "dragover"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("drag"); }));
      ["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("drag"); }));
      drop.addEventListener("drop", e => addFiles(e.dataTransfer.files));
    }

    const status = $("#form-status"), submit = $("#submit-btn");
    const submitLabel = submit.innerHTML;
    form.addEventListener("submit", async e => {
      e.preventDefault();
      status.hidden = true;
      const bad = validate();
      if (bad) {
        const el = form.querySelector(`[name="${bad}"]`);
        el?.focus(); el?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      const payload = {
        nombre: val("nombre"), telefono: val("telefono"), email: val("email"),
        zona: val("zona"), estilo: val("estilo"),
        tamano: form.querySelector('input[name="tamano"]:checked')?.value || "",
        idea: val("idea"), fecha: val("fecha"), horario: val("horario"), presupuesto: val("presupuesto"),
        privacidad: true, web: val("web"), elapsed: Date.now() - startedAt,
        referencias: files.map(({ name, type, data }) => ({ name, type, data })),
      };
      submit.disabled = true;
      submit.innerHTML = '<span class="spinner" aria-hidden="true"></span> Enviando solicitud…';
      try {
        const res = await fetch(SITE.apiBooking || "/api/reserva", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        let data = {}; try { data = await res.json(); } catch { /* sin cuerpo */ }
        if (!res.ok || !data.ok) throw new Error(data.error || "No se ha podido enviar la solicitud.");
        showSuccess(payload);
      } catch (err) {
        status.hidden = false; status.className = "notice error";
        status.innerHTML = `<strong>No se ha enviado la solicitud.</strong><span></span><span>Tus datos siguen en el formulario. Inténtalo de nuevo en unos minutos o llama al estudio: <a href="tel:+34${SITE.phone}">${SITE.phoneDisplay}</a>.</span>`;
        status.querySelector("span").textContent = err.message === "Failed to fetch" ? "No hay conexión con el servidor." : err.message;
        status.scrollIntoView({ behavior: "smooth", block: "center" });
      } finally {
        submit.disabled = false; submit.innerHTML = submitLabel;
      }
    });

    function showSuccess(p) {
      const box = $("#booking-success");
      $("#s-name").textContent = p.nombre.split(" ")[0];
      $("#s-contact").textContent = p.telefono + " / " + p.email;
      form.hidden = true; box.hidden = false;
      box.scrollIntoView({ behavior: "smooth", block: "start" });
      $("h2", box).focus();
      try { window.gtag?.("event", "generate_lead", { method: "formulario_reserva" }); } catch { /* */ }
    }
  }

  /* ---------- Reseñas reales de Google ---------- */
  const gBox = $("#google-reviews");
  if (gBox && gBox.dataset.src) {
    const h = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const stars = n => { const r = Math.round(n || 0); return "★".repeat(r) + "☆".repeat(5 - r); };
    const safeUrl = u => /^https:\/\//.test(u || "") ? u : "";
    fetch(gBox.dataset.src).then(r => r.ok ? r.json() : null).then(d => {
      if (!d || !d.ok || !d.rating) return; // sin datos: se queda el bloque de respaldo
      const list = d.reviews.filter(v => v.text);
      const more = safeUrl(d.url);
      gBox.innerHTML = `
        <div class="g-summary">
          <span class="score">${Number(d.rating).toFixed(1).replace(".", ",")}</span>
          <span><span class="stars" aria-label="${d.rating} de 5 estrellas">${stars(d.rating)}</span><br>
          <span class="count">${d.total} reseñas en Google</span></span>
          <span class="by">Reseñas de Google</span>
        </div>
        ${list.length ? `<div class="reviews">${list.map(v => `
          <figure class="review">
            <figcaption class="review-head" style="text-transform:none;letter-spacing:0">
              ${safeUrl(v.photo) ? `<img src="${h(v.photo)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<span class="av" aria-hidden="true">${h(v.author.charAt(0))}</span>`}
              <span>${safeUrl(v.authorUrl) ? `<a href="${h(v.authorUrl)}" target="_blank" rel="noopener">${h(v.author)}</a>` : h(v.author)}<small>${h(v.when)}</small></span>
            </figcaption>
            <div class="stars" aria-label="${v.rating} de 5">${stars(v.rating)}</div>
            <blockquote>${h(v.text)}</blockquote>
          </figure>`).join("")}</div>` : ""}
        <p style="margin-top:24px;display:flex;flex-wrap:wrap;gap:12px">
          ${more ? `<a class="btn" href="${h(more)}" target="_blank" rel="noopener">Ver las ${d.total} reseñas</a>` : ""}
          ${safeUrl(d.writeUrl) ? `<a class="btn" href="${h(d.writeUrl)}" target="_blank" rel="noopener">Escribir una reseña</a>` : ""}
        </p>`;
    }).catch(() => { /* se queda el respaldo */ });
  }

  /* ---------- Pago de señal (solo si el estudio lo activa) ---------- */
  const payBtn = $("#pay-deposit");
  if (payBtn) {
    payBtn.addEventListener("click", async () => {
      const msg = $("#pay-status");
      payBtn.disabled = true; msg.hidden = true;
      try {
        const res = await fetch("/api/senal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref: new URLSearchParams(location.search).get("ref") || "" }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) throw new Error(data.error || "El pago online no está disponible ahora mismo.");
        location.href = data.url;
      } catch (err) {
        msg.hidden = false; msg.textContent = err.message + " Contacta con el estudio para abonar la señal.";
        payBtn.disabled = false;
      }
    });
  }
})();
