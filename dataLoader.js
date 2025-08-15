const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function loadYearDataEncrypted() {
  window.monthsData = window.monthsData ?? {}

  if (!window.definedYear)
    window.definedYear = new Date().getFullYear();

  MONTHS.forEach(month => {
    loadEncryptedMonth(month, window.definedYear);
  });
}

function loadEncryptedMonth(month, year) {
  try {
    const key = month === 'Março' ? `_Marco${year}Encrypted` : `_${month}${year}Encrypted`;
    const encData = window[key];

    // Caso ja tenha os dados do mes não precisa seguir
    if (window.monthsData[`${month}${year}`]?.available) return

    let emptyMonth = {
      [`${month}${year}`]: {
        mobile: { name: month, year: year, available: false, historicoDiario: {} },
        desktop: { name: month, year: year, available: false, historicoDiario: {} }
      }
    }

    if (encData) {

      console.log('encData 1')
      console.log(encData)
      console.log('encData 3')

      const decrypted = CryptoJS.AES.decrypt(encData, window._dashboardPassword).toString(CryptoJS.enc.Utf8);
      const decryptedParse = JSON.parse(decrypted);
      if (Object.keys(decryptedParse).length > 0) emptyMonth = { [`${month}${year}`]: decryptedParse }
    }

    window.monthsData = { ...window.monthsData, ...emptyMonth }
  } catch (error) {
    throw error;
  }
}
