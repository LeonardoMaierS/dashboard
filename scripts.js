(function () {
	const meses = [
		"janeiro", "fevereiro", "marco", "abril", "maio", "junho",
		"julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
	];

	const anos = ['2024', '2025', '2026']

	anos.forEach(function (ano) {
		meses.forEach(function (mes) {
			let script = document.createElement('script');
			script.src = `data/${ano}/${mes}.js`;
			document.head.appendChild(script);
		});
	});
})();