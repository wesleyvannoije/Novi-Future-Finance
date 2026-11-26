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
    const passwordInput=document.querySelector('#intranet-password');
    const passwordToggle=document.querySelector('#toggle-intranet-password');
    const storageKey='novi-intranet-unlocked';
    const unlock=()=>{gate.hidden=true;content.hidden=false;sessionStorage.setItem(storageKey,'true');};
    const lock=()=>{content.hidden=true;gate.hidden=false;sessionStorage.removeItem(storageKey);};
    passwordToggle.addEventListener('click',()=>{
      const showPassword=passwordInput.type==='password';
      passwordInput.type=showPassword?'text':'password';
      passwordToggle.setAttribute('aria-pressed',String(showPassword));
      passwordToggle.setAttribute('aria-label',showPassword?'Verberg wachtwoord':'Toon wachtwoord');
      passwordToggle.classList.toggle('is-visible',showPassword);
    });
    if(sessionStorage.getItem(storageKey)==='true') unlock();
    login.addEventListener('submit',event=>{
      event.preventDefault();
      if(passwordInput.value==='WACHTWOORD'){
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
      let incomeFormula;
      if(incomeMode.value==='partners'){
        const calculatePartnerIncome=(monthlyId,bonusId,holidayId,partnerLabel)=>{
          const monthly=Number(document.querySelector(monthlyId).value)||0;
          const bonus=Number(document.querySelector(bonusId).value)||0;
          const holiday=Number(document.querySelector(holidayId).value)||0;
          const annualBase=monthly*12;
          const annual=annualBase+bonus+annualBase*(holiday/100);
          const percentageText=new Intl.NumberFormat('nl-NL',{style:'percent',maximumFractionDigits:1}).format(holiday/100);
          return {annual,hasIncome:monthly>0||bonus>0,formula:`${partnerLabel}: (${euro.format(monthly)} × 12) + ${euro.format(bonus)} bonus + (${percentageText} × ${euro.format(annualBase)}) vakantietoeslag = ${euro.format(annual)}`};
        };
        const partner1=calculatePartnerIncome('#partner1-monthly','#partner1-thirteenth','#partner1-holiday','Partner 1');
        const partner2=calculatePartnerIncome('#partner2-monthly','#partner2-thirteenth','#partner2-holiday','Partner 2');
        annualIncome=partner1.annual+partner2.annual;
        incomeFormula=[partner1.formula,partner2.hasIncome?partner2.formula:'Partner 2: niet ingevuld'].join(' · ');
      }else{
        annualIncome=Number(annualIncomeInput.value);
        incomeFormula=`Ingevuld bruto toetsinkomen: ${euro.format(annualIncome)} per jaar`;
      }
      if(!Number.isFinite(annualIncome)||annualIncome<1||annualIncome>100000000){
        feedback.textContent='Het gezamenlijke bruto toetsinkomen moet tussen € 1 en € 100.000.000 liggen.';
        return;
      }
      try{
        const response=await fetch('assets/lti-2026.json?v=20261126');
        if(!response.ok) throw new Error('Tabel niet beschikbaar');
        const table=await response.json();
        const roundedIncome=Math.ceil(annualIncome/1000)*1000;
        if(roundedIncome>table.incomes[table.incomes.length-1]){
          feedback.textContent=`Je invoer is geldig, maar de beschikbare 2026-toetstabel loopt tot en met ${euro.format(table.incomes[table.incomes.length-1])}. Voor hogere inkomens kan deze rekentool geen betrouwbare indicatie geven.`;
          return;
        }
        const incomeIndex=table.incomes.findIndex(value=>value>=roundedIncome);
        const selectedInterest=Number(document.querySelector('#interest-rate').value)/100;
        const interestIndex=table.interestThresholds.reduce((selected,threshold,index)=>threshold<=selectedInterest+1e-9?index:selected,-1);
        const termMonths=Number(document.querySelector('#loan-term').value);
        const label=document.querySelector('#energy-label').value;
        if(incomeIndex<0||interestIndex<0) throw new Error('Geen passende tabelwaarde');
        if(!table.energyLabelAllowance||!table.energySavingAllowance||!(label in table.energyLabelAllowance)) throw new Error('Geen energielabel geselecteerd');
        const percentage=table.percentages[incomeIndex][interestIndex];
        const maxMonthlyBeforeCredit=annualIncome/12*percentage;
        const creditLimit=Number(document.querySelector('#credit-limit').value)||0;
        const creditCorrection=creditLimit*0.02;
        const monthlyPayment=Math.max(0,maxMonthlyBeforeCredit-creditCorrection);
        const monthlyRate=selectedInterest/12;
        const annuityFactor=(1-Math.pow(1+monthlyRate,-termMonths))/monthlyRate;
        const incomeBasedLoan=monthlyPayment*annuityFactor;
        const labelAllowance=table.energyLabelAllowance[label];
        const energySavingAllowance=table.energySavingAllowance[label];
        const totalLoan=incomeBasedLoan+labelAllowance+energySavingAllowance;
        const percentageText=new Intl.NumberFormat('nl-NL',{style:'percent',maximumFractionDigits:1}).format(percentage);
        const factorText=new Intl.NumberFormat('nl-NL',{maximumFractionDigits:2}).format(annuityFactor);
        document.querySelector('#result-income-equation').textContent=incomeFormula;
        document.querySelector('#result-income').textContent=euro.format(annualIncome);
        document.querySelector('#result-monthly-before-credit-equation').textContent=`${euro.format(annualIncome)} ÷ 12 × ${percentageText} = ${euro.format(maxMonthlyBeforeCredit)} per maand`;
        document.querySelector('#result-monthly-before-credit').textContent=euro.format(maxMonthlyBeforeCredit);
        document.querySelector('#result-credit-equation').textContent=`${euro.format(creditLimit)} × 2% = ${euro.format(creditCorrection)} per maand`;
        document.querySelector('#result-credit-correction').textContent=euro.format(creditCorrection);
        document.querySelector('#result-monthly-equation').textContent=`${euro.format(maxMonthlyBeforeCredit)} − ${euro.format(creditCorrection)} = ${euro.format(monthlyPayment)} per maand (niet lager dan € 0)`;
        document.querySelector('#result-monthly').textContent=euro.format(monthlyPayment);
        document.querySelector('#result-loan-equation').textContent=`${euro.format(monthlyPayment)} per maand × annuïteitenfactor ${factorText} = ${euro.format(incomeBasedLoan)}`;
        document.querySelector('#result-loan').textContent=euro.format(incomeBasedLoan);
        document.querySelector('#result-total-equation').textContent=`${euro.format(incomeBasedLoan)} + ${euro.format(labelAllowance)} extra op basis van energielabel + ${euro.format(energySavingAllowance)} voor energiebesparende maatregelen = ${euro.format(totalLoan)}`;
        document.querySelector('#result-total-loan').textContent=euro.format(totalLoan);
        document.querySelector('#result-breakdown').textContent=`Voor het financieringslastpercentage is het inkomen naar boven afgerond op ${euro.format(table.incomes[incomeIndex])}. De toetsrente is ${new Intl.NumberFormat('nl-NL',{style:'percent',maximumFractionDigits:1}).format(selectedInterest)} en de gekozen looptijd is ${termMonths/12} jaar.`;
        results.hidden=false;
      }catch(error){
        feedback.textContent=error.message==='Geen energielabel geselecteerd'?'Kies een energielabel om de indicatie te berekenen.':'De rekentool is op dit moment niet beschikbaar. Probeer het later opnieuw.';
      }
    });
  }
});
