// auth.js — usa apenas POST /files { password } e injeta os JS retornados
window.addEventListener('DOMContentLoaded', function () {
  const API_BASE = "https://dashboard-backend-800375288267.us-central1.run.app";

  if (!document.getElementById('password-modal')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div id="password-modal" style="display:flex;align-items:center;justify-content:center;position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9999;">
        <div style="background:#14323a;padding:30px 32px;border-radius:16px;box-shadow:0 8px 28px rgba(0,0,0,0.4);width:320px;">
          <label for="site-password" style="color:#eaf7fb;font-size:17px;font-weight:600;display:block;margin-bottom:12px;">Digite a senha:</label>
          <input type="password" id="site-password" style="font-size:16px;padding:6px 14px;border-radius:7px;outline:none;border:1px solid #1e4149;background:#192f36;color:#eaf7fb;margin-bottom:8px;width:100%;" autocomplete="current-password"/>
          <button id="password-btn" style="margin-top:8px;width:100%;padding:10px 14px;border-radius:7px;background:#284f58;color:#eaf7fb;border:none;font-size:16px;font-weight:700;cursor:pointer;">Entrar</button>
          <div id="password-error" style="color:#c02942;font-size:14px;margin-top:10px;display:none;"></div>
        </div>
      </div>
    `);
  }

  function injectInlineScript(code, id) {
    if (id && document.getElementById(id)) return;
    const s = document.createElement('script');
    if (id) s.id = id;
    s.async = false;
    s.textContent = code;
    (document.head || document.documentElement).appendChild(s);
  }

  function applyRepoFilesPayload(files) {
    if (!Array.isArray(files) || !files.length) return;
    const firstPath = String(files[0]?.path || '');
    const m = firstPath.match(/data\/(\d{4})\//i);
    if (m) window.definedYear = Number(m[1]);

    files.forEach((f) => {
      try {
        if (!f?.content) return;
        const decoded = atob(f.content);
        const sid = `injected-${(f.path || '').replace(/[^\w-]/g, '-')}`;
        injectInlineScript(decoded, sid);
      } catch (e) {
        console.warn('[applyRepoFilesPayload] erro', f?.path, e);
      }
    });
  }

  function startUI() {
    const dataMonths = getMonthData ? getMonthData() : (window.monthsData || {});
    const modal = document.getElementById('password-modal');
    if (modal) modal.style.display = 'none';
    const main = document.getElementById('dashboard-main');
    if (main) main.style.display = 'block';

    if (typeof initializeMonthSelector === 'function') initializeMonthSelector(dataMonths);
    if (typeof updateDashboard === 'function') updateDashboard(dataMonths);
    if (typeof initializeExportBlock === 'function') initializeExportBlock(dataMonths);
    if (typeof initializeModals === 'function') initializeModals();
  }

  async function fetchFiles(password) {
    const res = await fetch(`${API_BASE}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Referer': 'https://leonardomaiers.github.io/', 'sec-ch-ua-platform': '"Windows"', 'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"', 'sec-ch-ua-mobile': '?0' },
      body: JSON.stringify({ password })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function handleEnter() {
    const passEl = document.getElementById('site-password');
    const errEl = document.getElementById('password-error');
    errEl.style.display = 'none';

    const pwd = (passEl.value || '').trim();
    if (!pwd) {
      errEl.style.display = 'block';
      errEl.textContent = 'Informe a senha.';
      return;
    }

    try {
      const json = await fetchFiles(pwd);

      if (!Array.isArray(json?.files) || !json.files.length) {
        errEl.style.display = 'block';
        errEl.textContent = 'Resposta inválida do servidor.';
        return;
      }

      applyRepoFilesPayload(json.files);
      if (!window.definedYear) window.definedYear = new Date().getFullYear();

      window._dashboardPassword = `${pwd}${pwd.slice(0, -2)}`;

      loadYearDataEncrypted(window.definedYear);

      if (!window.monthsData || typeof window.monthsData !== 'object') {
        throw new Error('Falha ao montar monthsData.');
      }

      passEl.value = '';
      startUI();
    } catch (e) {
      console.error('[files] falha', e);
      errEl.style.display = 'block';
      errEl.textContent = 'Senha inválida ou falha ao carregar dados.';
    }
  }

  document.getElementById('password-btn').onclick = handleEnter;
  document.getElementById('site-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleEnter();
  });
});
