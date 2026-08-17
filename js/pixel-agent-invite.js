(function () {
  'use strict';

  var PREVIEW_MODE = new URLSearchParams(window.location.search).get('preview-agent-popup');
  var PREVIEW = PREVIEW_MODE === '1' || PREVIEW_MODE === 'form';
  var DISMISS_KEY = 'pd-agent-invite-dismissed';
  var CONVERTED_KEY = 'pd-agent-invite-converted';
  var SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

  if (!PREVIEW) {
    try {
      if (localStorage.getItem(CONVERTED_KEY) === '1') return;
      var dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (dismissedAt && Date.now() - dismissedAt < SEVEN_DAYS) return;
    } catch (e) {}
  }

  var style = document.createElement('style');
  style.id = 'pd-agent-invite-css';
  style.textContent = `
    .pdai{--pdai-blue:#3b82f6;--pdai-ink:#071117;--pdai-line:rgba(132,163,178,.28);position:fixed;right:24px;bottom:24px;z-index:9998;width:min(372px,calc(100vw - 32px));font-family:'Gotham','Manrope',-apple-system,BlinkMacSystemFont,Arial,sans-serif;color:#f7fbff;background:linear-gradient(145deg,rgba(7,17,23,.98),rgba(15,35,46,.97));border:1px solid var(--pdai-line);box-shadow:0 24px 70px rgba(0,0,0,.42),0 0 0 1px rgba(59,130,246,.05);border-radius:18px;overflow:hidden;opacity:0;transform:translateY(18px) scale(.98);pointer-events:none;transition:opacity .35s ease,transform .35s cubic-bezier(.2,.75,.25,1);letter-spacing:normal!important}
    .pdai.is-visible{opacity:1;transform:none;pointer-events:auto}
    .pdai::before{content:'';position:absolute;inset:0 auto auto 0;width:100%;height:2px;background:linear-gradient(90deg,transparent,var(--pdai-blue),#7cc8ff,transparent);opacity:.9}
    .pdai *{box-sizing:border-box;letter-spacing:normal!important}
    .pdai-top{display:flex;align-items:center;justify-content:space-between;padding:17px 17px 0 18px}
    .pdai-brand{display:flex;align-items:center;gap:9px;color:#a9bfd0;font-family:'DM Mono',ui-monospace,monospace;font-size:10px;font-weight:600;letter-spacing:.09em!important;text-transform:uppercase}
    .pdai-new{display:inline-flex;align-items:center;border:1px solid rgba(59,130,246,.45);background:rgba(59,130,246,.12);color:#b9d6ff;border-radius:999px;padding:4px 7px}
    .pdai-close{width:30px;height:30px;display:grid;place-items:center;border:0;background:transparent;color:#7f98a8;border-radius:9px;font-size:22px;line-height:1;cursor:pointer;transition:.16s}
    .pdai-close:hover,.pdai-close:focus-visible{background:rgba(255,255,255,.07);color:#fff;outline:none}
    .pdai-body{padding:14px 18px 18px}
    .pdai-visual{height:54px;margin:0 0 12px;position:relative;overflow:hidden;border-radius:12px;background:radial-gradient(circle at 28% 50%,rgba(59,130,246,.2),transparent 38%),linear-gradient(100deg,rgba(255,255,255,.025),rgba(59,130,246,.06));border:1px solid rgba(255,255,255,.06)}
    .pdai-visual svg{display:block;width:100%;height:100%}
    .pdai-flow{stroke:#5ba1ff;stroke-width:1.3;stroke-dasharray:5 7;animation:pdaiFlow 5s linear infinite}
    .pdai-node{fill:#0d2231;stroke:#78b3ff;stroke-width:1.2}
    .pdai-node-main{fill:#3b82f6;stroke:#b9d6ff}
    @keyframes pdaiFlow{to{stroke-dashoffset:-48}}
    .pdai h2{margin:0!important;color:#fff!important;font-family:'Ppmori','Gotham',sans-serif!important;font-size:23px!important;line-height:1.12!important;font-weight:500!important;letter-spacing:-.025em!important;text-align:left!important;white-space:normal!important;overflow-wrap:break-word!important}
    .pdai-copy{margin:9px 0 15px;color:#a9bac5;font-size:13.5px;line-height:1.5}
    .pdai-cta,.pdai-submit{width:100%;border:1px solid rgba(123,179,255,.58);background:linear-gradient(100deg,#2563eb,#3b82f6);color:#fff;border-radius:11px;padding:12px 14px;font-family:inherit;font-size:13.5px;font-weight:650;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:14px;transition:transform .16s ease,filter .16s ease}
    .pdai-cta:hover,.pdai-submit:hover{filter:brightness(1.08);transform:translateY(-1px)}
    .pdai-cta:focus-visible,.pdai-submit:focus-visible{outline:2px solid #a9d1ff;outline-offset:3px}
    .pdai-arrow{font-size:18px;line-height:1}
    .pdai-form{display:none;margin-top:3px}
    .pdai[data-state='form'] .pdai-teaser{display:none}
    .pdai[data-state='form'] .pdai-form{display:block}
    .pdai-formtitle{margin:0 0 4px;color:#fff;font-family:'Ppmori','Gotham',sans-serif;font-size:21px;line-height:1.18;font-weight:500;white-space:normal!important;overflow-wrap:break-word!important}
    .pdai-formintro{margin:0 0 13px;color:#a9bac5;font-size:12.5px;line-height:1.45}
    .pdai-fields{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .pdai-input{width:100%;min-width:0;border:1px solid rgba(161,190,205,.22);background:rgba(2,10,15,.62);color:#fff;border-radius:10px;padding:11px 12px;font-family:inherit;font-size:13px;outline:none}
    .pdai-input::placeholder{color:#708796}
    .pdai-input:focus{border-color:#63a4fa;box-shadow:0 0 0 3px rgba(59,130,246,.12)}
    .pdai-consent{display:flex;align-items:flex-start;gap:8px;margin:11px 1px 12px;color:#8fa5b3;font-size:10.5px;line-height:1.42;cursor:pointer}
    .pdai-consent input{margin:2px 0 0;accent-color:#3b82f6;flex:none}
    .pdai-consent a{color:#afc9d9;text-underline-offset:2px}
    .pdai-submit:disabled{opacity:.62;cursor:wait;transform:none}
    .pdai-error{display:none;margin:9px 0 0;color:#ffadad;font-size:11.5px;line-height:1.4}
    .pdai-error.is-on{display:block}
    .pdai-note{margin:9px 0 0;color:#6f8795;font-size:10px;line-height:1.4;text-align:center}
    @media(max-width:600px){.pdai{right:12px;bottom:12px;width:calc(100vw - 24px);border-radius:16px}.pdai-top{padding:15px 15px 0}.pdai-body{padding:12px 15px 15px}.pdai-visual{display:none}.pdai h2{font-size:20px!important}.pdai-copy{font-size:12.5px;margin-bottom:12px}.pdai-fields{grid-template-columns:1fr}}
    @media(prefers-reduced-motion:reduce){.pdai,.pdai-cta,.pdai-submit{transition:none}.pdai-flow{animation:none}}
  `;
  document.head.appendChild(style);

  var card = document.createElement('aside');
  card.className = 'pdai';
  card.dataset.state = 'teaser';
  card.setAttribute('aria-label', 'Découvrir Pixel Agent Suite');
  card.innerHTML = `
    <div class="pdai-top">
      <div class="pdai-brand"><span class="pdai-new">Nouveau</span><span>Pixel Agent Suite</span></div>
      <button class="pdai-close" type="button" aria-label="Fermer">&times;</button>
    </div>
    <div class="pdai-body">
      <div class="pdai-teaser">
        <div class="pdai-visual" aria-hidden="true">
          <svg viewBox="0 0 336 54" fill="none">
            <path class="pdai-flow" d="M22 27H103C124 27 125 12 146 12H211C234 12 232 40 255 40H316"/>
            <circle class="pdai-node" cx="23" cy="27" r="7"/><circle class="pdai-node" cx="107" cy="27" r="6"/>
            <circle class="pdai-node pdai-node-main" cx="168" cy="12" r="7"/><circle class="pdai-node" cx="226" cy="25" r="6"/>
            <circle class="pdai-node" cx="270" cy="40" r="6"/><circle class="pdai-node pdai-node-main" cx="316" cy="40" r="7"/>
          </svg>
        </div>
        <h2>Réussissez le virage de l’IA dans votre entreprise.</h2>
        <p class="pdai-copy">Découvrez des agents reliés à vos données et à vos outils, dans un environnement gouverné par votre entreprise.</p>
        <button class="pdai-cta" type="button"><span>Découvrir Pixel Agent Suite</span><span class="pdai-arrow" aria-hidden="true">→</span></button>
      </div>
      <form class="pdai-form" novalidate>
        <p class="pdai-formtitle">Accéder à la présentation</p>
        <p class="pdai-formintro">Laissez votre email professionnel. L’accès s’ouvre immédiatement.</p>
        <input type="hidden" name="_type" value="Accès Pixel Agent Suite">
        <input type="text" name="_hp" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">
        <div class="pdai-fields">
          <input class="pdai-input" type="email" name="email" placeholder="Email professionnel*" autocomplete="email" required>
          <input class="pdai-input" type="text" name="entreprise" placeholder="Entreprise" autocomplete="organization">
        </div>
        <label class="pdai-consent"><input type="checkbox" name="consent" value="Oui" required><span>J’accepte que Pixel Drop me recontacte au sujet de Pixel Agent Suite. <a href="/politique-confidentialite" target="_blank" rel="noopener">Confidentialité</a></span></label>
        <button class="pdai-submit" type="submit"><span>Accéder à Pixel Agent Suite</span><span class="pdai-arrow" aria-hidden="true">→</span></button>
        <p class="pdai-error" role="alert">L’envoi n’a pas abouti. Réessayez ou écrivez à contact@pixel-drop.com.</p>
        <p class="pdai-note">Aucune promesse automatique. Nous vérifions d’abord si la solution correspond à votre contexte.</p>
      </form>
    </div>`;
  document.body.appendChild(card);

  var close = card.querySelector('.pdai-close');
  var open = card.querySelector('.pdai-cta');
  var form = card.querySelector('.pdai-form');
  var submit = card.querySelector('.pdai-submit');
  var error = card.querySelector('.pdai-error');

  if (PREVIEW_MODE === 'form') card.dataset.state = 'form';

  close.addEventListener('click', function () {
    card.classList.remove('is-visible');
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) {}
    window.setTimeout(function () { card.remove(); }, 360);
  });

  open.addEventListener('click', function () {
    card.dataset.state = 'form';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-expanded', 'true');
    window.setTimeout(function () { form.querySelector('input[name="email"]').focus(); }, 30);
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    error.classList.remove('is-on');
    if (!form.reportValidity()) return;
    submit.disabled = true;
    submit.firstElementChild.textContent = 'Ouverture en cours…';
    var data = new FormData(form);
    data.append('page', window.location.pathname);
    try {
      var response = await fetch('/form-handler.php', { method: 'POST', body: data });
      var result = await response.json();
      if (!response.ok || !result.ok) throw new Error('send');
      try { localStorage.setItem(CONVERTED_KEY, '1'); } catch (e) {}
      submit.firstElementChild.textContent = 'Accès confirmé';
      window.setTimeout(function () { window.location.assign('/entreprise/?source=site-popup'); }, 280);
    } catch (e) {
      submit.disabled = false;
      submit.firstElementChild.textContent = 'Accéder à Pixel Agent Suite';
      error.classList.add('is-on');
    }
  });

  window.setTimeout(function () { card.classList.add('is-visible'); }, PREVIEW ? 100 : 2600);
})();
