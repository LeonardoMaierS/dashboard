window.addEventListener('DOMContentLoaded', function () {
  const API_BASE = "https://dashboard-backend-800375288267.us-central1.run.app";

  injectStyles();
  ensurePasswordModal();

  function injectStyles() {
    if (document.getElementById('auth-styles')) return;
    const css = `
    :root{
      --bg:#0f252b; --card:#14323a; --card-2:#1b3c45; --text:#eaf7fb; --muted:#9cc7d1; --accent:#2a5862; --accent-2:#316b77; --danger:#e05d6f;
      --radius:16px; --shadow:0 12px 40px rgba(0,0,0,.45);
    }
    #password-modal{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);z-index:9999;padding:24px}
    .auth-card{width:min(92vw,380px);background:linear-gradient(180deg,var(--card),var(--card-2));border-radius:var(--radius);box-shadow:var(--shadow);padding:28px}
    .auth-title{color:var(--text);font-weight:800;font-size:18px;letter-spacing:.3px;margin:0 0 6px}
    .auth-sub{color:var(--muted);font-size:13px;margin:0 0 18px}
    .auth-field{display:flex;gap:8px;align-items:center;background:#102a30;border:1px solid #1e4149;border-radius:10px;padding:10px 12px}
    .auth-input{flex:1;background:transparent;border:0;outline:0;color:var(--text);font-size:15px}
    .auth-eye{cursor:pointer;opacity:.8}
    .auth-btn{width:100%;margin-top:12px;background:var(--accent);color:var(--text);border:0;border-radius:10px;padding:12px 14px;font-weight:800;font-size:15px;cursor:pointer;transition:.2s}
    .auth-btn:hover{background:var(--accent-2)}
    .auth-err{display:none;color:var(--danger);font-size:13px;margin-top:10px}
    .brand{display:flex;align-items:center;gap:10px;margin-bottom:14px}
    .brand i{width:32px;height:32px;border-radius:8px;background:#19414a;display:inline-flex;align-items:center;justify-content:center}
    .brand svg{width:18px;height:18px;opacity:.9}
    /* botão com spinner */
    .loading .btn-label{opacity:0}
    .loading .btn-spinner{display:inline-block}
    .btn-spinner{display:none;width:18px;height:18px;border-radius:50%;border:2px solid rgba(234,247,251,.25);border-top-color:var(--text);animation:spin .9s linear infinite;vertical-align:middle}
    @keyframes spin{to{transform:rotate(360deg)}}
    /* overlay global */
    #global-loader{position:fixed;inset:0;background:rgba(10,20,24,.6);backdrop-filter:saturate(120%) blur(2px);display:none;align-items:center;justify-content:center;z-index:10000}
    .gcard{background:linear-gradient(180deg,var(--card),var(--card-2));padding:14px 18px;border-radius:12px;box-shadow:var(--shadow);display:flex;align-items:center;gap:10px;color:var(--text);font-weight:700}
    .gspin{width:18px;height:18px;border-radius:50%;border:2px solid rgba(234,247,251,.25);border-top-color:var(--text);animation:spin .9s linear infinite}
    `;
    const s = document.createElement('style');
    s.id = 'auth-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function ensurePasswordModal() {
    if (document.getElementById('password-modal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="password-modal" role="dialog" aria-modal="true">
        <div class="auth-card">
          <div class="brand">
            <i aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4.5v9L12 21 4 16.5v-9L12 3Z" stroke="#8fd6e5" stroke-width="1.4"/></svg>
            </i>
            <div style="display:flex;flex-direction:column">
              <span class="auth-title">Acesso ao Dashboard</span>
              <span class="auth-sub">Digite a senha para carregar os dados</span>
            </div>
          </div>

          <div class="auth-field">
            <input type="password" id="site-password" class="auth-input" placeholder="Senha" autocomplete="current-password" />
            <svg id="toggle-eye" class="auth-eye" viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" stroke="#9cc7d1" stroke-width="1.5"/>
              <circle cx="12" cy="12" r="3" stroke="#9cc7d1" stroke-width="1.5"/>
            </svg>
          </div>

          <button id="password-btn" class="auth-btn">
            <span class="btn-label">Entrar</span>
            <span class="btn-spinner" aria-hidden="true"></span>
          </button>
          <div id="password-error" class="auth-err"></div>
        </div>
      </div>

      <div id="global-loader" aria-live="polite" aria-busy="true">
        <div class="gcard"><span class="gspin" aria-hidden="true"></span> <span>Carregando dados…</span></div>
      </div>
    `);

    const eye = document.getElementById('toggle-eye');
    const input = document.getElementById('site-password');
    eye.addEventListener('click', () => {
      const t = input.getAttribute('type') === 'password' ? 'text' : 'password';
      input.setAttribute('type', t);
    });

    document.getElementById('password-btn').onclick = handleEnter;
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleEnter(); });
  }

  function setLoading(state){
    const btn = document.getElementById('password-btn');
    const input = document.getElementById('site-password');
    const overlay = document.getElementById('global-loader');

    if (state){
      btn.classList.add('loading');
      btn.disabled = true;
      input.disabled = true;
      overlay.style.display = 'flex';
    } else {
      btn.classList.remove('loading');
      btn.disabled = false;
      input.disabled = false;
      overlay.style.display = 'none';
    }
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

  async function fetchFiles(password) {
    const res = await fetch(`${API_BASE}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password })
    }); 
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function startUI() {
    const modal = document.getElementById('password-modal');
    if (modal) modal.style.display = 'none';
    const main = document.getElementById('dashboard-main');
    if (main) main.style.display = 'block';

    const dataMonths = (typeof getMonthData === 'function') ? getMonthData() : (window.monthsData || {});
    if (typeof initializeMonthSelector === 'function') initializeMonthSelector(dataMonths);
    if (typeof updateDashboard === 'function') updateDashboard(dataMonths);
    if (typeof initializeExportBlock === 'function') initializeExportBlock(dataMonths);
    if (typeof initializeModals === 'function') initializeModals();
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
      setLoading(true);
      const json = await fetchFiles(pwd);

      if (!Array.isArray(json?.files) || !json.files.length) {
        throw new Error('Resposta inválida do servidor.');
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
      errEl.textContent = 'Senha inválida ou origem não permitida.';
    } finally {
      setLoading(false);
    }
  }
});
