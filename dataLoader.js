const MONTHS = [
	"Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
	"Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function loadYearDataEncrypted() {
	window.monthsData = {}

	MONTHS.forEach(function (month) {
		loadEncryptedMonth(month);
	});
}

function loadEncryptedMonth(month) {
	try {
		const year = window.definedYear
		const key = `_${month}${year}Encrypted`;
		const encData = window[key];

		if (!encData) {
			const dataMonth = {
				[`${month}${year}`]: {
					"name": month,
					"year": year,
					"available": false,
				}
			}

			window.monthsData = { ...window.monthsData, ...dataMonth };
		} else {
			const decrypted = CryptoJS.AES.decrypt(encData, window._dashboardPassword).toString(CryptoJS.enc.Utf8);

			const decryptedParsed = JSON.parse(decrypted)

			window.monthsData = { ...window.monthsData, ...decryptedParsed };
		}
	} catch (error) {
		console.log(error)
		throw error;
	}
}

