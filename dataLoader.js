const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function loadYearDataEncrypted(year) {
  window.monthsData = window.monthsData ?? {}

  MONTHS.forEach(month => { 
    loadEncryptedMonth(month, year ?? window.definedYear);
  });      
}

function loadEncryptedMonth(month, year ) {
  try {    
    const key = month === 'Março' ? `_Marco${year}Encrypted` : `_${month}${year}Encrypted`;
    const encData = window[key];
    let emptyMonth = {
      [`${month}${year}`]: {
        mobile: { name: month, year: year, available: false, historicoDiario: {} },
        desktop: { name: month, year: year, available: false, historicoDiario: {} }
      }
    }

    if (encData) {
      const decrypted = CryptoJS.AES.decrypt(encData, window._dashboardPassword).toString(CryptoJS.enc.Utf8);
      const decryptedParse = JSON.parse(decrypted);
      if (Object.keys(decryptedParse).length > 0) emptyMonth = { [`${month}${year}`]: decryptedParse }
    }

    window.monthsData = { ...window.monthsData, ...emptyMonth }
  } catch (error) {
    console.log(error)
    throw error;
  }
}
