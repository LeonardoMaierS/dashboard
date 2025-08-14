window.addEventListener('DOMContentLoaded', function () {
  const API_BASE = window.ENV.REMOTE_BASE_URL;
  const CACHE_NS = "dash:v1";
  const MONTH_SLUGS = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const injectedSids = new Set();
  let BEARER = null;

  injectStyles();
  ensurePasswordModal();

  function injectStyles() {
    if (document.getElementById('auth-styles')) return;
    const css = `
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
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleEnter(); });;
  }

  function setLoading(state) {
    const btn = document.getElementById('password-btn');
    const input = document.getElementById('site-password');
    const overlay = document.getElementById('global-loader');

    if (state) {
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

  // Cache + Hash
  const LS = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { } },
    del(k) { try { localStorage.removeItem(k); } catch { } },
    keys() { try { return Object.keys(localStorage); } catch { return []; } }
  };

  const keyB64 = (y, slug) => `${CACHE_NS}:${y}:${slug}:b64`;
  const keyMeta = (y, slug) => `${CACHE_NS}:${y}:${slug}:meta`;
  const keyPass = () => `${CACHE_NS}:lastPassHash`;

  async function sha256Hex(t) {
    const e = new TextEncoder().encode(t);
    const b = await crypto.subtle.digest('SHA-256', e);

    return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
  }

  function clearNamespace() {
    LS.keys().forEach(k => {
      if (k.startsWith(`${CACHE_NS}:`))
        LS.del(k);
    });
  }

  async function auth(password) {
    const res = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`AUTH_${res.status}:${txt}`);
    }

    const j = await res.json();

    if (!j.token) throw new Error('AUTH_NO_TOKEN');

    BEARER = j.token;
  }

  async function fetchMonth(year, month, etag) {
    const headers = { 'Content-Type': 'application/json' };

    if (BEARER) headers['Authorization'] = `Bearer ${BEARER}`;

    if (etag) headers['If-None-Match'] = etag;

    const res = await fetch(`${API_BASE}/files/${year}/${month}`, { method: 'POST', headers, body: '{}' });

    if (res.status === 304) return { ok: true, status: 304, etag: etag || null, data: null };

    if (!res.ok) {
      const txt = await res.text().catch(() => '');

      return { ok: false, status: res.status, error: txt || `HTTP ${res.status}` };
    }

    const et = res.headers.get('ETag') || null;

    const j = await res.json();

    return { ok: true, status: 200, etag: et, data: j };
  }

  // ===== CryptoJS (garante antes de decriptar) =====
  async function ensureCryptoJS() {
    if (window.CryptoJS) return;
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = "https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/crypto-js.min.js";
      s.async = true; s.onload = res; s.onerror = () => rej(new Error('CryptoJS load fail'));
      document.head.appendChild(s);
    });
  }

  function injectOrReplaceScript(id, code) {
    const old = document.getElementById(id);

    if (old) old.remove();

    const s = document.createElement('script');
    s.id = id;
    s.async = false;
    s.textContent = code;

    (document.head || document.documentElement).appendChild(s);
  }

  function injectFromBase64(contentB64, path) {
    const clean = (contentB64 || '').replace(/\s+/g, '');
    const decoded = atob(clean);
    const sid = `injected-${(path || '').replace(/[^\w-]/g, '-')}`;
    injectOrReplaceScript(sid, decoded); injectedSids.add(sid);
  }

  // ===== Pipeline por mês (cache-first seguro; cache não autoriza) =====
  async function loadMonthWithCache(year, month) {
    const kB = keyB64(year, month);
    const kM = keyMeta(year, month);
    const cachedB64 = LS.get(kB);
    const metaRaw = LS.get(kM);
    let meta = null; try { meta = metaRaw ? JSON.parse(metaRaw) : null; } catch { }

    if (cachedB64) {
      injectFromBase64(cachedB64, meta?.path || `data/${year}/${month}.js`);
    }

    const r = await fetchMonth(year, month, meta?.etag);

    if (!r.ok) {
      if (!cachedB64)
        throw new Error(`month ${month}: ${r.error || r.status}`);

      return { month, networkOk: false, source: 'cache-fallback' };
    }

    if (r.status === 304) {
      return { month, networkOk: false, source: 'cache' };
    }

    if (r.data?.content) {
      LS.set(kB, r.data.content);
      LS.set(kM, JSON.stringify({ path: r.data.path || `data/${year}/${month}.js`, etag: r.etag || null, tsCached: Date.now() }));
      injectFromBase64(r.data.content, r.data.path);

      startUI()

      return { month, networkOk: true, source: cachedB64 ? 'updated' : 'network' };
    }

    return { month, networkOk: false, source: 'empty' };
  }

  // ===== Seleção de meses (não além do mês atual) =====
  function monthsForYear(year) {
    const now = new Date();
    const yNow = now.getFullYear();
    const mNow = now.getMonth();

    if (year < yNow)
      return MONTH_SLUGS.slice();

    if (year > yNow)
      return [];

    return MONTH_SLUGS.slice(0, mNow + 1);
  }

  // ===== Carregamento paralelo =====
  async function loadYearAllAtOnce(year) {
    const months = monthsForYear(year);
    let contHeaderLoader = months.length

    const promises = months.map(month =>
      loadMonthWithCache(year, month)
        .then(() => {
          contHeaderLoader -= 1
        })
        .catch(err => {
          contHeaderLoader -= 1
          console.error(err)
        })
    );

    await Promise.all(promises);

    const el = document.getElementById('header-loader');

    if (!el)
      return;

    if (contHeaderLoader === 0)
      el.style.display = 'none';
  }

  function startUI() {
    const dataMonths = getMonthData();

    const modal = document.getElementById('password-modal'); if (modal) modal.style.display = 'none';
    const main = document.getElementById('dashboard-main'); if (main) main.style.display = 'block';

    setLoading(false);

    initializeMonthSelector(dataMonths);
    updateDashboard(dataMonths);
    initializeExportBlock(dataMonths);
    initializeModals();
  }

  async function handleEnter() {
    const passEl = document.getElementById('site-password');
    const errEl = document.getElementById('password-error');
    errEl.style.display = 'none';
    const pwd = (passEl.value || '').trim();
    if (!pwd) { errEl.style.display = 'block'; errEl.textContent = 'Informe a senha.'; return; }

    try {
      setLoading(true);

      // 1) autentica (fail-fast) — e não altera a senha
      await auth(pwd);
      window._dashboardPassword = `${pwd}${pwd.slice(0, -2)}`;

      // 2) invalida cache se senha mudou
      const newHash = await sha256Hex(pwd);
      const prevHash = LS.get(keyPass());
      if (prevHash && prevHash !== newHash) clearNamespace();
      LS.set(keyPass(), newHash);

      const year = new Date().getFullYear();
      window.definedYear = year;

      await loadYearAllAtOnce(year);

      // garantir CryptoJS
      await ensureCryptoJS();

      passEl.value = '';
      startUI();
    } catch (e) {
      console.error(e);
      errEl.style.display = 'block';
      errEl.textContent = 'Senha inválida.';
    } finally {
      setLoading(false);
    }
  }
});
