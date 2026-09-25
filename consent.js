/*!
 * consent.js — Bandeau de consentement cookies pour goligbaka.fr
 * GOLI Gore Gbaka — sans dépendance, conforme aux recommandations CNIL :
 *   - rien de non essentiel n'est chargé avant le choix du visiteur
 *   - « Tout refuser » aussi visible que « Tout accepter »
 *   - choix modifiable à tout moment, consentement redemandé après 6 mois
 *
 * Installation : une seule ligne avant </body> sur CHAQUE page
 *   <script src="consent.js" defer></script>
 * (le bandeau et la fenêtre de préférences sont créés automatiquement)
 */
(() => {
  "use strict";
 
  /* ================== CONFIGURATION ================== */
  const CONFIG = {
    storageKey: "goli_consent_v2",           // passer à v3 si les catégories changent
    durationMs: 6 * 30 * 24 * 3600 * 1000,   // ~6 mois
    gtmId: "GTM-5L47N78Z",                   // Google Tag Manager
    policyUrl: "mentions-legales.html",      // page qui décrit les cookies
  };
 
  const CATEGORIES = {
    analytics: {
      label: "Mesure d’audience",
      desc: "Google Analytics (via Google Tag Manager) : nombre de visites, pages vues. Données anonymisées, conservées 13 mois maximum.",
    },
    media: {
      label: "Contenus tiers",
      desc: "Vidéos YouTube intégrées. YouTube peut déposer des cookies lorsque la vidéo est chargée.",
    },
  };
  const KEYS = Object.keys(CATEGORIES);
 
  /* ================== STOCKAGE ================== */
  function read() {
    try {
      const c = JSON.parse(localStorage.getItem(CONFIG.storageKey));
      if (!c || Date.now() > c.expires) return null;
      return c;
    } catch { return null; }
  }
 
  function save(choices) {
    const previous = read();
    const consent = {
      ...choices,
      date: new Date().toISOString(),
      expires: Date.now() + CONFIG.durationMs,
    };
    try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(consent)); } catch {}
    try { localStorage.removeItem("consent_v1"); } catch {}   // ancienne version
 
    hideBanner();
 
    // Retrait d'un consentement déjà donné : on nettoie puis on recharge,
    // car un script déjà exécuté ne peut pas être « déchargé ».
    const withdrawn = previous && KEYS.some(k => previous[k] && !consent[k]);
    if (withdrawn) {
      if (!consent.analytics) deleteAnalyticsCookies();
      location.reload();
      return;
    }
    apply(consent);
  }
 
  /* ================== ACTIVATION DES SERVICES ================== */
  let gtmLoaded = false;
  function loadGTM() {
    if (gtmLoaded || !CONFIG.gtmId) return;
    gtmLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtm.js?id=" + CONFIG.gtmId;
    document.head.appendChild(s);
  }
 
  // Scripts bloqués écrits ainsi : <script type="text/plain" data-consent="analytics">…</script>
  function activateScripts(category) {
    document.querySelectorAll(`script[type="text/plain"][data-consent="${category}"]`)
      .forEach(inactive => {
        const s = document.createElement("script");
        for (const { name, value } of inactive.attributes) {
          if (name !== "type") s.setAttribute(name, value);
        }
        s.textContent = inactive.textContent;
        inactive.replaceWith(s);
      });
  }
 
  // Vidéos : <div class="yt-consent" data-yt-id="dr_g23qi9hg" data-title="Vidéo 1"></div>
  function youtubeIframe(id, title) {
    const f = document.createElement("iframe");
    f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=0`;
    f.title = title || "Vidéo YouTube";
    f.allow = "accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    f.referrerPolicy = "strict-origin-when-cross-origin";
    f.allowFullscreen = true;
    f.loading = "lazy";
    f.className = "gc-yt-frame";
    return f;
  }
 
  function loadVideo(box) {
    if (box.dataset.loaded) return;
    box.dataset.loaded = "1";
    box.replaceChildren(youtubeIframe(box.dataset.ytId, box.dataset.title));
    box.classList.add("is-loaded");
  }
 
  function prepareVideos(mediaAllowed) {
    document.querySelectorAll(".yt-consent[data-yt-id]").forEach((box, i) => {
      if (mediaAllowed) return loadVideo(box);
      if (box.dataset.ready) return;
      box.dataset.ready = "1";
      const title = box.dataset.title || `Vidéo ${i + 1}`;
      const thumb = `https://i.ytimg.com/vi/${encodeURIComponent(box.dataset.ytId)}/hqdefault.jpg`;
      box.innerHTML = `
        <div class="gc-yt-placeholder">
          <button type="button" class="gc-yt-play" aria-label="Lire ${escapeHtml(title)}">
            <span aria-hidden="true">▶</span>
          </button>
          <p class="gc-yt-note">
            ${escapeHtml(title)} — en lançant la vidéo, vous acceptez les cookies de YouTube.
            <button type="button" class="gc-link" data-gc="allow-media">Toujours autoriser les vidéos</button>
          </p>
        </div>`;
      // La miniature est servie par i.ytimg.com (sans cookie) ; on la retire si on préfère 0 requête Google
      box.style.setProperty("--gc-thumb", `url("${thumb}")`);
      box.querySelector(".gc-yt-play").addEventListener("click", () => loadVideo(box));
    });
  }
 
  // Iframes génériques (cartes…) : <iframe data-consent="media" data-src="https://…"></iframe>
  function activateIframes(category) {
    document.querySelectorAll(`iframe[data-consent="${category}"][data-src]`)
      .forEach(f => { f.src = f.dataset.src; f.removeAttribute("data-src"); });
  }
 
  function apply(consent) {
    if (consent.analytics) { loadGTM(); activateScripts("analytics"); }
    if (consent.media) { activateScripts("media"); activateIframes("media"); }
    prepareVideos(Boolean(consent.media));
    document.dispatchEvent(new CustomEvent("goli:consent", { detail: consent }));
  }
 
  function deleteAnalyticsCookies() {
    const host = location.hostname.replace(/^www\./, "");
    const domains = ["", host, "." + host, "www." + host];
    document.cookie.split(";").map(c => c.split("=")[0].trim())
      .filter(n => /^(_ga|_gid|_gat|_gcl)/.test(n))
      .forEach(n => domains.forEach(d => {
        document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/` + (d ? `; domain=${d}` : "");
      }));
  }
 
  /* ================== INTERFACE ================== */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }
 
  let banner, dialog;
 
  function buildUI() {
    banner = document.createElement("section");
    banner.className = "gc-banner";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-labelledby", "gc-banner-title");
    banner.hidden = true;
    banner.innerHTML = `
      <div class="gc-inner">
        <div class="gc-text">
          <h2 id="gc-banner-title">Vos choix sur les cookies</h2>
          <p>
            Avec votre accord, nous utilisons des cookies pour mesurer l’audience du site
            et afficher les vidéos YouTube. Vous pouvez accepter, refuser ou choisir
            service par service, et changer d’avis à tout moment via « Gérer mes cookies »
            en bas de page. <a href="${CONFIG.policyUrl}">En savoir plus</a>
          </p>
        </div>
        <div class="gc-actions">
          <button type="button" class="gc-btn" data-gc="reject">Tout refuser</button>
          <button type="button" class="gc-btn gc-btn-ghost" data-gc="customize">Personnaliser</button>
          <button type="button" class="gc-btn" data-gc="accept">Tout accepter</button>
        </div>
      </div>`;
 
    dialog = document.createElement("dialog");
    dialog.className = "gc-dialog";
    dialog.setAttribute("aria-labelledby", "gc-dialog-title");
    dialog.innerHTML = `
      <h2 id="gc-dialog-title">Préférences de cookies</h2>
      <p>Choisissez les services que vous autorisez. Vous pourrez modifier ce choix à tout moment.</p>
      <div class="gc-cat">
        <div><strong>Essentiels</strong><span>Mémorisation de vos choix de cookies. Toujours actifs.</span></div>
        <span class="gc-always">Toujours actif</span>
      </div>
      ${KEYS.map(k => `
        <label class="gc-cat" for="gc-${k}">
          <div><strong>${CATEGORIES[k].label}</strong><span>${CATEGORIES[k].desc}</span></div>
          <span class="gc-switch">
            <input type="checkbox" id="gc-${k}" data-category="${k}">
            <span class="gc-slider" aria-hidden="true"></span>
          </span>
        </label>`).join("")}
      <div class="gc-dialog-actions">
        <button type="button" class="gc-btn gc-btn-ghost" data-gc="reject">Tout refuser</button>
        <button type="button" class="gc-btn gc-btn-ghost" data-gc="accept">Tout accepter</button>
        <button type="button" class="gc-btn" data-gc="save">Enregistrer mes choix</button>
      </div>`;
 
    document.body.append(banner, dialog);
  }
 
  function showBanner() { banner.hidden = false; }
  function hideBanner() { if (banner) banner.hidden = true; }
 
  function openPreferences() {
    const current = read() || {};
    dialog.querySelectorAll("[data-category]").forEach(i => { i.checked = Boolean(current[i.dataset.category]); });
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }
  function closeDialog() {
    if (dialog.open) { typeof dialog.close === "function" ? dialog.close() : dialog.removeAttribute("open"); }
  }
 
  const all = v => Object.fromEntries(KEYS.map(k => [k, v]));
 
  function onClick(e) {
    const opener = e.target.closest("#open-preferences, [data-consent-open]");
    if (opener) { e.preventDefault(); openPreferences(); return; }
 
    const action = e.target.closest("[data-gc]")?.dataset.gc;
    if (!action) return;
    if (action === "accept") { closeDialog(); save(all(true)); }
    if (action === "reject") { closeDialog(); save(all(false)); }
    if (action === "customize") openPreferences();
    if (action === "save") {
      const choices = {};
      dialog.querySelectorAll("[data-category]").forEach(i => { choices[i.dataset.category] = i.checked; });
      closeDialog();
      save(choices);
    }
    if (action === "allow-media") save({ ...(read() || all(false)), media: true });
  }
 
  /* ================== DÉMARRAGE ================== */
  function init() {
    buildUI();
    document.addEventListener("click", onClick);
    const existing = read();
    if (existing) apply(existing);
    else { prepareVideos(false); showBanner(); }
  }
 
  // API publique (ex. lien personnalisé : onclick="goliConsent.open()")
  window.goliConsent = { open: () => openPreferences(), get: read };
 
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
 
 
