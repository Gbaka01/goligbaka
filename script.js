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