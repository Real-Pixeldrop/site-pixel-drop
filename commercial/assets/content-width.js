// Personal browser preference, independent of shared CRM data and other accounts.
(() => {
  const viewerId = document.currentScript?.dataset.viewerId;
  if (!viewerId) return;
  const key = 'pd:commercial:content-width:v1:' + location.pathname.replace(/index\.php$/, '') + ':' + viewerId;
  const root = document.documentElement;
  let original = false, button;
  try { original = localStorage.getItem(key) === 'original'; } catch { /* Still usable for this visit. */ }

  function render() {
    root.classList.toggle('page-width-original', original);
    if (!button) return;
    button.setAttribute('aria-pressed', String(original));
    button.title = original ? 'Passer en pleine largeur' : 'Revenir aux marges d’origine';
  }
  render(); // Apply the saved width in the head, before the page is painted.

  function mount() {
    const menu = document.querySelector('#workspace-sidebar .user-menu');
    if (!menu || menu.querySelector('.content-width-toggle')) return;
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'content-width-toggle';
    button.setAttribute('aria-label', 'Marges d’origine');
    button.innerHTML = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5v14M21 5v14M6 12h4m-3-3 3 3-3 3m11-3h-4m3-3-3 3 3 3"/></svg>';
    button.addEventListener('click', () => {
      original = !original;
      render();
      try { localStorage.setItem(key, original ? 'original' : 'wide'); }
      catch { button.title += ' · Choix pour cette visite'; }
    });
    menu.prepend(button);
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
  addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    original = event.newValue === 'original';
    render();
  });
})();
