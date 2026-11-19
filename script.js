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
      if(document.querySelector('#intranet-password').value==='WACHTWOORD'){
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
    const incomeMode=document.querySelector('#income-mode');
    const partnerFields=document.querySelector('#partner-income-fields');
    const annualFields=document.querySelector('#annual-income-fields');
    const annualIncomeInput=document.querySelector('#annual-income');
    const partner1Monthly=document.querySelector('#partner1-monthly');
    const feedback=document.querySelector('#calculator-feedback');
    const results=document.querySelector('#calculator-results');
    const euro=new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0});
    const updateIncomeMode=()=>{
      const usePartners=incomeMode.value==='partners';
      partnerFields.hidden=!usePartners;
      annualFields.hidden=usePartners;
      partner1Monthly.required=false;
      annualIncomeInput.required=!usePartners;
    };
    incomeMode.addEventListener('change',updateIncomeMode);
    updateIncomeMode();
    calculator.addEventListener('submit',async event=>{
      event.preventDefault();
      feedback.textContent='';
      results.hidden=true;
      let annualIncome;
      if(incomeMode.value==='partners'){
        const calculatePartnerIncome=(monthlyId,bonusId,holidayId)=>{
          const monthly=Number(document.querySelector(monthlyId).value)||0;
          const bonus=Number(document.querySelector(bonusId).value)||0;
          const holiday=Number(document.querySelector(holidayId).value)||0;
          return monthly*12+bonus+monthly*12*(holiday/100);
        };
        annualIncome=calculatePartnerIncome('#partner1-monthly','#partner1-thirteenth','#partner1-holiday')+
          calculatePartnerIncome('#partner2-monthly','#partner2-thirteenth','#partner2-holiday');
      }else{
        annualIncome=Number(annualIncomeInput.value);
      }
      if(!Number.isFinite(annualIncome)||annualIncome<=0||annualIncome>125000){
        feedback.textContent='Het gezamenlijke bruto toetsinkomen moet hoger zijn dan € 0 en mag niet boven € 125.000 uitkomen voor deze 2026-tabel.';
        return;
      }
      try{
        const response=await fetch('assets/lti-2026.json');
        if(!response.ok) throw new Error('Tabel niet beschikbaar');
        const table=await response.json();
        const roundedIncome=Math.ceil(annualIncome/1000)*1000;
        const incomeIndex=table.incomes.findIndex(value=>value>=roundedIncome);
        const selectedInterest=Number(document.querySelector('#interest-rate').value)/100;
        const interestIndex=table.interestThresholds.reduce((selected,threshold,index)=>threshold<=selectedInterest+1e-9?index:selected,-1);
        const termMonths=Number(document.querySelector('#loan-term').value);
        const label=document.querySelector('#energy-label').value;
        if(incomeIndex<0||interestIndex<0) throw new Error('Geen passende tabelwaarde');
        if(!table.energyLabelAllowance||!table.energySavingAllowance||!(label in table.energyLabelAllowance)) throw new Error('Geen energielabel geselecteerd');
        const percentage=table.percentages[incomeIndex][interestIndex];
        const maxMonthlyBeforeCredit=annualIncome/12*percentage;
        const creditCorrection=(Number(document.querySelector('#credit-limit').value)||0)*0.02;
        const monthlyPayment=Math.max(0,maxMonthlyBeforeCredit-creditCorrection);
        const monthlyRate=selectedInterest/12;
        const annuityFactor=(1-Math.pow(1+monthlyRate,-termMonths))/monthlyRate;
        const incomeBasedLoan=monthlyPayment*annuityFactor;
        const labelAllowance=table.energyLabelAllowance[label];
        const energySavingAllowance=table.energySavingAllowance[label];
        const totalLoan=incomeBasedLoan+labelAllowance+energySavingAllowance;
        document.querySelector('#result-income').textContent=euro.format(annualIncome);
        document.querySelector('#result-percentage').textContent=new Intl.NumberFormat('nl-NL',{style:'percent',maximumFractionDigits:1}).format(percentage);
        document.querySelector('#result-monthly-before-credit').textContent=euro.format(maxMonthlyBeforeCredit);
        document.querySelector('#result-credit-correction').textContent=euro.format(creditCorrection);
        document.querySelector('#result-monthly').textContent=euro.format(monthlyPayment);
        document.querySelector('#result-loan').textContent=euro.format(incomeBasedLoan);
        document.querySelector('#result-label-allowance').textContent=euro.format(labelAllowance);
        document.querySelector('#result-saving-allowance').textContent=euro.format(energySavingAllowance);
        document.querySelector('#result-total-loan').textContent=euro.format(totalLoan);
        document.querySelector('#result-breakdown').textContent=`In de berekening is het inkomen voor de 2026-tabel naar boven afgerond op ${euro.format(table.incomes[incomeIndex])}. De gekozen toetsrente is ${new Intl.NumberFormat('nl-NL',{style:'percent',maximumFractionDigits:1}).format(selectedInterest)}. Voor de gekozen looptijd van ${termMonths/12} jaar is de annuïteitenfactor ${new Intl.NumberFormat('nl-NL',{maximumFractionDigits:2}).format(annuityFactor)}.`;
        results.hidden=false;
      }catch(error){
        feedback.textContent=error.message==='Geen energielabel geselecteerd'?'Kies een energielabel om de indicatie te berekenen.':'De rekentool is op dit moment niet beschikbaar. Probeer het later opnieuw.';
      }
    });
  }
});
