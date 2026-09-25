/*!
 * Bandeau de consentement cookies — goligbaka.fr (GOLI Gore Gbaka)
 * Conforme aux recommandations CNIL :
 *  - "Tout refuser" aussi visible et facile que "Tout accepter"
 *  - aucune case pré-cochée, aucun cookie non essentiel avant consentement
 *  - choix conservé 6 mois, puis nouvelle demande
 *  - retrait du consentement possible à tout moment (lien "Gérer les cookies")
 *
 * Installation : <script src="/cookie-consent.js" defer></script> avant </body>
 *
 * Bloquer un script tant que l'utilisateur n'a pas accepté sa catégorie :
 *   <script type="text/plain" data-cookie-category="audience" src="https://..."></script>
 *   <script type="text/plain" data-cookie-category="audience"> ... code inline ... </script>
 * Bloquer une iframe (YouTube, carte, etc.) :
 *   <iframe data-cookie-category="externe" data-src="https://www.youtube-nocookie.com/embed/..."></iframe>
 *
 * Lien pour rouvrir le panneau (à mettre dans le pied de page) :
 *   <a href="#" data-cookie-manage>Gérer les cookies</a>
 */
(function () {
  "use strict";
 
  /* ========= CONFIGURATION ========= */
  var CONFIG = {
    siteName: "goligbaka.fr",
    storageKey: "goligbaka_consent",
    version: 1,                              // incrémenter si les catégories changent → redemande le consentement
    maxAgeDays: 182,                         // 6 mois (recommandation CNIL)
    privacyUrl: "/mentions-legales.html#cookies", // page mentions légales, rubrique Cookies
    accent: "#212529",                       // couleur principale du site (à adapter)
    categories: [
      {
        id: "essentiels",
        label: "Essentiels",
        description: "Nécessaires au fonctionnement du site (mémorisation de votre choix de cookies). Ils ne peuvent pas être désactivés.",
        required: true
      },
      {
        id: "audience",
        label: "Mesure d'audience",
        description: "Statistiques de fréquentation pour améliorer le site (Google Tag Manager / Google Analytics)."
      },
      {
        id: "externe",
        label: "Contenus externes",
        description: "Vidéos YouTube intégrées, qui peuvent déposer des cookies Google."
      },
      {
        id: "publicite",
        label: "Publicité",
        description: "Annonces Google AdSense, qui peuvent être personnalisées selon votre navigation."
      }
    ]
  };
 
  /* ========= STOCKAGE ========= */
  function readConsent() {
    try {
      var raw = localStorage.getItem(CONFIG.storageKey);
      if (!raw) return null;
      var data = JSON.parse(raw);
      var expired = Date.now() - data.date > CONFIG.maxAgeDays * 864e5;
      if (expired || data.version !== CONFIG.version) return null;
      return data;
    } catch (e) { return null; }
  }
 
  function saveConsent(choices) {
    var data = { version: CONFIG.version, date: Date.now(), choices: choices };
    try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(data)); } catch (e) {}
    return data;
  }
 
  /* ========= ACTIVATION DES SCRIPTS / IFRAMES ========= */
  function applyConsent(choices) {
    document.querySelectorAll('script[type="text/plain"][data-cookie-category]').forEach(function (old) {
      if (!choices[old.getAttribute("data-cookie-category")]) return;
      var s = document.createElement("script");
      for (var i = 0; i < old.attributes.length; i++) {
        var a = old.attributes[i];
        if (a.name !== "type" && a.name !== "data-cookie-category") s.setAttribute(a.name, a.value);
      }
      s.text = old.text;
      old.parentNode.replaceChild(s, old);
    });
    document.querySelectorAll("iframe[data-cookie-category][data-src]").forEach(function (f) {
      if (choices[f.getAttribute("data-cookie-category")] && !f.src) f.src = f.getAttribute("data-src");
    });
    document.dispatchEvent(new CustomEvent("cookieconsent:update", { detail: choices }));
  }
 
  /* ========= STYLES ========= */
  var css = [
    ".cc-wrap{position:fixed;left:16px;right:16px;bottom:16px;z-index:99999;font:15px/1.5 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#1c1917;display:flex;justify-content:center}",
    ".cc-box{background:#fff;max-width:720px;width:100%;border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,.18);padding:22px 24px;border-top:4px solid " + CONFIG.accent + "}",
    ".cc-box h2{margin:0 0 6px;font-size:17px}",
    ".cc-box p{margin:0 0 14px;color:#44403c}",
    ".cc-box a{color:" + CONFIG.accent + "}",
    ".cc-btns{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}",
    "@media (max-width:520px){.cc-btns{grid-template-columns:1fr}}",
    ".cc-btn{cursor:pointer;border-radius:8px;padding:10px 14px;font-family:inherit;font-weight:600;font-size:14px;line-height:1.2;border:2px solid " + CONFIG.accent + ";background:#fff;color:" + CONFIG.accent + "}",
    ".cc-btn.cc-main{background:" + CONFIG.accent + ";color:#fff}",
    ".cc-btn:focus-visible,.cc-switch input:focus-visible+span{outline:3px solid #2563eb;outline-offset:2px}",
    ".cc-link{background:none;border:0;padding:0;margin-top:12px;color:#57534e;text-decoration:underline;cursor:pointer;font:inherit;font-size:13px}",
    ".cc-list{margin:4px 0 16px;padding:0;list-style:none}",
    ".cc-item{display:flex;gap:14px;align-items:flex-start;justify-content:space-between;padding:12px 0;border-bottom:1px solid #e7e5e4}",
    ".cc-item strong{display:block}.cc-item small{color:#57534e}",
    ".cc-switch{position:relative;flex:0 0 44px;height:24px;margin-top:2px}",
    ".cc-switch input{position:absolute;opacity:0;width:100%;height:100%;margin:0;cursor:pointer}",
    ".cc-switch span{position:absolute;inset:0;background:#d6d3d1;border-radius:24px;transition:.2s;pointer-events:none}",
    ".cc-switch span:after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;background:#fff;border-radius:50%;transition:.2s}",
    ".cc-switch input:checked+span{background:" + CONFIG.accent + "}",
    ".cc-switch input:checked+span:after{transform:translateX(20px)}",
    ".cc-switch input:disabled+span{opacity:.55}",
    "@media (prefers-color-scheme:dark){.cc-box{background:#1c1917;color:#f5f5f4}.cc-box p,.cc-item small,.cc-link{color:#d6d3d1}.cc-btn{background:transparent}.cc-item{border-color:#44403c}}",
    "@media print{.cc-wrap{display:none!important}}",
    "@media (max-width:480px){.cc-wrap{left:8px;right:8px;bottom:8px}.cc-box{padding:18px}}"
  ].join("");
 
  /* ========= INTERFACE ========= */
  var wrap;
 
  function el(html) { var d = document.createElement("div"); d.innerHTML = html; return d.firstElementChild; }
 
  function close() { if (wrap) { wrap.remove(); wrap = null; } }
 
  function decide(choices) {
    choices.essentiels = true;
    saveConsent(choices);
    applyConsent(choices);
    close();
  }
 
  function allChoices(value) {
    var c = {};
    CONFIG.categories.forEach(function (cat) { c[cat.id] = cat.required ? true : value; });
    return c;
  }
 
  function showBanner() {
    close();
    wrap = el(
      '<div class="cc-wrap" role="dialog" aria-modal="false" aria-labelledby="cc-title" aria-describedby="cc-desc">' +
        '<div class="cc-box">' +
          '<h2 id="cc-title">Vos choix concernant les cookies</h2>' +
          '<p id="cc-desc">' + CONFIG.siteName + ' utilise des cookies pour mesurer l\'audience, afficher les vidéos YouTube et des publicités Google AdSense. ' +
          'Vous pouvez tout accepter, tout refuser ou choisir par catégorie. Votre choix est conservé 6 mois et modifiable à tout moment via le lien « Gérer les cookies » en bas de page. ' +
          '<a href="' + CONFIG.privacyUrl + '">En savoir plus</a></p>' +
          '<div class="cc-btns">' +
            '<button type="button" class="cc-btn cc-main" data-cc="refuse">Tout refuser</button>' +
            '<button type="button" class="cc-btn" data-cc="custom">Personnaliser</button>' +
            '<button type="button" class="cc-btn cc-main" data-cc="accept">Tout accepter</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
    wrap.addEventListener("click", function (e) {
      var a = e.target.getAttribute("data-cc");
      if (a === "accept") decide(allChoices(true));
      else if (a === "refuse") decide(allChoices(false));
      else if (a === "custom") showPanel();
    });
    document.body.appendChild(wrap);
    wrap.querySelector("[data-cc=refuse]").focus({ preventScroll: true });
  }
 
  function showPanel() {
    close();
    var current = (readConsent() || {}).choices || {};
    var items = CONFIG.categories.map(function (cat) {
      var checked = cat.required || current[cat.id] ? " checked" : "";
      var disabled = cat.required ? " disabled" : "";
      return '<li class="cc-item"><div><strong id="cc-l-' + cat.id + '">' + cat.label + '</strong><small>' + cat.description + '</small></div>' +
        '<label class="cc-switch"><input type="checkbox" data-cat="' + cat.id + '" aria-labelledby="cc-l-' + cat.id + '"' + checked + disabled + '><span></span></label></li>';
    }).join("");
 
    wrap = el(
      '<div class="cc-wrap" role="dialog" aria-modal="true" aria-labelledby="cc-title">' +
        '<div class="cc-box">' +
          '<h2 id="cc-title">Paramètres des cookies</h2>' +
          '<ul class="cc-list">' + items + '</ul>' +
          '<div class="cc-btns">' +
            '<button type="button" class="cc-btn cc-main" data-cc="refuse">Tout refuser</button>' +
            '<button type="button" class="cc-btn cc-main" data-cc="accept">Tout accepter</button>' +
            '<button type="button" class="cc-btn" data-cc="save">Enregistrer mes choix</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
    wrap.addEventListener("click", function (e) {
      var a = e.target.getAttribute("data-cc");
      if (a === "accept") decide(allChoices(true));
      else if (a === "refuse") decide(allChoices(false));
      else if (a === "save") {
        var c = {};
        wrap.querySelectorAll("input[data-cat]").forEach(function (i) { c[i.getAttribute("data-cat")] = i.checked; });
        decide(c);
      }
    });
    document.body.appendChild(wrap);
    wrap.querySelector("input:not([disabled])").focus({ preventScroll: true });
  }
 
  /* ========= DÉMARRAGE ========= */
  function init() {
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
 
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("[data-cookie-manage]");
      if (t) { e.preventDefault(); showPanel(); }
    });
    document.addEventListener("keydown", function (e) {
      // Échap ferme le panneau de réglages sans rien valider (si un choix existe déjà)
      if (e.key === "Escape" && wrap && readConsent()) close();
    });
 
    var consent = readConsent();
    if (consent) applyConsent(consent.choices);
    else showBanner();
  }
 
  // API publique : window.SiteConsent.open() / .get()
  window.SiteConsent = {
    open: showPanel,
    get: function () { var c = readConsent(); return c ? c.choices : null; }
  };
 
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
 
 
 
 
