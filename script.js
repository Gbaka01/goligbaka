let semaine = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi',];
let an = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',];
function afficherDate() {
    let time = new Date();
    let heure = time.getHours();
    let minute = time.getMinutes();
    if(minute<10){minute = "0" + minute}
    let jourDeLaSemaine = time.getDay();

    // getDate() récupère le jour du mois (de 1 au dernier jour du mois)
    let jour = time.getDate();

    let mois = time.getMonth();
    let annee = time.getFullYear();
    let second = time.getSeconds();
    if(second<10){second = "0" + second}
    let affichage = document.querySelector(".jeu");
    affichage.textContent = "Aujourd'hui, nous sommes le "+semaine[jourDeLaSemaine] +" "+ jour +" "+ an[mois] +" "+ annee +" "+ "il est: " +heure+":"+minute+":"+second;

}

afficherDate();
setInterval(afficherDate, 1000);


const scrollTopBtn = document.getElementById("scrollTopBtn");

window.addEventListener("scroll", () => {
  if (window.scrollY > 250) {
    scrollTopBtn.classList.add("show");
  } else {
    scrollTopBtn.classList.remove("show");
  }
});
document.addEventListener("click", function (e) {
  const lien = e.target.closest("[data-cookie-manage]");
  if (!lien) return;
  e.preventDefault();

  // 1) Si le script expose une fonction pour rouvrir le bandeau, on l'utilise
  if (window.CookieConsent && typeof window.CookieConsent.show === "function") {
    window.CookieConsent.show();
    return;
  }

  // 2) Sinon : on efface le consentement enregistré et on recharge
  Object.keys(localStorage).forEach(function (cle) {
    if (/cookie|consent/i.test(cle)) localStorage.removeItem(cle);
  });
  document.cookie.split(";").forEach(function (c) {
    const nom = c.split("=")[0].trim();
    if (/cookie|consent/i.test(nom)) {
      document.cookie = nom + "=; Max-Age=0; path=/";
    }
  });
  location.reload();
});