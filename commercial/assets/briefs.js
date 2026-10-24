(() => {
  'use strict';
  const printButton = document.querySelector('[data-print-prospect-brief]');
  if (printButton) printButton.addEventListener('click', () => window.print());
  // A normal POST keeps CSRF and workspace validation on the server.
  document.querySelectorAll('.brief-request-form').forEach(form => {
    form.addEventListener('submit', () => {
      const button = form.querySelector('button[type="submit"]');
      if (!button || button.disabled) return;
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
      button.textContent = 'Demande en cours…';
    });
  });

  // Poll only the dedicated brief page while its requested job is active.
  // This never queues another job or reloads a contact form with unsaved edits.
  const workspace = document.querySelector('.prospect-brief-workspace[data-brief-pending="1"]');
  if (!workspace) return;
  const statusUrl = new URL(workspace.dataset.briefStatusUrl, window.location.href);
  if (statusUrl.origin !== window.location.origin) return;
  let stopped = false;
  let failures = 0;
  let inFlight = false;
  let timer;
  const startedAt = Date.now();
  const pauseNotice = () => {
    const notice = workspace.querySelector('.brief-progress[role="status"]');
    if (notice) notice.textContent = 'La recherche peut continuer en arrière-plan. Rechargez cette page pour consulter son résultat.';
  };
  const poll = async () => {
    if (stopped || inFlight) return;
    if (Date.now() - startedAt > 10 * 60 * 1000) {
      stopped = true;
      pauseNotice();
      return;
    }
    if (document.hidden) return;
    inFlight = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(statusUrl, {signal: controller.signal, credentials: 'same-origin', cache: 'no-store', headers: {'Accept': 'application/json'}});
      if (!response.ok) throw new Error('Status unavailable');
      const result = await response.json();
      if (stopped) return;
      if (!result.ok || !['queued', 'running', 'error', 'complete', 'empty'].includes(result.state)) throw new Error('Invalid status');
      failures = 0;
      if (!['queued', 'running'].includes(result.state)) {
        stopped = true;
        window.location.reload();
        return;
      }
    } catch (_) {
      if (stopped) return;
      failures += 1;
      if (failures >= 3) {
        stopped = true;
        pauseNotice();
        return;
      }
    } finally {
      window.clearTimeout(timeout);
      inFlight = false;
    }
    if (!stopped) timer = window.setTimeout(poll, failures ? 12000 : 4000);
  };
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !stopped) {
      window.clearTimeout(timer);
      timer = window.setTimeout(poll, 500);
    }
  });
  window.addEventListener('pagehide', () => { stopped = true; window.clearTimeout(timer); });
  timer = window.setTimeout(poll, 4000);
})();
