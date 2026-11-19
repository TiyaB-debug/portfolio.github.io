// One palette, with an accessible, persistent appearance choice.
const appearanceRoot=document.documentElement;
appearanceRoot.dataset.palette='mashup';
const appearanceParams=new URLSearchParams(location.search);
let savedAppearance;
try { savedAppearance=localStorage.getItem('tiya-appearance'); } catch {}
const initialAppearance=appearanceParams.get('mode')||savedAppearance||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
function setAppearance(mode,save=false){
 appearanceRoot.dataset.mode=mode==='dark'?'dark':'light';
 document.querySelector('.light-switch')?.setAttribute('aria-checked',String(appearanceRoot.dataset.mode==='dark'));
 const themeMeta=document.querySelector('meta[name="theme-color"]');
 if(themeMeta) themeMeta.content=getComputedStyle(appearanceRoot).getPropertyValue('--paper').trim();
 if(save){try {localStorage.setItem('tiya-appearance',appearanceRoot.dataset.mode);}catch{}}
 const url=new URL(location.href);url.searchParams.delete('palette');url.searchParams.set('mode',appearanceRoot.dataset.mode);history.replaceState(history.state,'',url);
}
document.querySelector('.light-switch')?.addEventListener('click',()=>setAppearance(appearanceRoot.dataset.mode==='dark'?'light':'dark',true));
setAppearance(initialAppearance);
