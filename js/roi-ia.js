/* Pixel Drop ROI, modèle pédagogique année 1. Aucune transmission ni persistance des saisies. */
(function (root) {
  'use strict';
  const defaults = {people:10,weekly:25,weeks:44,rate:40,before:10,after:6,low:30,central:60,high:85,delay:0,setup:7200,internal:30,monthly:300,cashShare:0,other:0};
  const presets = {
    email:{label:'Traitement des emails',description:'Exemple fictif : classer un email et préparer une réponse validée. 10 personnes, 25 emails chacune par semaine, 10 minutes avant et 6 minutes après, contrôle compris.',values:{...defaults}},
    documents:{label:'Recherche documentaire',description:'Exemple fictif : retrouver une information et vérifier sa source. 20 personnes, 10 recherches chacune par semaine, 12 minutes avant et 5 minutes après, vérification comprise.',values:{...defaults,people:20,weekly:10,before:12,after:5,setup:9000,internal:40,monthly:450}},
    reports:{label:'Comptes rendus',description:'Exemple fictif : préparer et valider un compte rendu après réunion. Le temps de réunion ne disparaît pas. 8 personnes, 3 comptes rendus chacune par semaine, 30 minutes avant et 12 minutes après.',values:{...defaults,people:8,weekly:3,before:30,after:12,setup:3500,internal:16,monthly:150}}
  };
  function calculate(v, adoption) {
    const activeMonths=12-v.delay;
    const volume=v.people*v.weekly*v.weeks*adoption/100*activeMonths/12;
    const hours=volume*(v.before-v.after)/60;
    const capacity=hours*v.rate;
    const initial=v.setup+v.internal*v.rate;
    const cost=initial+12*v.monthly;
    const benefit=capacity+v.other;
    const cash=Math.max(0,capacity)*v.cashShare/100+v.other;
    const net=benefit-cost;
    const monthlyNet=activeMonths>0?cash/activeMonths-v.monthly:0;
    const payback=monthlyNet>0?v.delay+(initial+v.delay*v.monthly)/monthlyNet:null;
    const requiredMinutes=volume>0&&v.rate>0?Math.max(0,(cost-v.other))*60/(volume*v.rate):null;
    return {adoption,volume,hours,capacity,initial,cost,benefit,cash,net,roi:cost>0?net/cost*100:null,cashRoi:cost>0?(cash-cost)/cost*100:null,payback,requiredMinutes};
  }
  function validate(v) {
    if(Object.keys(defaults).some(k=>!Number.isFinite(v[k])||v[k]<0)) return 'Complétez tous les champs avec des nombres positifs ou nuls.';
    if(v.people<1||v.weeks<1||v.weeks>52||v.delay>12) return 'Indiquez au moins une personne, 1 à 52 semaines et un délai de 0 à 12 mois.';
    if([v.low,v.central,v.high,v.cashShare].some(n=>n>100)) return 'Les pourcentages doivent être compris entre 0 et 100.';
    if(v.low>v.central||v.central>v.high) return 'Gardez une adoption croissante : prudent ≤ central ≤ favorable.';
    if(v.delay===12&&v.other>0) return 'Avec un lancement après 12 mois, aucune dépense évitée liée au projet ne peut être comptée en année 1.';
    return '';
  }
  if(typeof module==='object'&&module.exports) {module.exports={calculate,validate,defaults,presets};return;}
  const form=document.getElementById('roi-form');if(!form)return;
  const $=id=>document.getElementById(id);
  const nf=new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1});
  const money=n=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n).replace(/[\u00a0\u202f]/g,' ');
  const num=n=>nf.format(n).replace(/[\u00a0\u202f]/g,' ');
  const percent=n=>n===null?'Non calculable':num(n)+' %';
  let current=defaults,rows=[],selected='email',valid=true;
  function getValues(){return Object.fromEntries(Object.keys(defaults).map(k=>[k,form.elements[k].value===''?NaN:Number(form.elements[k].value)]));}
  function render(){
    current=getValues();
    const invalidField=Array.from(form.elements).find(el=>el.tagName==='INPUT'&&!el.validity.valid);
    const error=validate(current)||(invalidField?'Vérifiez les bornes et le pas de saisie du champ signalé.':'');
    Array.from(form.elements).forEach(el=>{if(el.tagName==='INPUT')el.setAttribute('aria-invalid',String(!el.validity.valid));});
    valid=!error;$('roi-error').textContent=error;$('roi-error').hidden=!error;$('roi-output').hidden=!valid;$('roi-csv').disabled=!valid;$('roi-print').disabled=!valid;
    if(!valid){$('roi-scenarios').replaceChildren();$('roi-status').textContent='Corrigez les champs pour recalculer.';return;}
    rows=[['Prudent',current.low],['Central',current.central],['Favorable',current.high]].map(([label,a])=>({label,...calculate(current,a)}));
    const r=rows[1];
    $('roi-hours').textContent=num(r.hours)+' h';$('roi-hours-caption').textContent=r.hours<0?'Temps supplémentaire nécessaire':'Sur les 12 premiers mois';
    $('roi-capacity').textContent=money(r.capacity);$('roi-other').textContent=money(current.other);$('roi-cost').textContent=money(r.cost);$('roi-net').textContent=money(r.net);$('roi-roi').textContent=percent(r.roi);$('roi-cash').textContent=money(r.cash);$('roi-cash-roi').textContent=percent(r.cashRoi);
    $('roi-payback').textContent=r.cost===0?'Aucun coût saisi : pas de délai de compensation à calculer.':r.payback!==null&&r.payback<=12?'Coût complet compensé vers le mois '+num(r.payback)+', sous ces hypothèses.':'Coût complet non compensé par les dépenses évitées sur ces 12 mois.';
    $('roi-verdict').textContent=r.hours<0?'La méthode prend plus de temps. Revoyez le périmètre et le processus avant de déployer.':r.net<0?'Même en valorisant le temps, le bénéfice ne couvre pas le coût de la première année.':r.cash<r.cost?'Le gain est surtout une capacité de travail disponible. Son usage reste à démontrer.':'Les dépenses évitées couvriraient le coût complet. Vérifiez leur réalité sur le terrain.';
    $('roi-threshold').textContent=r.requiredMinutes===null?'Seuil non calculable sans volume traité et coût horaire positif.':'Pour couvrir le coût en valorisant le temps : '+num(r.requiredMinutes)+' min à gagner par tâche assistée.'+(r.requiredMinutes>current.before?' Ce seuil dépasse le temps actuel de la tâche.':'');
    $('roi-net').dataset.tone=r.net<0?'negative':'positive';
    $('roi-scenarios').replaceChildren(...rows.map(r=>{const tr=document.createElement('tr');[r.label,num(r.adoption)+' %',num(r.hours)+' h',money(r.net),percent(r.roi),percent(r.cashRoi)].forEach((value,i)=>{const cell=document.createElement(i===0?'th':'td');if(i===0)cell.scope='row';cell.textContent=value;tr.appendChild(cell);});return tr;}));
    $('roi-status').textContent='Calculs à jour. Hypothèses à valider.';
  }
  function loadPreset(key){selected=key;Object.entries(presets[key].values).forEach(([k,v])=>form.elements[k].value=v);document.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.preset===key)));$('roi-example').textContent=presets[key].description;render();}
  document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>loadPreset(b.dataset.preset)));
  let timer;form.addEventListener('input',()=>{document.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed','false'));$('roi-example').textContent='Simulation personnalisée, adaptée de l’exemple « '+presets[selected].label+' ». Les résultats restent des estimations.';clearTimeout(timer);timer=setTimeout(render,120);});
  form.addEventListener('submit',e=>{e.preventDefault();render();});
  function download(filename,data){const csv='\ufeff'+data.map(row=>row.map(value=>'"'+String(value??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $('roi-csv').addEventListener('click',()=>{render();if(!valid)return;const data=[['Pixel Drop : simulation ROI IA, 12 premiers mois'],['Export',new Date().toISOString()],['Attention','Hypothèses, pas des résultats clients ni un devis. Temps valorisé distinct des dépenses évitées.'],['Hypothèse','Valeur']];Object.keys(defaults).forEach(k=>data.push([form.elements[k].closest('label').childNodes[0].textContent.trim(),String(current[k]).replace('.',',')]));data.push([],['Scénario','Adoption (%)','Heures libérées','Valeur temps (€)','Autres dépenses évitées (€)','Coût année 1 (€)','Valeur nette temps inclus (€)','ROI temps inclus (%)','Dépenses évitées (€)','ROI dépenses seules (%)']);rows.forEach(r=>data.push([r.label,...[r.adoption,r.hours,r.capacity,current.other,r.cost,r.net,r.roi,r.cash,r.cashRoi].map(v=>v===null?'Non calculable':String(Math.round(v*100)/100).replace('.',','))]));data.push([],['Méthode','Volume = personnes × tâches par semaine × semaines × adoption × (12 − délai)/12'],['Heures','Volume × (minutes avant − minutes après)/60'],['Coût','Mise en place + heures internes × coût horaire + 12 × coûts mensuels'],['Limites','Adoption moyenne constante après lancement. Frais mensuels dès le début. Pas de revenus supposés.'],['Ressource','https://pixel-drop.com/roi-ia']);download('simulation-roi-pixel-drop.csv',data);$('roi-status').textContent='Export CSV téléchargé.';});
  $('roi-print').addEventListener('click',()=>{render();if(valid)window.print();});
  $('roi-measurement').addEventListener('click',()=>download('grille-mesure-roi-pixel-drop.csv',[
    ['Grille de mesure ROI IA : identifiants anonymes uniquement'],
    ['Consignes','Une ligne par tâche observée. Chronométrer préparation, exécution, contrôle et reprise. Inclure les échecs. Comparer des lots équivalents.'],
    ['Critère de qualité accepté à définir avant le test',''],['Période du test',''],['Outils de référence',''],['Outils testés',''],
    ['Date','Identifiant tâche anonyme','Type / difficulté','Utilisateur anonyme','Méthode actuelle ou IA','Préparation et exécution (min)','Contrôle et corrections (min)','Total temps actif (min)','Résultat accepté oui/non','Incident / commentaire non confidentiel'],
    ['','','','','','','','','',''],['','','','','','','','','',''],
    [],['Synthèse à compléter','Valeur'],['Nombre de tâches actuelles observées',''],['Nombre de tâches assistées observées',''],['Taux de résultats acceptés par méthode',''],['Temps moyen total par méthode, échecs compris',''],['Part des tâches réellement assistées',''],['Période et volume hebdomadaire représentatifs',''],['Dépenses effectivement évitées, hors doublons',''],['Source des coûts et hypothèses',''],['Décision et date de réévaluation','']
  ]));
  loadPreset('email');
})(typeof window!=='undefined'?window:globalThis);
