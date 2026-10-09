// Loaded only by scripts/build-public-demo.js; never by the original local app.
const accounts=[
  ['Edző','demo.edzo','ImpavidusDemo-Edzo-2026!'],
  ['Kliens 1','demo.kliens1','ImpavidusDemo-Kliens1-2026!'],
  ['Kliens 2','demo.kliens2','ImpavidusDemo-Kliens2-2026!']
];
const banner=document.createElement('aside');
banner.className='public-demo-banner';banner.setAttribute('aria-label','Nyilvános bemutató');
banner.innerHTML='<strong>NYILVÁNOS DEMÓ</strong><span>2 kliens · 20 nap kitöltött mintadat · 2026.09.14–10.03. · csak megtekintés</span>';
document.body.prepend(banner);
new ResizeObserver(()=>document.documentElement.style.setProperty('--demo-banner-height',banner.offsetHeight+'px')).observe(banner);
function explain(){
  const toast=document.getElementById('toast');
  toast.textContent='A nyilvános demóban az adatok megtekinthetők, a mentés és törlés le van tiltva.';
  toast.className='error';toast.style.display='block';setTimeout(()=>toast.style.display='none',7000);
}
function enhance(){
  const form=document.querySelector('form[data-form="auth"]');
  if(form&&!document.getElementById('demo-accounts')){
    const panel=document.createElement('section');panel.id='demo-accounts';panel.className='demo-accounts';
    panel.innerHTML='<h2>Válassz demófiókot</h2><p>Az edző mindkét kliens teljes anyagát látja. A kliens a saját naplóit látja.</p>'+accounts.map(([label,name,password],i)=>`<button type="button" data-demo-account="${i}"><strong>${label}</strong><span>${name}</span></button>`).join('')+'<details><summary>Belépési adatok</summary>'+accounts.map(([label,name,password])=>`<p><b>${label}</b><br>${name}<br><code>${password}</code></p>`).join('')+'</details>';
    form.before(panel);
    const help=form.parentElement.querySelector('.separator + .help');
    if(help)help.textContent='Kizárólag mesterséges bemutatóadatok. A demó nem fogad új kliensadatokat; a meglévő anyag nem törölhető.';
  }
  for(const button of document.querySelectorAll('form:not([data-form="auth"]) button[type="submit"]')){
    if(!button.dataset.demoDisabled){button.dataset.demoDisabled='true';button.disabled=true;button.title='Nyilvános demó: csak megtekintés';}
  }
}
document.addEventListener('click',e=>{
  const button=e.target.closest('[data-demo-account]');if(!button)return;
  e.preventDefault();e.stopImmediatePropagation();
  const form=document.querySelector('form[data-form="auth"]'),[,name,password]=accounts[Number(button.dataset.demoAccount)];
  form.elements.username.value=name;form.elements.password.value=password;
  history.replaceState(null,'',location.pathname+location.search);form.requestSubmit();
},true);
document.addEventListener('submit',e=>{if(e.target.matches('form:not([data-form="auth"])')){e.preventDefault();e.stopImmediatePropagation();explain();}},true);
new MutationObserver(enhance).observe(document.getElementById('app'),{childList:true,subtree:true});
new MutationObserver(enhance).observe(document.getElementById('dialog'),{childList:true,subtree:true});
enhance();
