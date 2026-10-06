(() => {
  let prefs = structuredClone(window.PD_LAYOUT), queue = Promise.resolve(), drag = null, resizing = null;
  prefs.widths = {...prefs.widths};
  const defaults = {company:180,contact:210,job_title:220,phone:185,email:235,stage:165,owner:185,next_action:280};
  const defaultOrders = {contact:['company','first_name','last_name','job_title','phone','email','stage','owner_id','next_action','next_action_at'],company:['website','linkedin_url','company_linkedin_url','sector','location','employee_count','source']};
  const status = (text,error=false) => document.querySelectorAll('.layout-save-status').forEach(el=>{el.textContent=text;el.classList.toggle('is-error',error);});
  async function post(data) {
    data.set('_space',String(window.PD_SPACE));
    data.set('csrf',window.PD_CSRF);data.set('ajax','1');
    const response = await fetch(location.pathname,{method:'POST',body:data,credentials:'same-origin'});
    const result = await response.json();
    if(!response.ok||!result.ok)throw Error(result.error||'Enregistrement impossible.');
    return result;
  }
  function persist() {
    const snapshot = structuredClone(prefs);status('Enregistrement de votre vue…');
    queue = queue.then(async()=>{
      snapshot.version = prefs.version;
      const data = new FormData();data.set('action','save_layout');data.set('layout',JSON.stringify(snapshot));
      try {const result=await post(data);prefs.version=result.layout.version;status('Vue personnelle enregistrée');}
      catch(error){status(error.message,true);}
    });
  }
  function applyColumns() {
    const table=document.querySelector('[data-personal-table]');if(!table)return;
    let total=0;
    for(const [key,defaultWidth] of Object.entries(defaults)) {
      const visible=prefs.columns.includes(key), width=prefs.widths[key]||defaultWidth;if(visible)total+=width;
      table.querySelectorAll('[data-column="'+key+'"]').forEach(cell=>{
        cell.hidden=!visible;
        if(cell.tagName==='COL'||cell.tagName==='TH')cell.style.width=width+'px';
        cell.querySelector('.table-resize')?.setAttribute('aria-valuenow',String(width));
      });
    }
    table.style.width=total+'px';
  }
  function dateVisibility(root=document) {
    root.querySelectorAll('.action-cell').forEach(cell=>{
      const date=cell.querySelector('.action-date');
      date.hidden=!cell.querySelector('[data-field=next_action]').value.trim()&&!date.querySelector('input').value;
    });
  }
  function init() {
    applyColumns();dateVisibility();
    document.querySelectorAll('[data-property-group]').forEach(group=>{
      const key=group.dataset.propertyGroup;
      (prefs.orders[key]||defaultOrders[key]).forEach(field=>{
        const row=group.querySelector('[data-property="'+field+'"]');if(!row)return;
        if(!row.querySelector('.property-grip')) {
          const grip=document.createElement('button');grip.type='button';grip.className='property-grip';grip.draggable=true;grip.textContent='⠿';
          grip.title='Déplacer le champ. Au clavier : flèches haut et bas.';grip.setAttribute('aria-label','Déplacer '+(row.querySelector('span')?.textContent||field));
          row.prepend(grip);
        }
        group.append(row);
      });
    });
  }
  const chooser=document.createElement('dialog');chooser.className='columns-dialog';chooser.setAttribute('aria-label','Colonnes affichées');document.body.append(chooser);
  function openColumns() {
    chooser.replaceChildren();
    const heading=document.createElement('h2');heading.textContent='Colonnes affichées';chooser.append(heading);
    document.querySelectorAll('[data-personal-table] th[data-column]').forEach(th=>{
      const label=document.createElement('label'), box=document.createElement('input');box.type='checkbox';box.checked=prefs.columns.includes(th.dataset.column);
      const text=document.createElement('span');text.textContent=th.childNodes[0].textContent;
      box.addEventListener('change',()=>{
        if(!box.checked&&prefs.columns.length===1){box.checked=true;return;}
        prefs.columns=Object.keys(defaults).filter(key=>key===th.dataset.column?box.checked:prefs.columns.includes(key));applyColumns();persist();
      });
      label.append(box,text);chooser.append(label);
    });
    const reset=document.createElement('button');reset.type='button';reset.className='text-button';reset.textContent='Réinitialiser les colonnes';
    reset.onclick=()=>{prefs.columns=['company','contact','phone','email','stage','owner','next_action'];prefs.widths={};applyColumns();persist();chooser.close();};
    const close=document.createElement('button');close.type='button';close.className='button button-secondary';close.textContent='Terminé';close.onclick=()=>chooser.close();
    chooser.append(reset,close);chooser.showModal();
  }
  chooser.addEventListener('click',event=>{if(event.target===chooser)chooser.close();});
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-column-settings]'))openColumns();
    if(event.target.closest('[data-reset-fields]')){prefs.orders=structuredClone(defaultOrders);init();persist();}
    if(event.target.closest('.property-grip'))event.preventDefault();
  });
  function collectOrder(group) {prefs.orders[group.dataset.propertyGroup]=Array.from(group.querySelectorAll('[data-property]')).map(row=>row.dataset.property);}
  document.addEventListener('dragstart',event=>{
    const grip=event.target.closest('.property-grip');if(!grip)return;
    const row=grip.closest('[data-property]');drag={row,group:row.parentElement,order:Array.from(row.parentElement.children)};
    event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',row.dataset.property);row.classList.add('property-dragging');
  });
  document.addEventListener('dragover',event=>{
    if(!drag)return;const row=event.target.closest('[data-property]');
    if(!row||row.parentElement!==drag.group||row===drag.row)return;
    event.preventDefault();const rect=row.getBoundingClientRect();
    if(event.clientY<rect.top+rect.height/2)row.before(drag.row);else row.after(drag.row);
  });
  document.addEventListener('drop',event=>{
    if(!drag||!drag.group.contains(event.target))return;event.preventDefault();collectOrder(drag.group);drag.row.classList.remove('property-dragging');drag=null;persist();
  });
  document.addEventListener('dragend',()=>{
    if(!drag)return;drag.order.forEach(row=>drag.group.append(row));drag.row.classList.remove('property-dragging');drag=null;
  });
  function finishResize(cancel=false) {
    if(!resizing)return;const r=resizing;resizing=null;
    if(cancel)prefs.widths=r.before;else persist();
    document.body.classList.remove('resizing-columns');applyColumns();
    if(r.handle.hasPointerCapture(r.id))r.handle.releasePointerCapture(r.id);
  }
  document.addEventListener('pointerdown',event=>{
    const handle=event.target.closest('.table-resize');if(!handle||event.button!==0||resizing)return;
    event.preventDefault();event.stopPropagation();
    const th=handle.closest('th'),table=th.closest('table'),before={...prefs.widths};
    table.querySelectorAll('th[data-column]:not([hidden])').forEach(cell=>prefs.widths[cell.dataset.column]=Math.max(90,Math.min(650,Math.round(cell.getBoundingClientRect().width)||defaults[cell.dataset.column])));
    resizing={handle,id:event.pointerId,key:th.dataset.column,x:event.clientX,width:prefs.widths[th.dataset.column],before};
    handle.setPointerCapture(event.pointerId);document.body.classList.add('resizing-columns');
  });
  document.addEventListener('pointermove',event=>{
    if(!resizing||resizing.id!==event.pointerId)return;
    prefs.widths[resizing.key]=Math.max(90,Math.min(650,Math.round(resizing.width+event.clientX-resizing.x)));applyColumns();
  });
  document.addEventListener('pointerup',event=>{if(resizing?.id===event.pointerId)finishResize();});
  document.addEventListener('pointercancel',()=>finishResize(true));
  document.addEventListener('lostpointercapture',event=>{if(resizing?.id===event.pointerId)finishResize(true);});
  window.addEventListener('blur',()=>finishResize(true));
  document.addEventListener('dblclick',event=>{const handle=event.target.closest('.table-resize');if(handle){const key=handle.closest('th').dataset.column;prefs.widths[key]=defaults[key];applyColumns();persist();}});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&resizing){event.preventDefault();finishResize(true);}
    const grip=event.target.closest('.property-grip');
    if(grip&&['ArrowUp','ArrowDown'].includes(event.key)) {
      event.preventDefault();const row=grip.closest('[data-property]'),other=event.key==='ArrowUp'?row.previousElementSibling:row.nextElementSibling;
      if(other){event.key==='ArrowUp'?other.before(row):other.after(row);collectOrder(row.parentElement);persist();grip.focus();}
    }
    const handle=event.target.closest('.table-resize');
    if(handle&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
      event.preventDefault();const key=handle.closest('th').dataset.column;
      prefs.widths[key]=event.key==='Home'?90:event.key==='End'?650:Math.max(90,Math.min(650,(prefs.widths[key]||defaults[key])+(event.key==='ArrowRight'?10:-10)));
      applyColumns();persist();
    }
  });
  document.addEventListener('input',event=>{if(event.target.closest('.action-cell'))dateVisibility(event.target.closest('td'));});
  document.addEventListener('submit',async event=>{
    const form=event.target;if(!form.closest('.journal-edit'))return;
    event.preventDefault();const button=form.querySelector('button'),status=form.querySelector('.journal-edit-status');button.disabled=true;
    try {
      const result=await post(new FormData(form));form.closest('article').querySelector('.journal-detail').textContent=result.detail;
      form.elements.digest.value=result.digest;status.textContent='Enregistré';form.closest('details').open=false;
    }catch(error){status.textContent=error.message;}finally{button.disabled=false;}
  });
  window.addEventListener('commercial:controls-updated',init);
  init();
})();
