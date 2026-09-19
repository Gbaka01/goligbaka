(() => {
  const STORAGE_KEY = "consent_v1";          // changez v1 → v2 si vos catégories changent
  const DURATION_MS = 6 * 30 * 24 * 3600e3;  // ~6 mois, puis on redemande
  const CATEGORIES = ["analytics", "media"];

  const banner = document.getElementById("consent-banner");
  const dialog = document.getElementById("consent-dialog");

  /* ---------- Stockage ---------- */
  function readConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const consent = JSON.parse(raw);
      if (Date.now() > consent.expires) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return consent;
    } catch {
      return null;
    }
  }

  function writeConsent(choices) {
    const previous = readConsent();
    const consent = { ...choices, date: new Date().toISOString(), expires: Date.now() + DURATION_MS };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(consent)); } catch {}

    // Un script déjà chargé ne peut pas être « déchargé » : si l'utilisateur
    // retire un consentement donné avant, on recharge la page.
    const withdrew = previous && CATEGORIES.some(c => previous[c] && !consent[c]);
    if (withdrew) { location.reload(); return; }

    applyConsent(consent);
    banner.hidden = true;
  }

  /* ---------- Activation des scripts ---------- */
  function activateScripts(category) {
    document
      .querySelectorAll(`script[type="text/plain"][data-consent="${category}"]`)
      .forEach(inactive => {
        const script = document.createElement("script");
        for (const { name, value } of inactive.attributes) {
          if (name !== "type") script.setAttribute(name, value);
        }
        script.textContent = inactive.textContent;
        inactive.replaceWith(script);
      });
  }

  function applyConsent(consent) {
    CATEGORIES.forEach(category => { if (consent[category]) activateScripts(category); });
  }

  /* ---------- Interface ---------- */
  function openPreferences() {
    const current = readConsent() || {};
    dialog.querySelectorAll("[data-category]").forEach(input => {
      input.checked = Boolean(current[input.dataset.category]);
    });
    dialog.showModal();
  }

  document.addEventListener("click", event => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;

    const all = value => Object.fromEntries(CATEGORIES.map(c => [c, value]));

    if (action === "accept") writeConsent(all(true));
    if (action === "reject") writeConsent(all(false));
    if (action === "customize") openPreferences();
    if (action === "cancel") dialog.close();
    if (action === "save") {
      const choices = {};
      dialog.querySelectorAll("[data-category]").forEach(input => {
        choices[input.dataset.category] = input.checked;
      });
      writeConsent(choices);
      dialog.close();
    }
  });

  document.getElementById("open-preferences").addEventListener("click", openPreferences);

  /* ---------- Démarrage ---------- */
  const existing = readConsent();
  if (existing) {
    applyConsent(existing);
  } else {
    banner.hidden = false;
  }
})();