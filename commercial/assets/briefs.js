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
  const generation = workspace.querySelector('[data-brief-generation]');
  const title = workspace.querySelector('[data-brief-progress-title]');
  const detail = workspace.querySelector('[data-brief-progress-detail]');
  const count = workspace.querySelector('[data-brief-progress-count]');
  const retry = workspace.querySelector('[data-brief-retry]');
  const labels = {site: 'Site', news: 'Actualités', profiles: 'Profils', brief: 'Brief'};
  const titles = {site: 'Analyse du site de l’entreprise', news: 'Recherche des actualités', profiles: 'Recherche des profils', brief: 'Rédaction du brief'};
  const states = {pending: 'En attente', running: 'En cours', done: 'Terminé', partial: 'Partiel', skipped: 'Non disponible'};
  const terminalSteps = ['done', 'partial', 'skipped'];
  const text = (value, max) => typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
  const setText = (element, value) => { if (element && element.textContent !== value) element.textContent = value; };
  const updateProgress = (result) => {
    if (generation) generation.dataset.state = result.state;
    const steps = Array.isArray(result.progress?.steps) ? result.progress.steps : [];
    let completed = 0;
    let active = null;
    for (const [id, fallbackLabel] of Object.entries(labels)) {
      const step = steps.find(item => item && item.id === id);
      if (!step || !Object.prototype.hasOwnProperty.call(states, step.state)) continue;
      const label = text(step.label, 30) || fallbackLabel;
      if (terminalSteps.includes(step.state)) completed++;
      if (step.state === 'running' && !active) active = {id, detail: text(step.detail, 180)};
      const item = workspace.querySelector(`[data-brief-step="${id}"]`);
      if (!item) continue;
      item.dataset.state = step.state;
      item.setAttribute('aria-label', `${label} : ${states[step.state]}`);
      setText(item.querySelector('[data-brief-step-label]'), label);
      setText(item.querySelector('[data-brief-step-symbol]'), step.state === 'done' ? '✓' : step.state === 'partial' ? '·' : step.state === 'skipped' ? '−' : '');
      setText(item.querySelector('[data-brief-step-note]'), ['partial', 'skipped'].includes(step.state) ? states[step.state] : '');
    }
    if (steps.length) {
      setText(count, `${completed}/4 étapes`);
      if (count) count.setAttribute('aria-label', `${completed} étapes terminées sur 4`);
    }
    if (result.state === 'running' && result.progress?.reported === false) {
      setText(count, 'En cours');
      if (count) count.setAttribute('aria-label', 'Recherche en cours');
    }
    if (result.state === 'complete') {
      setText(title, 'Votre brief est prêt');
      setText(detail, 'Ouverture du brief…');
      setText(count, 'Terminé');
      if (count) count.setAttribute('aria-label', 'Brief disponible');
    } else if (result.state === 'error' || result.state === 'empty') {
      setText(title, 'La recherche s’est interrompue');
      setText(detail, 'Vous pouvez relancer la préparation du brief.');
      if (retry) retry.hidden = false;
    } else if (active) {
      setText(title, titles[active.id]);
      setText(detail, active.detail || 'Recherche en cours.');
    } else if (result.state === 'queued') {
      setText(title, 'Demande reçue, lancement…');
      setText(detail, 'Les étapes s’afficheront au fil de la recherche.');
    } else if (completed === 4) {
      setText(title, 'Finalisation du brief');
      setText(detail, 'La recherche est terminée. Le brief est en cours d’enregistrement.');
    } else if (result.state === 'running' && !active) {
      setText(title, 'Recherche en cours');
      setText(detail, 'Le brief apparaîtra dès que la recherche sera terminée.');
    }
  };
  const pauseNotice = () => {
    if (generation) generation.dataset.state = 'paused';
    setText(title, 'Suivi mis en pause');
    setText(detail, 'La recherche peut continuer en arrière-plan. Rechargez cette page pour consulter son résultat.');
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
      updateProgress(result);
      if (!['queued', 'running'].includes(result.state)) {
        stopped = true;
        if (result.state === 'complete') {
          const reducedMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (reducedMotion) window.location.reload();
          else timer = window.setTimeout(() => window.location.reload(), 400);
        }
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
    if (!stopped) timer = window.setTimeout(poll, failures ? 12000 : 2000);
  };
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !stopped) {
      window.clearTimeout(timer);
      timer = window.setTimeout(poll, 500);
    }
  });
  window.addEventListener('pagehide', () => { stopped = true; window.clearTimeout(timer); });
  timer = window.setTimeout(poll, 2000);
})();
