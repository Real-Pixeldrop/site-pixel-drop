(() => {
  'use strict';
  const navigation = document.querySelector('[data-trust-tabs]');
  if (!navigation) return;
  const tabs = Array.from(navigation.querySelectorAll('a[href^="#"]'));
  const panels = tabs.map((tab) => document.getElementById(tab.hash.slice(1)));
  if (panels.some((panel) => !panel)) return;
  document.documentElement.classList.add('enhanced');
  navigation.setAttribute('role', 'tablist');
  navigation.setAttribute('aria-label', 'Rubriques du centre de confiance');
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].setAttribute('aria-labelledby', tab.id);
    panels[index].setAttribute('tabindex', '0');
  });
  function activate(id, updateHistory = false, focusTab = false) {
    let index = panels.findIndex((panel) => panel.id === id);
    if (index < 0) index = 0;
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[i].hidden = !selected;
    });
    if (updateHistory && location.hash !== '#' + panels[index].id) {
      history.pushState(null, '', '#' + panels[index].id);
    }
    if (focusTab) tabs[index].focus({ preventScroll: true });
    return index;
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();
      activate(panels[index].id, true);
    });
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      activate(panels[next].id, true, true);
    });
  });
  document.querySelectorAll('[data-open-panel]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('data-open-panel');
      if (!panels.some((panel) => panel.id === id)) return;
      event.preventDefault();
      activate(id, true, true);
      const detailId = link.getAttribute('data-open-detail');
      const detail = detailId ? document.getElementById(detailId) : null;
      if (detail && detail.tagName === 'DETAILS') detail.open = true;
      navigation.scrollIntoView({ block: 'start', behavior: 'auto' });
    });
  });
  window.addEventListener('popstate', () => activate(location.hash.slice(1)));
  window.addEventListener('hashchange', () => activate(location.hash.slice(1)));
  activate(location.hash.slice(1));
})();
