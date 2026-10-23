// Panneau « Demander une démo » : envoi au form-handler du site, sans quitter la page.
(function () {
  document.querySelectorAll(".demo-drop").forEach(function (drop) {
    var form = drop.querySelector(".demo-drop__form");
    var status = drop.querySelector(".demo-drop__status");
    if (!form || !status) return;

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      submit.textContent = "Envoi…";
      drop.classList.add("is-open");
      try {
        var response = await fetch(form.action, { method: "POST", body: new FormData(form) });
        var payload = await response.json();
        if (!response.ok || !payload.ok) throw new Error("Envoi refusé");
        form.style.display = "none";
        status.textContent = "Merci. Nous revenons vers vous pour fixer le créneau de votre démo.";
      } catch (error) {
        status.textContent = "L’envoi n’a pas abouti. Écrivez-nous à contact@pixel-drop.com.";
        submit.disabled = false;
        submit.textContent = "Réessayer";
      }
    });

    document.addEventListener("click", function (e) {
      if (!drop.contains(e.target)) drop.classList.remove("is-open");
    });
  });
})();
