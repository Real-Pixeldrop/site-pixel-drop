(() => {
  const form = document.querySelector('.events-search');
  if (!form) return;
  form.classList.add("is-enhanced");
  const rows = [...document.querySelectorAll('.event-row')];
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr').replace(/œ/g,'oe').replace(/æ/g,'ae');
  function filter() {
    const q=normalize(form.elements.q.value.trim()), year=form.elements.year.value, category=form.elements.category.value;
    let count=0;
    rows.forEach(row => {row.hidden=Boolean((q&&!row.dataset.search.includes(q))||(year&&row.dataset.year!==year)||(category&&row.dataset.category!==category));if(!row.hidden)count++;});
    document.querySelector('#events-count').textContent=count+' événement'+(count===1?'':'s');
    document.querySelector('#events-empty').hidden=count>0;
    const params=new URLSearchParams({page:'events'});
    for(const key of ['q','year','category'])if(form.elements[key].value)params.set(key,form.elements[key].value);
    history.replaceState(null,'',location.pathname+'?'+params+location.hash);
    params.set('page','events_ics');document.querySelector('#events-export').href=location.pathname+'?'+params;
  }
  form.addEventListener('input',filter);form.addEventListener('change',filter);form.addEventListener('submit',event=>{event.preventDefault();filter();});
  const details=document.querySelector('#agenda');
  document.querySelectorAll('a[href="#agenda"]').forEach(link=>link.addEventListener('click',()=>{details.open=true;}));
  if(location.hash==='#agenda')details.open=true;
  const input=document.querySelector('[data-absolute-link]');
  if(input){
    input.value=new URL(input.value,location.href).href;
    const open=document.querySelector('#events-open-feed');
    open.href=input.value.replace(/^https?:/,'webcal:');open.textContent='Ouvrir dans Calendrier';
    document.querySelector('#events-copy-feed').addEventListener('click',async()=>{
      const status=document.querySelector('#events-copy-status');
      try{await navigator.clipboard.writeText(input.value);status.textContent='Lien copié.';}
      catch{input.focus();input.select();status.textContent='Sélectionnez et copiez le lien.';}
    });
  }
})();
