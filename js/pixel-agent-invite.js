(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var previewMode = params.get('preview-guide-popup') || params.get('preview-agent-popup');
  var PREVIEW = Boolean(previewMode);
  var DISMISS_KEY = 'pd-guide-ia-dismissed-at';
  var CONVERTED_KEY = 'pd-guide-ia-converted';
  var DISMISS_DURATION = 30 * 60 * 1000;
  var GUIDE_URL = '/docs/guide-reussir-virage-ia-pixel-drop.pdf?v=20260818-6';
  var ENTERPRISE_URL = '/entreprise/?source=guide-ia-popup';

  function readConverted() {
    if (previewMode === 'enterprise') return true;
    if (previewMode && previewMode !== 'enterprise') return false;
    try { return localStorage.getItem(CONVERTED_KEY) === '1'; } catch (e) { return false; }
  }

  function isDismissed() {
    if (PREVIEW) return false;
    try {
      var stamp = Number(localStorage.getItem(DISMISS_KEY) || 0);
      return stamp && Date.now() - stamp < DISMISS_DURATION;
    } catch (e) { return false; }
  }

  function rememberDismissal() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) {}
  }

  function clearDismissal() {
    try { localStorage.removeItem(DISMISS_KEY); } catch (e) {}
  }

  document.getElementById('pd-guide-invite')?.remove();
  document.getElementById('pd-guide-invite-css')?.remove();

  var style = document.createElement('style');
  style.id = 'pd-guide-invite-css';
  style.textContent = `
    #pd-guide-invite{all:initial;--pdg-ink:#071117;--pdg-navy:#182a38;--pdg-panel:#102431;--pdg-teal:#5FD6C9;--pdg-teal-dark:#178A7C;--pdg-blue:#6795A3;--pdg-red:#FF0101;position:fixed;right:24px;bottom:24px;z-index:99990;display:flex;align-items:flex-end;justify-content:flex-end;font-family:'Gotham','Manrope',-apple-system,BlinkMacSystemFont,Arial,sans-serif;line-height:normal;box-sizing:border-box;color:var(--pdg-ink);pointer-events:none}
    #pd-guide-invite *,#pd-guide-invite *::before,#pd-guide-invite *::after{box-sizing:border-box;margin:0;padding:0;font-family:inherit;text-transform:none!important;letter-spacing:normal!important}
    #pd-guide-invite [hidden]{display:none!important}
    #pd-guide-invite button,#pd-guide-invite input{appearance:none;-webkit-appearance:none}
    #pd-guide-invite .pdg-card{position:relative;z-index:2;width:304px;min-height:440px;overflow:hidden;isolation:isolate;background:#fff;border:1px solid rgba(7,17,23,.08);border-radius:22px;padding:20px;color:var(--pdg-ink);box-shadow:0 24px 70px rgba(0,0,0,.26),0 6px 18px rgba(7,17,23,.12),0 0 0 4px rgba(95,214,201,.11);opacity:0;transform:translateY(14px) scale(.98);pointer-events:none;transition:opacity .36s ease,transform .42s cubic-bezier(.2,.8,.2,1);animation:pdgBreath 4.5s ease-in-out 1.2s infinite}
    #pd-guide-invite.is-visible .pdg-card{opacity:1;transform:none;pointer-events:auto}
    #pd-guide-invite .pdg-card::before{content:'';position:absolute;inset:-2px;z-index:-2;border-radius:24px;background:conic-gradient(from 0deg,rgba(95,214,201,0) 0%,rgba(95,214,201,.95) 15%,rgba(103,149,163,.8) 26%,rgba(95,214,201,0) 42%,rgba(95,214,201,0) 100%);animation:pdgSpin 8s linear infinite;opacity:.68}
    #pd-guide-invite .pdg-card::after{content:'';position:absolute;inset:1px;z-index:-1;border-radius:20px;background:#fff}
    #pd-guide-invite .pdg-shine{position:absolute;inset:0 auto 0 -55%;width:44%;z-index:4;pointer-events:none;background:linear-gradient(100deg,transparent,rgba(221,246,243,.62),transparent);transform:skewX(-15deg);animation:pdgShine 5.2s ease-in-out 1.5s infinite;mix-blend-mode:screen}
    #pd-guide-invite .pdg-close{position:absolute;right:10px;top:10px;z-index:6;width:30px;height:30px;border:0;border-radius:9px;background:transparent;color:#758994;font-size:22px;line-height:1;cursor:pointer;display:grid;place-items:center;transition:background .16s ease,color .16s ease}
    #pd-guide-invite .pdg-close:hover,#pd-guide-invite .pdg-close:focus-visible{background:rgba(7,17,23,.06);color:var(--pdg-ink);outline:none}
    #pd-guide-invite .pdg-panel-close{color:rgba(255,255,255,.74)}
    #pd-guide-invite .pdg-panel-close:hover,#pd-guide-invite .pdg-panel-close:focus-visible{background:rgba(255,255,255,.12);color:#fff}
    #pd-guide-invite .pdg-head{display:flex;align-items:center;gap:9px;margin:0 30px 15px 0}
    #pd-guide-invite .pdg-brandmark{width:28px;height:28px;display:grid;place-items:center;border-radius:8px;background:var(--pdg-ink);color:#fff;font:700 12px/1 'Gotham',sans-serif;position:relative;flex:none}
    #pd-guide-invite .pdg-brandmark::after{content:'';position:absolute;right:4px;bottom:4px;width:5px;height:5px;background:var(--pdg-red)}
    #pd-guide-invite .pdg-titleline{font-size:12px;font-weight:700;line-height:1.1;color:var(--pdg-ink)}
    #pd-guide-invite .pdg-eyebrow{margin-top:4px;color:#7b909b;font-family:'DM Mono',ui-monospace,monospace;font-size:8.5px;font-weight:600;letter-spacing:.09em!important;text-transform:uppercase!important}
    #pd-guide-invite .pdg-bookzone{height:176px;display:grid;place-items:center;position:relative;margin:0 0 13px;border-radius:14px;overflow:hidden;background:radial-gradient(circle at 50% 45%,rgba(95,214,201,.22),transparent 48%),linear-gradient(145deg,#eef5f6,#dbe8eb);border:1px solid rgba(7,17,23,.06)}
    #pd-guide-invite .pdg-bookzone::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 20%,rgba(255,255,255,.58) 45%,transparent 68%);transform:translateX(-100%);animation:pdgBookShine 5s ease-in-out 2s infinite}
    #pd-guide-invite .pdg-book{position:relative;width:82px;height:132px;transform:perspective(500px) rotateY(-12deg) rotateX(3deg);filter:drop-shadow(12px 15px 12px rgba(7,17,23,.24));transition:transform .3s ease;z-index:2}
    #pd-guide-invite .pdg-card:hover .pdg-book{transform:perspective(500px) rotateY(-5deg) rotateX(1deg) translateY(-2px)}
    #pd-guide-invite .pdg-book img{display:block;width:100%;height:100%;object-fit:cover;border-radius:2px 5px 5px 2px}
    #pd-guide-invite .pdg-book::before{content:'';position:absolute;left:-6px;top:4px;width:7px;height:124px;background:linear-gradient(90deg,#071117,#244250);transform:skewY(-35deg);transform-origin:right top;border-radius:2px 0 0 2px}
    #pd-guide-invite .pdg-book::after{content:'130 PAGES';position:absolute;right:-54px;top:10px;color:var(--pdg-teal-dark);font-family:'DM Mono',ui-monospace,monospace;font-size:8px;font-weight:700;letter-spacing:.08em!important}
    #pd-guide-invite h2{margin:0!important;color:var(--pdg-ink)!important;font-family:'Ppmori','Gotham',sans-serif!important;font-size:21px!important;line-height:1.13!important;font-weight:600!important;letter-spacing:-.025em!important;text-align:left!important;white-space:normal!important;overflow-wrap:break-word!important}
    #pd-guide-invite .pdg-copy{margin:8px 0 12px;color:#5f727d;font-size:12.5px;line-height:1.45}
    #pd-guide-invite .pdg-source{display:flex;align-items:flex-start;gap:7px;color:#637984;font-size:9.5px;line-height:1.35;margin-bottom:13px}
    #pd-guide-invite .pdg-source i{width:6px;height:6px;margin-top:3px;flex:none;border-radius:50%;background:var(--pdg-red);box-shadow:0 0 0 3px rgba(255,1,1,.08)}
    #pd-guide-invite .pdg-open,#pd-guide-invite .pdg-submit,#pd-guide-invite .pdg-primary,#pd-guide-invite .pdg-secondary{width:100%;min-height:43px;border:0;border-radius:999px;padding:11px 15px;font-size:12.5px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;text-decoration:none;transition:transform .16s ease,filter .16s ease,background .16s ease}
    #pd-guide-invite .pdg-open,#pd-guide-invite .pdg-submit,#pd-guide-invite .pdg-primary{color:#071117;background:var(--pdg-teal)}
    #pd-guide-invite .pdg-open:hover,#pd-guide-invite .pdg-submit:hover,#pd-guide-invite .pdg-primary:hover{filter:brightness(1.04);transform:translateY(-1px)}
    #pd-guide-invite .pdg-open:focus-visible,#pd-guide-invite .pdg-submit:focus-visible,#pd-guide-invite .pdg-primary:focus-visible,#pd-guide-invite .pdg-secondary:focus-visible{outline:2px solid #fff;outline-offset:3px}
    #pd-guide-invite .pdg-arrow{font-size:18px;line-height:1}
    #pd-guide-invite .pdg-panel{position:relative;z-index:1;width:0;min-height:440px;overflow:hidden;opacity:0;transform:translateX(80px) scale(.985);pointer-events:none;border-radius:22px 0 0 22px;background:linear-gradient(145deg,#0f3137,#178a7c);color:#fff;box-shadow:0 24px 70px rgba(0,0,0,.32);transition:width .62s cubic-bezier(.16,1,.3,1),opacity .42s ease,transform .62s cubic-bezier(.16,1,.3,1)}
    #pd-guide-invite.is-open .pdg-panel{width:420px;opacity:1;transform:none;pointer-events:auto}
    #pd-guide-invite .pdg-panel::before{content:'';position:absolute;inset:0;background:radial-gradient(90% 75% at 100% 0%,rgba(255,255,255,.14),transparent 58%),radial-gradient(80% 70% at 0% 100%,rgba(7,17,23,.35),transparent 64%);pointer-events:none}
    #pd-guide-invite .pdg-panelinner{position:relative;width:420px;min-height:440px;padding:30px 34px 27px;display:flex;flex-direction:column;justify-content:center}
    #pd-guide-invite .pdg-panelhead{font-family:'DM Mono',ui-monospace,monospace;font-size:9px;font-weight:700;letter-spacing:.09em!important;text-transform:uppercase!important;color:#bdf3ec;margin-bottom:12px}
    #pd-guide-invite .pdg-panel h3{margin:0 0 8px!important;color:#fff!important;font-family:'Ppmori','Gotham',sans-serif!important;font-size:23px!important;line-height:1.12!important;font-weight:600!important;letter-spacing:-.02em!important}
    #pd-guide-invite .pdg-panelcopy{color:rgba(255,255,255,.82);font-size:12.5px;line-height:1.5;margin-bottom:18px}
    #pd-guide-invite .pdg-proof{list-style:none;display:grid;gap:9px;margin:0 0 19px}
    #pd-guide-invite .pdg-proof li{display:flex;align-items:flex-start;gap:9px;color:#fff;font-size:12px;line-height:1.35}
    #pd-guide-invite .pdg-proof svg{width:15px;height:15px;margin-top:1px;flex:none;color:#a9fff3}
    #pd-guide-invite .pdg-fields{display:grid;grid-template-columns:.8fr 1.2fr;gap:8px;margin-bottom:8px}
    #pd-guide-invite .pdg-input{width:100%;min-width:0;height:42px;border:1px solid rgba(255,255,255,.42)!important;background:#f4f8f7!important;color:#102431!important;-webkit-text-fill-color:#102431!important;caret-color:#102431;border-radius:10px;padding:10px 12px;font-size:12.5px;outline:none}
    #pd-guide-invite .pdg-input[name='email']{grid-column:1/-1}
    #pd-guide-invite .pdg-input::placeholder{color:#687b83!important;-webkit-text-fill-color:#687b83!important;opacity:1}
    #pd-guide-invite .pdg-input:focus{border-color:#c7fff8!important;box-shadow:0 0 0 3px rgba(199,255,248,.2)!important}
    #pd-guide-invite .pdg-input:-webkit-autofill,#pd-guide-invite .pdg-input:-webkit-autofill:hover,#pd-guide-invite .pdg-input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 1000px #f4f8f7 inset!important;-webkit-text-fill-color:#102431!important;caret-color:#102431!important}
    #pd-guide-invite .pdg-consent{display:flex;align-items:flex-start;gap:8px;margin:4px 1px 11px;color:rgba(255,255,255,.75);font-size:9.5px;line-height:1.4;cursor:pointer}
    #pd-guide-invite .pdg-consent input{appearance:auto;-webkit-appearance:auto;margin:2px 0 0;accent-color:var(--pdg-teal);flex:none}
    #pd-guide-invite .pdg-consent a{color:#fff;text-underline-offset:2px}
    #pd-guide-invite .pdg-submit:disabled{opacity:.62;cursor:wait;transform:none}
    #pd-guide-invite .pdg-error{display:none;margin:9px 0 0;color:#ffe0e0;font-size:10.5px;line-height:1.35}
    #pd-guide-invite .pdg-error.is-on{display:block}
    #pd-guide-invite .pdg-note{margin-top:8px;color:rgba(255,255,255,.63);font-size:8.8px;line-height:1.35;text-align:center}
    #pd-guide-invite .pdg-success{display:none}
    #pd-guide-invite[data-state='success'] .pdg-formview,#pd-guide-invite[data-state='success'] .pdg-enterpriseview{display:none}
    #pd-guide-invite[data-state='success'] .pdg-success{display:block}
    #pd-guide-invite[data-state='enterprise'] .pdg-formview,#pd-guide-invite[data-state='enterprise'] .pdg-success{display:none}
    #pd-guide-invite[data-state='enterprise'] .pdg-enterpriseview{display:block}
    #pd-guide-invite:not([data-state='enterprise']) .pdg-enterpriseview{display:none}
    #pd-guide-invite .pdg-successmark{width:46px;height:46px;border-radius:14px;background:#fff;color:var(--pdg-teal-dark);display:grid;place-items:center;font-size:24px;margin-bottom:15px;box-shadow:0 10px 25px rgba(0,0,0,.15)}
    #pd-guide-invite .pdg-secondary{justify-content:center;margin-top:9px;color:#fff;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22)}
    #pd-guide-invite .pdg-secondary:hover{background:rgba(255,255,255,.18);transform:translateY(-1px)}
    #pd-guide-invite .pdg-pill{display:none;align-items:center;gap:10px;border:1px solid rgba(95,214,201,.28);border-radius:999px;padding:8px 15px 8px 8px;background:rgba(7,17,23,.96);color:#fff;box-shadow:0 10px 28px rgba(0,0,0,.25);font-size:12px;font-weight:700;cursor:pointer;opacity:0;transform:translateY(8px);pointer-events:none;transition:opacity .25s ease,transform .25s ease}
    #pd-guide-invite.is-pill .pdg-pill{display:inline-flex;opacity:1;transform:none;pointer-events:auto}
    #pd-guide-invite.is-pill .pdg-card,#pd-guide-invite.is-pill .pdg-panel{display:none}
    #pd-guide-invite .pdg-pillicon{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:var(--pdg-teal);color:var(--pdg-ink);font-size:15px;position:relative}
    #pd-guide-invite .pdg-pillicon::after{content:'';position:absolute;right:1px;top:1px;width:6px;height:6px;border-radius:50%;background:var(--pdg-red);box-shadow:0 0 0 3px rgba(255,1,1,.12)}
    @keyframes pdgSpin{to{transform:rotate(360deg)}}
    @keyframes pdgShine{0%,48%{transform:translateX(0) skewX(-15deg)}72%,100%{transform:translateX(390%) skewX(-15deg)}}
    @keyframes pdgBookShine{0%,45%{transform:translateX(-110%)}68%,100%{transform:translateX(110%)}}
    @keyframes pdgBreath{0%,100%{box-shadow:0 24px 70px rgba(0,0,0,.26),0 6px 18px rgba(7,17,23,.12),0 0 0 4px rgba(95,214,201,.11)}50%{box-shadow:0 28px 78px rgba(0,0,0,.30),0 9px 25px rgba(23,138,124,.13),0 0 0 8px rgba(95,214,201,.09)}}
    @media(max-width:820px){#pd-guide-invite{right:12px;bottom:12px;max-width:calc(100vw - 24px)}#pd-guide-invite.is-open .pdg-card{display:none}#pd-guide-invite .pdg-panel{border-radius:20px;width:0;transform:translateY(18px)}#pd-guide-invite.is-open .pdg-panel{width:min(440px,calc(100vw - 24px));transform:none}#pd-guide-invite .pdg-panelinner{width:min(440px,calc(100vw - 24px));min-height:auto;padding:25px 24px 22px}}
    @media(max-width:520px){#pd-guide-invite .pdg-card{width:min(304px,calc(100vw - 24px));min-height:auto;padding:17px;border-radius:18px}#pd-guide-invite .pdg-bookzone{height:118px}#pd-guide-invite .pdg-book{width:59px;height:95px}#pd-guide-invite .pdg-book::before{height:88px}#pd-guide-invite .pdg-book::after{right:-48px;font-size:7px}#pd-guide-invite h2{font-size:18px!important}#pd-guide-invite .pdg-copy{font-size:11.5px}#pd-guide-invite .pdg-source{display:none}#pd-guide-invite .pdg-panel h3{font-size:21px!important}#pd-guide-invite .pdg-fields{grid-template-columns:1fr}#pd-guide-invite .pdg-input[name='email']{grid-column:auto}}
    @media(prefers-reduced-motion:reduce){#pd-guide-invite .pdg-card,#pd-guide-invite .pdg-panel,#pd-guide-invite .pdg-pill,#pd-guide-invite .pdg-book{transition:none!important;animation:none!important}#pd-guide-invite .pdg-card::before,#pd-guide-invite .pdg-shine,#pd-guide-invite .pdg-bookzone::after{animation:none!important}}
  `;
  document.head.appendChild(style);

  var checkSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l4 4L19 6"/></svg>';
  var converted = readConverted();
  var root = document.createElement('aside');
  root.id = 'pd-guide-invite';
  root.dataset.state = converted ? 'enterprise' : 'form';
  root.setAttribute('aria-label', 'Guide Réussir le virage IA');
  root.innerHTML = `
    <section class="pdg-panel" aria-hidden="true">
      <button class="pdg-close pdg-panel-close" type="button" aria-label="Fermer">&times;</button>
      <div class="pdg-panelinner">
        <div class="pdg-formview">
          <div class="pdg-panelhead">Guide pratique · Pixel Drop</div>
          <h3>130 pages pour comprendre le terrain et réussir le virage IA.</h3>
          <p class="pdg-panelcopy">Étude complète, graphiques, témoignages, profils de dirigeants et cinq cas d’usage détaillés.</p>
          <ul class="pdg-proof"><li>${checkSvg}<span>Données Bpifrance Le Lab, 1 209 dirigeants</span></li><li>${checkSvg}<span>Repères CNIL, France Num et AI Act</span></li><li>${checkSvg}<span>Méthode conçue pour les PME</span></li></ul>
          <form class="pdg-form" novalidate>
            <input type="hidden" name="_type" value="Guide Réussir le virage IA">
            <input type="text" name="_hp" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">
            <div class="pdg-fields">
              <input class="pdg-input" type="text" name="prenom" placeholder="Prénom*" autocomplete="given-name" required>
              <input class="pdg-input" type="text" name="entreprise" placeholder="Entreprise*" autocomplete="organization" required>
              <input class="pdg-input" type="email" name="email" placeholder="Email professionnel*" autocomplete="email" required>
            </div>
            <label class="pdg-consent"><input type="checkbox" name="consent" value="Oui" required><span>Je reçois le guide et j’accepte que Pixel Drop me recontacte à ce sujet. <a href="/politique-confidentialite" target="_blank" rel="noopener">Confidentialité</a></span></label>
            <button class="pdg-submit" type="submit"><span>Recevoir le guide</span><span class="pdg-arrow" aria-hidden="true">→</span></button>
            <p class="pdg-error" role="alert">L’envoi n’a pas abouti. Réessayez ou écrivez à contact@pixel-drop.com.</p>
            <p class="pdg-note">Le lien arrive aussi par email. Vos coordonnées restent chez Pixel Drop.</p>
          </form>
        </div>
        <div class="pdg-success" aria-live="polite">
          <div class="pdg-successmark">✓</div>
          <div class="pdg-panelhead">Accès confirmé</div>
          <h3>Votre guide est disponible.</h3>
          <p class="pdg-panelcopy">Téléchargez-le ci-dessous. Pour aller plus loin, découvrez comment cadrer une feuille de route IA adaptée à votre entreprise.</p>
          <a class="pdg-primary" href="${GUIDE_URL}" target="_blank" rel="noopener"><span>Télécharger le guide</span><span class="pdg-arrow" aria-hidden="true">↓</span></a>
          <a class="pdg-secondary" href="${ENTERPRISE_URL}">Découvrir Pixel Drop Enterprise</a>
        </div>
        <div class="pdg-enterpriseview">
          <div class="pdg-panelhead">Vous avez déjà le guide</div>
          <h3>Votre premier projet IA doit tenir sur une page.</h3>
          <p class="pdg-panelcopy">Découvrez comment Pixel Drop relie processus, données, outils et gouvernance dans un environnement maîtrisé.</p>
          <ul class="pdg-proof"><li>${checkSvg}<span>Agents connectés à vos outils</span></li><li>${checkSvg}<span>Accès, coûts et actions journalisés</span></li><li>${checkSvg}<span>Pilote mesurable avant industrialisation</span></li></ul>
          <a class="pdg-primary" href="${ENTERPRISE_URL}"><span>Voir Pixel Drop Enterprise</span><span class="pdg-arrow" aria-hidden="true">→</span></a>
          <a class="pdg-secondary" href="${GUIDE_URL}" target="_blank" rel="noopener">Rouvrir le guide</a>
        </div>
      </div>
    </section>
    <section class="pdg-card">
      <button class="pdg-close" type="button" aria-label="Fermer">&times;</button>
      <span class="pdg-shine" aria-hidden="true"></span>
      <div class="pdg-head"><div class="pdg-brandmark">P</div><div><div class="pdg-titleline">Réussir le virage IA</div><div class="pdg-eyebrow">Guide pratique · PME</div></div></div>
      <div class="pdg-bookzone"><div class="pdg-book"><img src="/media/guide-ia/guide-cover.webp?v=20260818-6" alt="Couverture du guide Réussir le virage IA"></div></div>
      <h2>De l’idée IA au premier résultat mesurable.</h2>
      <p class="pdg-copy">Une étude riche pour comprendre les usages, les freins et les conditions d’une transformation IA utile.</p>
      <p class="pdg-source"><i></i><span>D’après l’étude Bpifrance Le Lab publiée en juin 2025.</span></p>
      <button class="pdg-open" type="button"><span>${converted ? 'Voir la suite' : 'Accéder au guide'}</span><span class="pdg-arrow" aria-hidden="true">→</span></button>
    </section>
    <button class="pdg-pill" type="button" aria-label="Rouvrir le guide IA"><span class="pdg-pillicon">↗</span><span>Guide IA · 130 pages</span></button>`;
  document.body.appendChild(root);

  var panel = root.querySelector('.pdg-panel');
  var openButton = root.querySelector('.pdg-open');
  var closeButtons = root.querySelectorAll('.pdg-close');
  var pillButton = root.querySelector('.pdg-pill');
  var form = root.querySelector('.pdg-form');
  var submit = root.querySelector('.pdg-submit');
  var error = root.querySelector('.pdg-error');

  function openPanel() {
    clearDismissal();
    root.classList.remove('is-pill');
    root.classList.add('is-visible', 'is-open');
    panel.setAttribute('aria-hidden', 'false');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-expanded', 'true');
    if (root.dataset.state === 'form') {
      window.setTimeout(function () { form.querySelector('input[name="prenom"]').focus(); }, 420);
    }
  }

  function closePanel() {
    root.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    root.removeAttribute('role');
    root.setAttribute('aria-expanded', 'false');
  }

  function dismissCard() {
    closePanel();
    rememberDismissal();
    root.classList.remove('is-visible');
    window.setTimeout(function () { root.classList.add('is-pill'); }, 320);
  }

  openButton.addEventListener('click', openPanel);
  pillButton.addEventListener('click', openPanel);
  closeButtons.forEach(function (button) { button.addEventListener('click', dismissCard); });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    error.classList.remove('is-on');
    if (!form.reportValidity()) return;
    submit.disabled = true;
    submit.firstElementChild.textContent = 'Préparation du guide…';
    var data = new FormData(form);
    data.append('page', window.location.pathname);
    try {
      var response = await fetch('/form-handler.php', { method: 'POST', body: data });
      var result = await response.json();
      if (!response.ok || !result.ok) throw new Error('send');
      try { localStorage.setItem(CONVERTED_KEY, '1'); } catch (e) {}
      root.dataset.state = 'success';
      root.setAttribute('aria-label', 'Guide prêt à télécharger');
    } catch (e) {
      submit.disabled = false;
      submit.firstElementChild.textContent = 'Recevoir le guide';
      error.classList.add('is-on');
    }
  });

  window.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && root.classList.contains('is-open')) closePanel();
  });
  document.addEventListener('click', function (event) {
    if (root.classList.contains('is-open') && !root.contains(event.target)) closePanel();
  });

  if (previewMode === 'success') root.dataset.state = 'success';
  if (previewMode === 'form') root.dataset.state = 'form';

  if (isDismissed()) {
    root.classList.add('is-pill');
  } else {
    window.setTimeout(function () {
      root.classList.add('is-visible');
      if (previewMode === 'form' || previewMode === 'success' || previewMode === 'enterprise') openPanel();
    }, PREVIEW ? 80 : 2600);
  }
})();
