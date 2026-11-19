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
      if(document.querySelector('#intranet-password').value==='wachtwoord'){
        feedback.textContent='';
        unlock();
      }else{
        feedback.textContent='Het wachtwoord klopt niet. Probeer het opnieuw.';
      }
    });
    document.querySelector('#intranet-logout').addEventListener('click',lock);
  }

  const calculator=document.querySelector('#borrowing-capacity-form');
  if(calculator){
    const incomeInput=document.querySelector('#annual-income');
    const feedback=document.querySelector('#calculator-feedback');
    const results=document.querySelector('#calculator-results');
    const euro=new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0});
    calculator.addEventListener('submit',async event=>{
      event.preventDefault();
      feedback.textContent='';
      results.hidden=true;
      const annualIncome=Number(incomeInput.value);
      if(!Number.isFinite(annualIncome)||annualIncome<=0||annualIncome>125000){
        feedback.textContent='Vul een jaarinkomen in tussen € 1 en € 125.000.';
        return;
      }
      try{
        const response=await fetch('assets/lti-2026.json');
        if(!response.ok) throw new Error('Tabel niet beschikbaar');
        const table=await response.json();
        let incomeIndex=table.incomes.findIndex(value=>value>annualIncome)-1;
        if(incomeIndex<0) incomeIndex=0;
        const interestIndex=table.interestThresholds.findLastIndex(value=>value<=0.05);
        if(incomeIndex<0||interestIndex<0) throw new Error('Geen passende tabelwaarde');
        const percentage=table.percentages[incomeIndex][interestIndex];
        const monthlyPayment=annualIncome/12*percentage;
        const monthlyRate=0.05/12;
        const annuityFactor=(1-Math.pow(1+monthlyRate,-360))/monthlyRate;
        document.querySelector('#result-percentage').textContent=new Intl.NumberFormat('nl-NL',{style:'percent',maximumFractionDigits:1}).format(percentage);
        document.querySelector('#result-monthly').textContent=euro.format(monthlyPayment);
        document.querySelector('#result-loan').textContent=euro.format(monthlyPayment*annuityFactor);
        results.hidden=false;
      }catch(error){
        feedback.textContent='De rekentool is op dit moment niet beschikbaar. Probeer het later opnieuw.';
      }
    });
  }
});
