(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let viewRequest, stageBusy = false, draggedLead, draggedStage, originalStageOrder = [], toastTimer;
  const dialog = () => document.querySelector('#stage-dialog');
  const forms = () => Array.from(dialog()?.querySelectorAll('.stage-editor[data-key]') || []);
  const columnMin = 200, columnMax = 560, columnDefault = 258;
  const widthStorageKey = 'pd:commercial:columns:v1:' + location.pathname.replace(/index\.php$/, '') + ':' + (document.body.dataset.viewerId || 'anonymous');
  const columnWidths = Object.create(null);
  let columnResize = null;
  try {
    const saved = JSON.parse(localStorage.getItem(widthStorageKey) || '{}');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      for (const [key,value] of Object.entries(saved)) if (typeof value === 'number' && Number.isFinite(value)) columnWidths[key] = Math.max(columnMin,Math.min(columnMax,Math.round(value)));
    }
  } catch { /* Layout still works when browser storage is unavailable. */ }
  function setColumnWidth(column, width) {
    const value = Math.max(columnMin,Math.min(columnMax,Math.round(width)));
    column.style.width = value + 'px';
    column.querySelector('.column-resize-handle')?.setAttribute('aria-valuenow',String(value));
    return value;
  }
  function restoreColumnWidths(root = document) {
    root.querySelectorAll('.kanban-column').forEach(column => setColumnWidth(column,columnWidths[column.dataset.stage] ?? columnDefault));
  }
  function rememberColumnWidth(column) {
    columnWidths[column.dataset.stage] = Math.round(column.getBoundingClientRect().width);
    try { localStorage.setItem(widthStorageKey,JSON.stringify(columnWidths)); }
    catch { notify('Largeur appliquée. Ce navigateur ne permet pas de la mémoriser.',true); }
  }
  function finishColumnResize(cancel = false) {
    if (!columnResize) return;
    const resize = columnResize; columnResize = null;
    if (cancel) setColumnWidth(resize.column,resize.startWidth); else rememberColumnWidth(resize.column);
    resize.column.classList.remove('is-resizing'); document.body.classList.remove('resizing-columns');
    if (resize.handle.hasPointerCapture(resize.pointerId)) resize.handle.releasePointerCapture(resize.pointerId);
  }
  document.addEventListener('pointerdown',event => {
    const handle = event.target.closest('.column-resize-handle');
    if (!handle || event.button !== 0 || columnResize || draggedLead || draggedStage) return;
    event.preventDefault(); event.stopPropagation();
    const column = handle.closest('.kanban-column'), board = column.closest('.kanban');
    columnResize = {handle,column,board,pointerId:event.pointerId,startX:event.clientX,startWidth:column.getBoundingClientRect().width,startScroll:board.scrollLeft};
    handle.setPointerCapture(event.pointerId); handle.focus({preventScroll:true});
    column.classList.add('is-resizing'); document.body.classList.add('resizing-columns');
  });
  document.addEventListener('pointermove',event => {
    if (!columnResize || event.pointerId !== columnResize.pointerId) return;
    const r = columnResize;
    setColumnWidth(r.column,r.startWidth + event.clientX-r.startX + r.board.scrollLeft-r.startScroll);
  });
  document.addEventListener('pointerup',event => { if (columnResize?.pointerId === event.pointerId) finishColumnResize(); });
  document.addEventListener('pointercancel',event => { if (columnResize?.pointerId === event.pointerId) finishColumnResize(true); });
  document.addEventListener('lostpointercapture',event => { if (columnResize?.pointerId === event.pointerId) finishColumnResize(true); });
  window.addEventListener('blur',() => finishColumnResize(true));
  document.addEventListener('dblclick',event => {
    const handle = event.target.closest('.column-resize-handle'); if (!handle) return;
    event.preventDefault(); const column = handle.closest('.kanban-column'); setColumnWidth(column,columnDefault); rememberColumnWidth(column);
  });
  document.addEventListener('keydown',event => {
    if (columnResize && event.key === 'Escape') { event.preventDefault(); finishColumnResize(true); return; }
    const handle = event.target.closest('.column-resize-handle');
    if (!handle || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault(); const column = handle.closest('.kanban-column');
    const value = event.key === 'Home' ? columnMin : event.key === 'End' ? columnMax : column.getBoundingClientRect().width + (event.key === 'ArrowRight' ? 1 : -1) * (event.shiftKey ? 40 : 10);
    setColumnWidth(column,value); rememberColumnWidth(column);
  });
  restoreColumnWidths();
  function updateOwnerPhoto(select) {
    const avatar = select.closest('.owner-picker')?.querySelector('.avatar'), option = select.selectedOptions[0];
    if (!avatar || !option) return;
    avatar.querySelector('.avatar-initial').textContent = option.dataset.initial || '·';
    avatar.querySelector('img')?.remove();
    if (option.dataset.photo) {
      const img = document.createElement('img'); img.src = option.dataset.photo; img.alt = ''; img.width = 26; img.height = 26; avatar.append(img);
    }
  }
  document.addEventListener('error', event => { if (event.target.matches?.('.avatar img')) event.target.remove(); }, true);

  let propertyQueue = Promise.resolve(), pendingEdits = 0, formDirty = false;
  const leadForm = document.querySelector('.lead-form, .company-form');
  const formSnapshot = () => leadForm ? JSON.stringify(Array.from(new FormData(leadForm)).sort((a,b)=>a[0].localeCompare(b[0]))) : '';
  const initialFormSnapshot = formSnapshot();
  function refreshFormState() {
    if(!leadForm)return;
    formDirty = formSnapshot() !== initialFormSnapshot;
    leadForm.classList.toggle('has-changes',formDirty);
    leadForm.querySelector('.form-save-status').textContent = formDirty ? 'Modifications non enregistrées' : 'Les changements sont partagés après enregistrement.';
  }
  let pickerTarget = null;
  const stagePicker = () => document.querySelector('#stage-picker');
  function syncStageButtons(root = document) {
    root.querySelectorAll('.stage-picker-field').forEach(field => {
      const select = field.querySelector('select'), trigger = field.querySelector('.stage-picker-trigger'), option = select.selectedOptions[0];
      if (!trigger || !option) return;
      const color = option.dataset.tone || forms().find(form => form.dataset.key === select.value)?.elements.color.value || 'slate';
      select.hidden = true; trigger.hidden = false; trigger.disabled = select.disabled;
      trigger.textContent = option.textContent; trigger.className = 'stage-picker-trigger tone-' + color;
    });
  }
  function closeStagePicker() {
    stagePicker()?.close();
    pickerTarget?.closest('.stage-picker-field')?.querySelector('button').setAttribute('aria-expanded','false');
  }
  function filterStageChoices() {
    const picker = stagePicker(), search = picker.querySelector('input').value.trim().toLocaleLowerCase('fr');
    let count = 0;
    picker.querySelectorAll('.stage-choice-row').forEach(row => { row.hidden = !row.dataset.label.includes(search); if (!row.hidden) count++; });
    picker.querySelector('.stage-picker-empty').hidden = count > 0;
  }
  function openStagePicker(trigger) {
    const picker = stagePicker(), select = trigger.closest('.stage-picker-field').querySelector('select');
    if (!picker || select.disabled) return;
    pickerTarget = select; picker.querySelector('input').value = '';
    const options = picker.querySelector('.stage-picker-options'); options.replaceChildren();
    forms().forEach(form => {
      const key = form.dataset.key, label = form.elements.label.dataset.saved, color = form.elements.color.value;
      const row = document.createElement('div'); row.className = 'stage-choice-row'; row.dataset.label = label.toLocaleLowerCase('fr');
      const choice = document.createElement('button'); choice.type = 'button'; choice.className = 'stage-choice'; choice.dataset.chooseStage = key; choice.setAttribute('aria-pressed',String(select.value === key));
      const tag = document.createElement('span'); tag.className = 'status-chip tone-' + color; tag.textContent = label;
      const check = document.createElement('span'); check.className = 'stage-choice-check'; check.setAttribute('aria-hidden','true'); check.textContent = select.value === key ? '✓' : '';
      choice.append(tag,check);
      const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'stage-choice-edit'; edit.dataset.editPickerStage = key; edit.textContent = '···'; edit.title = 'Modifier le nom ou la couleur'; edit.setAttribute('aria-label','Modifier '+label);
      row.append(choice,edit); options.append(row);
    });
    filterStageChoices(); picker.showModal(); trigger.setAttribute('aria-expanded','true');
    const rect = trigger.getBoundingClientRect(), height = picker.getBoundingClientRect().height;
    picker.style.left = Math.max(12,Math.min(rect.left,innerWidth-picker.offsetWidth-12))+'px';
    picker.style.top = Math.max(12,Math.min(rect.bottom+5,innerHeight-height-12))+'px';
    if (matchMedia('(max-width:760px)').matches) (options.querySelector('[aria-pressed="true"]') || options.querySelector('button') || picker.querySelector('[data-close-stage-picker]')).focus({preventScroll:true});
    else picker.querySelector('input').focus({preventScroll:true});
  }
  document.addEventListener('click',async event => {
    const trigger = event.target.closest('.stage-picker-trigger');
    if (trigger) {
      event.preventDefault(); await propertyQueue;
      if (hasUnsaved()) { notify('Enregistrez ou annulez la cellule en erreur avant de changer l’étape.',true); return; }
      openStagePicker(trigger); return;
    }
    if (event.target.closest('[data-close-stage-picker]') || event.target === stagePicker()) { closeStagePicker(); return; }
    const choice = event.target.closest('[data-choose-stage]');
    if (choice && pickerTarget?.isConnected) {
      const select = pickerTarget; closeStagePicker();
      if (select.value !== choice.dataset.chooseStage) { select.value = choice.dataset.chooseStage; select.dispatchEvent(new Event('change',{bubbles:true})); }
      syncStageButtons(); return;
    }
    const edit = event.target.closest('[data-edit-picker-stage]');
    if (edit) { closeStagePicker(); openStages(edit.dataset.editPickerStage); return; }
    if (event.target.closest('[data-picker-create]')) { closeStagePicker(); openStages('',true); return; }
    if (event.target.closest('[data-picker-organize]')) { closeStagePicker(); openStages(); }
  });
  document.addEventListener('input',event => { if (event.target.matches('.stage-picker-search')) filterStageChoices(); });
  document.addEventListener('keydown',event => {
    if (!event.target.closest('#stage-picker')) return;
    const choices = Array.from(stagePicker().querySelectorAll('.stage-choice-row:not([hidden]) .stage-choice'));
    if (event.key === 'Enter' && event.target.matches('.stage-picker-search')) { event.preventDefault(); choices[0]?.click(); }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); const index = choices.indexOf(document.activeElement), next = index + (event.key === 'ArrowDown' ? 1 : -1);
      choices[Math.max(0,Math.min(choices.length-1,next))]?.focus();
    }
  });
  stagePicker()?.addEventListener('close',() => pickerTarget?.closest('.stage-picker-field')?.querySelector('button').setAttribute('aria-expanded','false'));
  syncStageButtons();
  const hasUnsaved = () => pendingEdits > 0 || Boolean(document.querySelector('.cell-input.is-unsaved'));
  function tableStatus(text, error = false) {
    const status = document.querySelector('#table-save-status');
    if (status) { status.textContent = text; status.classList.toggle('is-error', error); }
  }
  function saveProperty(input) {
    const row = input.closest('.contact-row'), value = input.value.trim();
    if (!row || value === input.dataset.saved) { if (value === input.dataset.saved) input.classList.remove('is-unsaved'); return; }
    if (!input.reportValidity()) { input.classList.add('is-unsaved'); return; }
    if (input.dataset.pending === value) return;
    input.dataset.pending = value; pendingEdits++; input.classList.add('is-unsaved'); tableStatus('Enregistrement…');
    propertyQueue = propertyQueue.then(async () => {
      const data = new FormData(); data.set('action','update_contact_property'); data.set('lead_id',row.dataset.leadId);
      data.set('edit_version',row.dataset.version); data.set('field',input.dataset.field); data.set('value',value);
      try {
        const result = await post(data);
        row.dataset.version = result.version;
        row.querySelectorAll('[data-version]').forEach(control => control.dataset.version = result.version);
        input.dataset.saved = String(result.value); input.removeAttribute('aria-invalid');
        if (input.value.trim() === value) { input.value = result.value; input.classList.remove('is-unsaved'); }
        if (['phone','email'].includes(input.dataset.field)) {
          const link = input.parentElement.querySelector('.contact-channel-action'), saved = String(result.value || '').trim();
          if (link) {
            const phone = input.dataset.field === 'phone';
            link.hidden = !saved || Boolean(row.querySelector('.contact-stop'));
            if (link.hidden) link.removeAttribute('href');
            else if (phone) link.href = 'tel:' + saved.replace(/[^+0-9]/g,'');
            else if (document.querySelector('.main-nav a[aria-label="Email"]')) { const target=new URL(location.pathname,location.origin); target.search=new URLSearchParams({page:'email',compose:'1',recipient:saved}); link.href=target.href; }
            else link.href = 'mailto:' + encodeURIComponent(saved);
            link.setAttribute('aria-label',(phone ? 'Appeler' : 'Écrire un email') + ' : ' + saved);
          }
        }
        tableStatus('Enregistré');
      } catch(error) {
        input.setAttribute('aria-invalid','true'); tableStatus('Non enregistré. Votre saisie reste visible.',true); notify(error.message,true);
      } finally { delete input.dataset.pending; pendingEdits--; }
    });
  }

  function notify(message, error = false) {
    let box = document.querySelector('#workspace-toast');
    if (!box) { box = document.createElement('div'); box.id = 'workspace-toast'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.append(box); }
    box.textContent = message; box.classList.toggle('is-error', error); box.classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => box.classList.remove('visible'), error ? 9000 : 3000);
  }
  async function post(data) {
    data.set('csrf', window.PD_CSRF); data.set('ajax', '1');
    const response = await fetch(window.location.pathname, { method: 'POST', body: data, credentials: 'same-origin' });
    let result;
    try { result = await response.json(); } catch { throw new Error('Session expirée ou serveur indisponible. Rechargez la page.'); }
    if (!response.ok || !result.ok) throw new Error(result.error || 'La modification n’a pas été enregistrée.');
    return result;
  }
  function selectView(view) {
    document.querySelectorAll('.view-icons a').forEach(link => {
      const active = new URL(link.href).searchParams.get('page') === view;
      link.classList.toggle('selected', active);
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
  }
  async function loadView(destination, push = false) {
    if (hasUnsaved()) { notify('Terminez ou annulez les cellules non enregistrées avant de changer de vue.',true); return false; }
    const target = new URL(destination, location.href), current = document.querySelector('#workspace-view');
    if (target.origin !== location.origin) return;
    if (!current) { location.assign(target.href); return; }
    viewRequest?.abort(); const request = new AbortController(); viewRequest = request;
    const oldView = current.dataset.view, scrollX = current.querySelector('.kanban')?.scrollLeft || 0;
    selectView(target.searchParams.get('page') || 'pipeline'); current.setAttribute('aria-busy', 'true');
    let skeleton;
    const loadingTimer = setTimeout(() => {
      if(viewRequest!==request||!current.isConnected)return;
      skeleton=document.createElement('div');skeleton.className='workspace-skeleton';skeleton.setAttribute('role','status');skeleton.setAttribute('aria-label','Chargement des contacts');
      for(let i=0;i<7;i++){const line=document.createElement('span');skeleton.append(line);}
      current.append(skeleton);current.classList.add('is-loading');current.inert=true;
    },120);
    try {
      const response = await fetch(target.href, { signal: request.signal, credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) throw new Error('La vue ne s’est pas chargée. Réessayez.');
      const parsed = new DOMParser().parseFromString(await response.text(), 'text/html'), next = parsed.querySelector('#workspace-view');
      if (!next) { location.assign(response.url); return; }
      if (request.signal.aborted) return;
      current.replaceWith(next);
      restoreColumnWidths(next);
      if (next.querySelector('.kanban')) next.querySelector('.kanban').scrollLeft = scrollX;
      document.querySelector('.result-count').textContent = parsed.querySelector('.result-count').textContent;
      document.querySelector('.workspace-search [name=page]').value = next.dataset.view;
      ['q','focus','stage','action_period'].forEach(name => {
        const field = document.querySelector('.workspace-search [name='+name+']');
        if (field) field.value = parsed.querySelector('.workspace-search [name='+name+']').value;
      });
      if (dialog() && !dialog().open) dialog().innerHTML = parsed.querySelector('#stage-dialog').innerHTML;
      syncStageButtons();
      // Preserve the switch DOM so its background can slide continuously during the request.
      window.dispatchEvent(new Event('commercial:controls-updated'));
      document.querySelectorAll('.view-icons a').forEach((link, index) => { link.href = parsed.querySelectorAll('.view-icons a')[index].href; });
      document.title = parsed.title;
      if (push) history.pushState({ workspace: true }, '', target.href);
      if (!reducedMotion.matches) next.animate([{ opacity: .4, transform:'translateY(3px)' }, { opacity: 1, transform:'translateY(0)' }], { duration: 180, easing: 'ease-out' });
      return true;
    } catch (error) {
      if (error.name !== 'AbortError') { selectView(oldView); current.removeAttribute('aria-busy'); notify(error.message, true); }
      return false;
    } finally {
      clearTimeout(loadingTimer);skeleton?.remove();
      if(viewRequest===request){current.classList.remove('is-loading');current.inert=false;}
    }
  }
  function stageStatus(message, error = false) {
    const status = dialog()?.querySelector('.stage-save-status');
    if (status) { status.textContent = message; status.classList.toggle('is-error', error); }
  }
  function lockStages(locked) {
    stageBusy = locked;
    dialog()?.querySelectorAll('input,button:not([data-close-dialog])').forEach(control => { control.disabled = locked; });
    dialog()?.classList.toggle('saving', locked);
  }
  function openStages(key = '', add = false) {
    if (!dialog()) return;
    dialog().classList.toggle('single-stage', Boolean(key));
    dialog().querySelector('#stages-title').textContent = key ? 'Modifier l’étape' : 'Étapes du pipeline';
    dialog().querySelector('.dialog-intro').textContent = key ? 'Modifiez le nom ou la couleur. Les flèches déplacent la colonne.' : 'Renommez au clic, choisissez une couleur, glissez pour réorganiser.';
    forms().forEach(form => { form.hidden = Boolean(key) && form.dataset.key !== key; });
    if (!dialog().open) dialog().showModal();
    const form = add ? dialog().querySelector('.stage-add') : forms().find(form => !form.hidden);
    if (form) { form.scrollIntoView({ block: 'nearest' }); form.querySelector('[name=label]').focus({ preventScroll: true }); if (key) form.querySelector('[name=label]').select(); }
  }
  function applyStages(rows) {
    rows.forEach(row => {
      const form = forms().find(form => form.dataset.key === row.stage_key);
      if (form) {
        form.elements.stage_version.value = row.edit_version; form.elements.position.value = row.position;
        form.elements.label.value = row.label; form.elements.label.dataset.saved = row.label; form.elements.color.value = row.color;
        form.querySelector('.color-picker summary').className = 'color-dot tone-' + row.color;
        form.querySelectorAll('[data-stage-color]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.stageColor === row.color)));
        form.querySelector('.color-picker').open = false; dialog().querySelector('.stage-editor-list').append(form);
      }
    });
    document.querySelectorAll('.stage-select, .detail-stage-select, .workspace-search [name=stage]').forEach(select => {
      const value = select.value; select.replaceChildren();
      if (select.closest('.workspace-search')) select.add(new Option('Toutes les étapes', ''));
      rows.forEach(row => { const option = new Option(row.label,row.stage_key); option.dataset.tone = row.color; select.add(option); }); select.value = value;
      const row = rows.find(row => row.stage_key === value);
      if (select.classList.contains('stage-select') && row) select.className = 'stage-select tone-' + row.color;
    });
    syncStageButtons();
    const board = document.querySelector('.kanban');
    rows.forEach(row => {
      const column = Array.from(board?.querySelectorAll('.kanban-column') || []).find(col => col.dataset.stage === row.stage_key);
      if (column) { const label = column.querySelector('.stage-name'); label.textContent = row.label; label.className = 'stage-name tone-' + row.color; board.insertBefore(column, board.querySelector('.add-column')); }
    });
  }
  async function saveStage(form) {
    if (stageBusy || !form.reportValidity()) return;
    const data = new FormData(form), isNew = !form.dataset.key;
    lockStages(true); stageStatus('Enregistrement…');
    try {
      const result = await post(data);
      if (isNew) {
        const parsed = new DOMParser().parseFromString(result.editor, 'text/html');
        dialog().innerHTML = parsed.querySelector('#stage-dialog').innerHTML; dialog().classList.remove('single-stage');
      }
      applyStages(result.stages); stageStatus('Enregistré');
      if (isNew && document.querySelector('#workspace-view')) await loadView(location.href);
    } catch (error) { stageStatus(error.message, true); notify(error.message, true); }
    finally { lockStages(false); }
  }
  async function persistOrder(previous) {
    if (stageBusy) return;
    const rows = forms(), keys = rows.map(form => form.dataset.key);
    if (keys.join() === previous.join()) return;
    const data = new FormData(); data.set('action', 'reorder_stages'); data.set('keys', JSON.stringify(keys));
    data.set('versions', JSON.stringify(Object.fromEntries(rows.map(form => [form.dataset.key, Number(form.elements.stage_version.value)]))));
    lockStages(true); stageStatus('Enregistrement…');
    try { const result = await post(data); applyStages(result.stages); stageStatus('Ordre enregistré'); }
    catch (error) { previous.forEach(key => { const form = rows.find(row => row.dataset.key === key); if (form) dialog().querySelector('.stage-editor-list').append(form); }); stageStatus(error.message, true); notify(error.message, true); }
    finally { lockStages(false); }
  }
  async function saveDirtyNames() {
    for (const form of forms()) {
      if (form.elements.label.value.trim() !== form.elements.label.dataset.saved) {
        await saveStage(form);
        if (form.elements.label.value.trim() !== form.elements.label.dataset.saved) return false;
      }
    }
    return true;
  }
  document.addEventListener('click', async event => {
    const view = event.target.closest('.view-icons a');
    if (view && !event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) { event.preventDefault(); loadView(view.href, true); return; }
    const open = event.target.closest('[data-open-stages]');
    if (open) { openStages(open.dataset.stageKey || '', open.hasAttribute('data-new-stage')); return; }
    if (event.target.closest('[data-close-dialog]')) { if (!stageBusy && await saveDirtyNames()) dialog().close(); return; }
    if (event.target.closest('[data-all-stages]')) { if (!stageBusy && await saveDirtyNames()) openStages(); return; }
    const color = event.target.closest('[data-stage-color]');
    if (color && !stageBusy) { const form = color.closest('form'); form.elements.color.value = color.dataset.stageColor; saveStage(form); return; }
    const arrow = event.target.closest('[data-stage-direction]');
    if (arrow && !stageBusy) {
      if (!await saveDirtyNames()) return;
      const form = arrow.closest('form'), rows = forms(), index = rows.indexOf(form), direction = Number(arrow.dataset.stageDirection), other = rows[index + direction];
      if (other) { const order = rows.map(row => row.dataset.key); if (direction < 0) other.before(form); else other.after(form); persistOrder(order); }
      return;
    }
    const row = event.target.closest('.contact-row');
    if (row && !event.target.closest('a,button,input,select,textarea,label,summary') && !window.getSelection()?.toString()) {
      if (event.ctrlKey || event.metaKey) window.open(row.dataset.href, '_blank', 'noopener'); else location.assign(row.dataset.href);
    }
  });
  document.addEventListener('submit', event => {
    if (event.target.matches('.stage-editor')) { event.preventDefault(); saveStage(event.target); }
    if (event.target.matches('.workspace-search')) {
      event.preventDefault(); const target = new URL(location.href); target.search = new URLSearchParams(new FormData(event.target)).toString(); loadView(target.href,true);
    }
    if (event.target.matches('.lead-form, .company-form')) {
      formDirty = false;
      event.target.querySelector('.form-save-status').textContent = 'Enregistrement…';
      event.target.querySelector('button[type=submit]').disabled = true;
    }
  });
  document.addEventListener('input', event => {
    if (event.target.matches('.cell-input')) {
      event.target.classList.toggle('is-unsaved',event.target.value.trim() !== event.target.dataset.saved);
    }
    if (event.target.closest('.lead-form, .company-form')) {
      refreshFormState();
    }
  });
  document.addEventListener('keydown',event => {
    const input = event.target;
    if (!input.matches('.cell-input')) return;
    if (event.key === 'Enter') { event.preventDefault(); input.blur(); }
    if (event.key === 'Escape' && !input.dataset.pending) {
      input.value = input.dataset.saved; input.classList.remove('is-unsaved'); input.removeAttribute('aria-invalid'); if (input.matches('[data-owner-picker]')) updateOwnerPhoto(input); input.blur(); tableStatus('Modification annulée');
    }
  });
  window.addEventListener('beforeunload',event => { if (hasUnsaved() || formDirty) { event.preventDefault(); event.returnValue = ''; } });
  document.addEventListener('focusout', event => {
    const input = event.target;
    if (input.matches('.cell-input[data-field]')) { saveProperty(input); return; }
    if (!input.matches('.stage-title-input') || stageBusy || input.value.trim() === input.dataset.saved) return;
    if (event.relatedTarget?.closest('[data-close-dialog],[data-all-stages]')) return;
    if (event.relatedTarget?.closest('.stage-editor') === input.closest('form') && !event.relatedTarget.matches('.stage-title-input')) return;
    saveStage(input.closest('form'));
  });
  document.addEventListener('keydown', event => { if (event.target.matches('.stage-title-input') && event.key === 'Escape') event.target.value = event.target.dataset.saved; });
  document.addEventListener('change', async event => {
    const select = event.target;
    if (select.matches('[data-owner-picker]')) updateOwnerPhoto(select);
    if (select.matches('.detail-stage-select')) {
      select.className = 'detail-stage-select tone-' + (select.selectedOptions[0]?.dataset.tone || 'slate');
    }
    if (select.matches('.cell-input[data-field]') && select.tagName === 'SELECT') { saveProperty(select); return; }
    if (select.closest('.lead-form, .company-form')) refreshFormState();
    if (select.matches('.workspace-search select')) { select.form.requestSubmit(); return; }
    if (select.matches('.stage-select')) {
      await propertyQueue;
      if (hasUnsaved()) { select.value = select.dataset.original; syncStageButtons(); notify('Enregistrez ou annulez d’abord la cellule en erreur.',true); return; }
      const data = new FormData(); data.set('action', 'move_lead'); data.set('lead_id', select.dataset.leadId); data.set('stage', select.value); data.set('edit_version', select.dataset.version); select.disabled = true; syncStageButtons();
      try {
        await post(data);
        const row = select.closest('.contact-row');
        if (row) {
          row.dataset.version = Number(row.dataset.version)+1; select.dataset.version = row.dataset.version;
          select.dataset.original = select.value; select.disabled = false;
          const stageForm = forms().find(form => form.dataset.key === select.value);
          select.className = 'stage-select tone-' + (stageForm?.elements.color.value || 'slate');
          tableStatus('Étape enregistrée');
        } else await loadView(location.href);
        notify('Étape enregistrée');
      }
      catch (error) { select.value = select.dataset.original; select.disabled = false; notify(error.message, true); }
      finally { syncStageButtons(); }
    }
    if (select.matches('.drop-file input[type=file]') && select.files[0]) document.querySelector('.drop-file strong').textContent = select.files[0].name;
  });
  document.addEventListener('dragstart', event => {
    const grip = event.target.closest('.stage-grip');
    if (grip && !stageBusy) {
      if (forms().some(form => form.elements.label.value.trim() !== form.elements.label.dataset.saved)) { event.preventDefault(); saveDirtyNames(); return; }
      draggedStage = grip.closest('form'); originalStageOrder = forms().map(form => form.dataset.key); event.dataTransfer.setData('text/plain', draggedStage.dataset.key); event.dataTransfer.effectAllowed = 'move'; draggedStage.classList.add('dragging'); return;
    }
    const card = event.target.closest('.deal-card[draggable=true]');
    if (card) { if (card.dataset.saving) { event.preventDefault(); return; } draggedLead = card; card.classList.add('dragging'); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', card.dataset.id); }
  });
  document.addEventListener('dragover', event => {
    if (draggedStage) {
      const row = event.target.closest('.stage-editor[data-key]');
      if (row && row !== draggedStage) { event.preventDefault(); const box = row.getBoundingClientRect(); if (event.clientY < box.top + box.height / 2) row.before(draggedStage); else row.after(draggedStage); }
      if (event.target.closest('.stage-editor-list')) event.preventDefault(); return;
    }
    const column = event.target.closest('.kanban-column'); if (draggedLead && column) { event.preventDefault(); column.classList.add('drag-over'); }
  });
  document.addEventListener('dragleave', event => { const column = event.target.closest('.kanban-column'); if (column && !column.contains(event.relatedTarget)) column.classList.remove('drag-over'); });
  document.addEventListener('drop', async event => {
    if (draggedStage) {
      if (event.target.closest('.stage-editor-list')) { event.preventDefault(); const previous = originalStageOrder; draggedStage.classList.remove('dragging'); draggedStage = null; persistOrder(previous); } return;
    }
    const column = event.target.closest('.kanban-column'); if (!draggedLead || !column) return;
    event.preventDefault(); column.classList.remove('drag-over');
    const card = draggedLead, oldZone = card.parentElement, oldNext = card.nextSibling;
    if (oldZone.closest('.kanban-column') === column) return;
    card.dataset.saving = '1';
    column.querySelector('.kanban-dropzone').prepend(card);
    const data = new FormData(); data.set('action', 'move_lead'); data.set('lead_id', card.dataset.id); data.set('stage', column.dataset.stage); data.set('edit_version', card.dataset.version);
    try { await post(data); const refreshed = await loadView(location.href); notify(refreshed ? 'Contact déplacé' : 'Contact déplacé. Rechargez la page pour actualiser la vue.', !refreshed); }
    catch (error) { delete card.dataset.saving; oldZone.insertBefore(card, oldNext); notify(error.message, true); }
  });
  document.addEventListener('dragend', () => {
    if (draggedStage) { const rows = forms(); originalStageOrder.forEach(key => { const row = rows.find(form => form.dataset.key === key); if (row) dialog().querySelector('.stage-editor-list').append(row); }); }
    draggedStage = null; draggedLead = null; document.querySelectorAll('.dragging,.drag-over').forEach(element => element.classList.remove('dragging', 'drag-over'));
  });
  window.addEventListener('popstate', () => loadView(location.href));
  if (new URLSearchParams(location.search).get('edit_stages') === '1') openStages();
})();
