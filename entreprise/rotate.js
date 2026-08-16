(function () {
  var slides = document.querySelectorAll(".heading-image__rotate");
  if (!slides.length) return;
  var i = 0;
  setInterval(function () {
    slides[i].classList.remove("active");
    i = (i + 1) % slides.length;
    slides[i].classList.add("active");
  }, 1500);
})();
