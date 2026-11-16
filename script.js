document.addEventListener('DOMContentLoaded',()=>{
  const menuButton=document.querySelector('.menu-toggle');
  const nav=document.querySelector('nav');
  if(menuButton&&nav){
    menuButton.addEventListener('click',()=>{
      const open=nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded',String(open));
      menuButton.setAttribute('aria-label',open?'Menu sluiten':'Menu openen');
      menuButton.textContent=open?'×':'☰';
    });
  }

  document.querySelectorAll('.nav-dropdown-toggle').forEach(button=>{
    button.addEventListener('click',()=>{
      const dropdown=button.closest('.nav-dropdown');
      const open=dropdown.classList.toggle('open');
      button.setAttribute('aria-expanded',String(open));
    });
  });
  document.addEventListener('click',event=>{
    document.querySelectorAll('.nav-dropdown.open').forEach(dropdown=>{
      if(!dropdown.contains(event.target)){
        dropdown.classList.remove('open');
        dropdown.querySelector('.nav-dropdown-toggle')?.setAttribute('aria-expanded','false');
      }
    });
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape') document.querySelectorAll('.nav-dropdown.open').forEach(dropdown=>{
      dropdown.classList.remove('open');
      dropdown.querySelector('.nav-dropdown-toggle')?.setAttribute('aria-expanded','false');
    });
  });

  const backToTop=document.createElement('button');
  backToTop.className='back-to-top';
  backToTop.type='button';
  backToTop.setAttribute('aria-label','Terug naar boven');
  backToTop.title='Terug naar boven';
  backToTop.innerHTML='↑';
  document.body.append(backToTop);
  const updateBackToTop=()=>backToTop.classList.toggle('visible',window.scrollY>320);
  window.addEventListener('scroll',updateBackToTop,{passive:true});
  updateBackToTop();
  backToTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));

  const login=document.querySelector('#intranet-login');
  if(login){
    const gate=document.querySelector('#intranet-gate');
    const content=document.querySelector('#intranet-content');
    const feedback=document.querySelector('#login-feedback');
    const storageKey='novi-intranet-unlocked';
    const unlock=()=>{gate.hidden=true;content.hidden=false;sessionStorage.setItem(storageKey,'true');};
    const lock=()=>{content.hidden=true;gate.hidden=false;sessionStorage.removeItem(storageKey);};
    if(sessionStorage.getItem(storageKey)==='true') unlock();
    login.addEventListener('submit',event=>{
      event.preventDefault();
      if(document.querySelector('#intranet-password').value==='SFE-MINOR2026'){
        feedback.textContent='';
        unlock();
      }else{
        feedback.textContent='Het wachtwoord klopt niet. Probeer het opnieuw.';
      }
    });
    document.querySelector('#intranet-logout').addEventListener('click',lock);
  }
});
