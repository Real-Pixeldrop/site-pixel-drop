// Presentation only. Workspace authorization and switching stay on the server.
(() => {
  function mount() {
    const menu = document.querySelector('[data-profile-menu]');
    const trigger = menu?.querySelector('[data-profile-trigger]');
    const panel = menu?.querySelector('.profile-menu-panel');
    if (!trigger || !panel || menu.dataset.profileReady) return;
    menu.dataset.profileReady = 'true';
    const fallback = menu.querySelector('.profile-menu-fallback');
    let open = false;

    // Escape the desktop rail's overflow without changing its scrolling or margins.
    document.body.append(panel);
    trigger.hidden = false;
    if (fallback) fallback.hidden = true;

    const actions = () => [...panel.querySelectorAll('a[href],button:not(:disabled)')];
    function position() {
      if (!open) return;
      const viewport = window.visualViewport;
      const leftEdge = viewport?.offsetLeft || 0;
      const topEdge = viewport?.offsetTop || 0;
      const width = viewport?.width || window.innerWidth;
      const height = viewport?.height || window.innerHeight;
      const rect = trigger.getBoundingClientRect();
      const mobile = window.matchMedia('(max-width:760px)').matches;
      const sidebar = menu.closest('.sidebar')?.getBoundingClientRect();
      const bottom = mobile && sidebar ? Math.min(topEdge + height - 8, sidebar.top - 8) : topEdge + height - 8;
      panel.style.maxWidth = Math.max(0, width - 16) + 'px';
      panel.style.maxHeight = Math.max(0, bottom - topEdge - 8) + 'px';
      const panelRect = panel.getBoundingClientRect();
      const proposedLeft = mobile ? rect.right - panelRect.width : rect.right + 8;
      const proposedTop = mobile ? bottom - panelRect.height : rect.bottom - panelRect.height;
      panel.style.left = Math.max(leftEdge + 8, Math.min(proposedLeft, leftEdge + width - panelRect.width - 8)) + 'px';
      panel.style.top = Math.max(topEdge + 8, Math.min(proposedTop, bottom - panelRect.height)) + 'px';
    }
    function close(restoreFocus = false) {
      if (!open) return;
      open = false;
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      if (restoreFocus) trigger.focus({ preventScroll: true });
    }
    function show() {
      open = true;
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      position();
      (actions()[0] || panel).focus({ preventScroll: true });
    }
    trigger.addEventListener('click', () => open ? close(true) : show());
    trigger.addEventListener('keydown', event => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      if (!open) show();
      const choices = actions();
      (event.key === 'ArrowUp' ? choices.at(-1) : choices[0])?.focus();
    });
    panel.addEventListener('keydown', event => {
      const choices = actions();
      const index = choices.indexOf(document.activeElement);
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + choices.length) % choices.length;
        choices[next]?.focus();
      } else if (event.key === 'Tab' && ((event.shiftKey && index === 0) || (!event.shiftKey && index === choices.length - 1))) {
        // Let Tab continue in the page's natural order from the avatar, without a trap.
        close(true);
      }
    });
    document.addEventListener('keydown', event => {
      if (!open || event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      close(true);
    });
    document.addEventListener('pointerdown', event => {
      if (open && !panel.contains(event.target) && !trigger.contains(event.target)) close(panel.contains(document.activeElement));
    });
    document.addEventListener('focusin', event => {
      if (open && !panel.contains(event.target) && !trigger.contains(event.target)) close();
    });
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, { passive: true, capture: true });
    window.visualViewport?.addEventListener('resize', position);
    window.visualViewport?.addEventListener('scroll', position);
    window.addEventListener('pagehide', () => close());
    window.addEventListener('pageshow', () => close());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
