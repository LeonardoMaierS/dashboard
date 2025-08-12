// Carregamento dos arquivos de dados somente após login válido
(function () {
  const MESES = [
    "janeiro", "fevereiro", "marco", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];

  const API_BASE =
    (window.__ENV && (window.__ENV.API_BASE || window.__ENV.DATA_BASE_URL)) ||
    window.DATA_BASE_URL ||
    "https://dash-backend-825443863721.us-central1.run.app";

  function injectMonth(year, monthSlug) {
    return new Promise((resolve) => {
      const id = `data-${year}-${monthSlug}`;
      if (document.getElementById(id)) return resolve("cached");

      const token = encodeURIComponent(window.__SESSION_TOKEN || '');
      const ver = encodeURIComponent((window.__ENV && window.__ENV.VERSION) || '');
      const s = document.createElement("script");
      s.id = id;
      s.async = true;
      s.src = `${API_BASE}/data/${year}/${monthSlug}.js?v=${ver}&t=${token}`;
      s.onload = () => resolve("ok");
      s.onerror = () => { console.warn(`[data] erro ${year}/${monthSlug}`); resolve("err"); };
      (document.head || document.body || document.documentElement).appendChild(s);
    });
  }

  function loadYearEncryptedScripts(year) {
    const y = String(year || new Date().getFullYear());
    return Promise.all(MESES.map(m => injectMonth(y, m)));
  }

  // expõe para o auth.js chamar após o /auth
  window.loadYearEncryptedScripts = loadYearEncryptedScripts;
})();
