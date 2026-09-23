(()=>{'use strict';
const page=document.body,form=document.querySelector('[data-lead-form]');if(!form)return;
const isEs=page.dataset.locale==='es-MX';
const words=isEs?{sending:'Registrando…',success:'Tu solicitud quedó registrada. Revisaremos tu caso y te contactaremos para definir el siguiente paso.',error:'No pudimos confirmar el registro. Inténtalo de nuevo. Se conservaron tus datos.',rejected:'No pudimos confirmar el registro con estos datos. Revísalos o escríbenos a contact@pixel-drop.com.',need:'Describe tu necesidad en al menos 10 caracteres.',generic:'Revisa los campos indicados.'}:{sending:'Enregistrement…',success:'Votre demande est enregistrée. Nous étudierons votre cas et vous recontacterons pour définir la prochaine étape.',error:'Nous n’avons pas pu confirmer l’enregistrement. Réessayez. Votre saisie est conservée.',rejected:'L’enregistrement n’a pas pu être confirmé avec ces informations. Vérifiez-les ou écrivez-nous à contact@pixel-drop.com.',need:'Décrivez votre besoin en au moins 10 caractères.',generic:'Vérifiez les champs indiqués.'};
const uuid=()=>{if(window.crypto&&crypto.randomUUID)return crypto.randomUUID();if(!window.crypto||!crypto.getRandomValues)throw new Error('Secure randomness unavailable');const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=[...b].map(x=>x.toString(16).padStart(2,'0')).join('');return`${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`};
const params=new URLSearchParams(location.search),attribution={offer:page.dataset.offer,locale:page.dataset.locale,market:page.dataset.market};
['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(key=>{const value=params.get(key);if(value&&/^[A-Za-z0-9_.-]{1,120}$/.test(value))attribution[key]=value});
const started=Date.now(),clickId=params.get('twclid');
const cleanClick=clickId&&/^[A-Za-z0-9_-]{1,256}$/.test(clickId)?clickId:null;
const measurement=form.querySelector('[data-measurement]'),consent=form.querySelector('[name=ads_consent]');
if(cleanClick&&measurement)measurement.hidden=false;
const path=location.pathname;
document.querySelectorAll('[data-locale-link]').forEach(link=>{const url=new URL(link.href);for(const [k,v] of params)if(k.startsWith('utm_')||k==='twclid')url.searchParams.set(k,v);link.href=url.pathname+url.search});
// A visit is a same-origin first-party event, not a lead or an X conversion.
try{const visit={...attribution,event_id:uuid(),landing_page:path};fetch('/campagnes/x/visit.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(visit),credentials:'same-origin',keepalive:true}).catch(()=>{})}catch(_error){}
let pending=false,completed=false,requestId=null,payloadKey=null;
const button=form.querySelector('[type=submit]'),buttonLabel=button.textContent,result=form.querySelector('[data-result]');
const status=(text,state)=>{result.textContent=text;result.dataset.state=state;result.hidden=false};
const need=form.elements.need;
need.addEventListener('input',()=>need.setCustomValidity(''));
form.addEventListener('input',event=>{if(event.target.setAttribute)event.target.removeAttribute('aria-invalid')});
form.addEventListener('submit',async event=>{event.preventDefault();if(pending||completed)return;need.setCustomValidity(need.value.trim().length<10?words.need:'');if(!form.checkValidity()){form.querySelectorAll(':invalid').forEach(field=>field.setAttribute('aria-invalid','true'));status(words.generic,'error');form.reportValidity();return}
const data=new FormData(form),payload={...attribution,landing_page:path,form_id:page.dataset.offer+'_'+page.dataset.locale,_started_at:started};
['name','email','company','role','need','budget','_hp'].forEach(key=>payload[key]=String(data.get(key)||'').trim());
if(cleanClick&&consent&&consent.checked){payload.ads_consent=true;payload.twclid=cleanClick}else{payload.ads_consent=false}
const nextKey=JSON.stringify(payload);try{if(nextKey!==payloadKey||!requestId){requestId=uuid();payloadKey=nextKey}payload.request_id=requestId}catch(_error){status(words.error,'error');return}
pending=true;form.querySelectorAll('input,textarea,select').forEach(field=>field.disabled=true);button.disabled=true;button.textContent=words.sending;form.setAttribute('aria-busy','true');result.hidden=true;
const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
try{const response=await fetch('/campagnes/x/submit.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),credentials:'same-origin',signal:controller.signal});let answer;try{answer=await response.json()}catch(_error){throw new Error('Unconfirmed response')}
if(response.ok&&answer.ok===true&&answer.accepted===true&&typeof answer.lead_id==='string'&&answer.lead_id.length>0){completed=true;status(words.success,'success');form.querySelector('[data-fields]').hidden=true;button.hidden=true;if(measurement)measurement.hidden=true;form.querySelectorAll('[data-form-helper]').forEach(el=>el.hidden=true);result.setAttribute('tabindex','-1');result.focus();
// Optional local dataLayer only. No external analytics library is loaded.
if(payload.ads_consent===true){window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'lead_submitted',offer:payload.offer,locale:payload.locale,market:payload.market,lead_id:answer.lead_id})}
}else if(response.ok&&answer.ok===true&&answer.accepted===false){status(words.rejected,'error')}else{status(words.error,'error')}
}catch(_error){status(words.error,'error')}finally{clearTimeout(timer);pending=false;form.removeAttribute('aria-busy');if(!completed){form.querySelectorAll('input,textarea,select').forEach(field=>field.disabled=false);button.disabled=false;button.textContent=buttonLabel}}
});
})();
