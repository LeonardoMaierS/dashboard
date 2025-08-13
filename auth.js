// auth.js — exibe modal, valida no backend e só então carrega dados
window.addEventListener('DOMContentLoaded', function () {
  const API_BASE = "https://dashboard-backend-800375288267.us-central1.run.app";

  // ===== Insere modal de senha (caso não exista no HTML) =====
  if (!document.getElementById('password-modal')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div id="password-modal" style="display:flex; align-items:center; justify-content:center; position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:9999;">
        <div style="background:#14323a; padding:30px 32px; border-radius:16px; box-shadow:0 8px 28px rgba(0,0,0,0.4); width: 320px;">
          <label for="site-password" style="color:#eaf7fb;font-size:17px;font-weight:600;display:block;margin-bottom:12px;">
            Digite a senha para acessar o dashboard:
          </label>
          <input type="password" id="site-password"
            style="font-size:16px;padding:6px 14px;border-radius:7px;outline:none;border:1px solid #1e4149;background:#192f36;color:#eaf7fb;margin-bottom:8px;width:100%;"
            autocomplete="current-password" />
          <button id="password-btn"
            style="margin-top:8px;width:100%;padding:10px 14px;border-radius:7px;background:#284f58;color:#eaf7fb;border:none;font-size:16px;font-weight:700;cursor:pointer;">
            Entrar
          </button>
          <div id="password-error" style="color:#c02942;font-size:14px;margin-top:10px;display:none;"></div>
        </div>
      </div>
    `);
  }

  function startUI() {
    const dataMonths = getMonthData();

    document.getElementById('password-modal').style.display = 'none';
    document.getElementById('dashboard-main').style.display = 'block';

    initializeMonthSelector(dataMonths);
    updateDashboard(dataMonths);
    initializeExportBlock(dataMonths);
    initializeModals();
  }

  async function handleLogin() {
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
      // 1) valida no backend
      const res = await fetch(`${API_BASE}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd })
      });
      const json = await res.json();

      if (!json?.ok || !json?.token) {
        errEl.style.display = 'block';
        errEl.textContent = json?.error || 'Senha inválida.';
        return;
      }

      // 2) guarda token/env em memória
      window.__SESSION_TOKEN = json.token;
      window.__ENV = json.env || {};
      window.definedYear = new Date().getFullYear();

      // 3) carrega os .js criptografados via backend
      await window.loadYearEncryptedScripts(window.definedYear);

      // 4) define chave de decriptação a partir do input
      window._dashboardPassword = `${pwd}${pwd.slice(0, -2)}`;

      // 5) monta window.monthsData a partir dos .js carregados
      loadYearDataEncrypted(window.definedYear);

      // 6) inicia dashboard
      if (window.monthsData && typeof window.monthsData === 'object') {
        passEl.value = ''; // limpa campo
        startUI();
      } else {
        throw new Error('Dados não carregados.');
      }
    } catch (e) {
      console.error('[auth] falha', e);
      errEl.style.display = 'block';
      errEl.textContent = 'Falha ao autenticar/carregar dados.';
    }
  }

  document.getElementById('password-btn').onclick = handleLogin;
  document.getElementById('site-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
});
