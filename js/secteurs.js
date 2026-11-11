(() => {
  const rail = document.getElementById('pd-sector-rail');
  if (!rail) return;

  const section = rail.closest('section');
  const panels = [...rail.querySelectorAll('.pd-sector-panel')];
  const motionButton = section.querySelector('.pd-sector-motion');
  const navigation = section.querySelector('.pd-sector-nav');
  const [previous, next] = navigation.querySelectorAll('button');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const touchInput = window.matchMedia('(hover: none) and (pointer: coarse)');
  const visiblePanels = new Set();
  let motionEnabled = !reducedMotion.matches;
  let hoveredPanel = null;
  let activePanel = null;

  function refreshNavigation() {
    const limit = rail.scrollWidth - rail.clientWidth;
    navigation.hidden = limit < 2;
    previous.disabled = rail.scrollLeft < 2;
    next.disabled = rail.scrollLeft >= limit - 2;
  }

  function refreshMotion() {
    const defaultPanel = touchInput.matches
      ? panels.find(panel => visiblePanels.has(panel))
      : panels[0];
    const target = motionEnabled && !document.hidden
      ? [hoveredPanel, document.activeElement, defaultPanel].find(panel => visiblePanels.has(panel))
      : null;
    if (target === activePanel) return;
    if (activePanel) {
      activePanel.querySelector('video').pause();
      activePanel.removeAttribute('data-playing');
    }
    activePanel = target;
    if (!target) return;
    const video = target.querySelector('video');
    video.muted = true;
    if (!video.hasAttribute('src')) video.src = video.dataset.src;
    video.play().catch(() => {});
  }

  function setMotion(enabled) {
    motionEnabled = enabled;
    motionButton.textContent = enabled ? 'Mettre les vidéos en pause' : 'Animer les vidéos';
    refreshMotion();
  }

  for (const panel of panels) {
    const video = panel.querySelector('video');
    video.addEventListener('playing', () => {
      if (activePanel === panel) panel.setAttribute('data-playing', '');
      else video.pause();
    });
    video.addEventListener('error', () => panel.removeAttribute('data-playing'));
    panel.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse') return;
      hoveredPanel = panel;
      refreshMotion();
    });
    panel.addEventListener('pointerleave', () => {
      if (hoveredPanel !== panel) return;
      hoveredPanel = null;
      refreshMotion();
    });
  }

  if ('IntersectionObserver' in window && panels.some(panel => panel.querySelector('video').canPlayType('video/mp4'))) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.intersectionRatio >= .5) visiblePanels.add(entry.target);
        else visiblePanels.delete(entry.target);
      }
      refreshMotion();
    }, { threshold: .5 });
    panels.forEach(panel => observer.observe(panel));
    rail.addEventListener('focusin', refreshMotion);
    rail.addEventListener('focusout', () => requestAnimationFrame(refreshMotion));
    document.addEventListener('visibilitychange', refreshMotion);
    reducedMotion.addEventListener('change', event => setMotion(!event.matches));
    touchInput.addEventListener('change', refreshMotion);
    motionButton.addEventListener('click', () => setMotion(!motionEnabled));
    motionButton.hidden = false;
    setMotion(motionEnabled);
  }

  for (const button of [previous, next]) {
    button.addEventListener('click', () => {
      const gap = parseFloat(getComputedStyle(rail).columnGap);
      rail.scrollBy({left: Number(button.dataset.direction) * (panels[0].offsetWidth + gap),
        behavior: reducedMotion.matches ? 'instant' : 'smooth'});
    });
  }
  rail.addEventListener('scroll', refreshNavigation, {passive: true});
  window.addEventListener('resize', refreshNavigation);
  refreshNavigation();
})();
