(() => {
  const mobile = matchMedia('(max-width:760px)');
  const form = document.querySelector('.workspace-search');
  const button = form?.querySelector('.mobile-filter-toggle');
  function syncFilters() {
    if (!button) return;
    form.classList.add('mobile-enhanced');
    button.hidden = !mobile.matches;
    form.querySelector('[type=search]').placeholder = mobile.matches ? 'Rechercher…' : 'Rechercher un contact ou une entreprise';
    const count = ['focus','stage','action_period'].filter(name => form.elements[name]?.value).length;
    button.textContent = count ? 'Filtres · '+count : 'Filtres';
    button.classList.toggle('is-active-filter',count>0);
    button.setAttribute('aria-expanded',String(form.classList.contains('filters-open')));
  }
  button?.addEventListener('click',() => { form.classList.toggle('filters-open'); syncFilters(); });
  window.addEventListener('commercial:controls-updated',syncFilters);
  mobile.addEventListener('change',syncFilters);
  syncFilters();
  // Touch scrolling uses the board normally. Stages can also be changed in the record.
  function syncCards() {
    document.querySelectorAll('.deal-card').forEach(card => card.draggable = !mobile.matches);
  }
  mobile.addEventListener('change',syncCards);
  window.addEventListener('commercial:controls-updated',syncCards);
  syncCards();
})();
