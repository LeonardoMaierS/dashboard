window.addEventListener('DOMContentLoaded', function () {
  const API_BASE = window.ENV.REMOTE_BASE_URL;
  const MONTH_SLUGS = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  let BEARER = null;

  ensurePasswordModal();

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

  /*
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
  */

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

  async function fetchMonth(year, month) {
    const headers = { 'Content-Type': 'application/json' };

    if (BEARER) headers['Authorization'] = `Bearer ${BEARER}`;

    const res = await fetch(`${API_BASE}/files/${year}/${month}`, { method: 'POST', headers, body: '{}' });

    if (!res.ok)
      throw new Error(`status: ${res.status}`)

    const j = await res.json();

    return { ok: true, status: 200, data: j };
  }

  /*
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
    // const kB = keyB64(year, month);
    // const kM = keyMeta(year, month);
    // const cachedB64 = LS.get(kB);
    // const metaRaw = LS.get(kM);
    // let meta = null; try { meta = metaRaw ? JSON.parse(metaRaw) : null; } catch { }

    // if (cachedB64) {      injectFromBase64(cachedB64, meta?.path || `data/${year}/${month}.js`);    }

    return await fetchMonth(year, month);

    if (!r.ok) {
      // if (!cachedB64)        throw new Error(`month ${month}: ${r.error || r.status}`);

      return { month, networkOk: false, source: 'cache-fallback' };
    }

    if (r.status === 304) {
      return { month, networkOk: false, source: 'cache' };
    }

    if (r.data?.content) {
      // LS.set(kB, r.data.content);
      // LS.set(kM, JSON.stringify({ path: r.data.path || `data/${year}/${month}.js`, etag: r.etag || null, tsCached: Date.now() }));
      // injectFromBase64(r.data.content, r.data.path);

      startUI()

      return // { month, networkOk: true, source: cachedB64 ? 'updated' : 'network' };
    }

    return // { month, networkOk: false, source: 'empty' };
  }
  */

  // ===== Carregamento paralelo =====
  async function loadYearAllAtOnce() {
    const now = new Date();
    const year = now.getFullYear();
    const mNow = now.getMonth();
    const months = MONTH_SLUGS.slice(0, mNow + 1);
    let contHeaderLoader = months.length

    window.definedYear = year;

    const promises = months.map(month =>
      fetchMonth(year, month)
        .then(({ data }) => {
          const monthA = month.charAt(0).toUpperCase() + month.slice(1);
          const key = `_${monthA}${year}Encrypted`;
          window[key] = data.content

          contHeaderLoader -= 1

          startUI()
        })
        .catch(err => {
          console.error(err)

          contHeaderLoader -= 1

          startUI()
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

      await auth(pwd);

      window._dashboardPassword = `${pwd}${pwd.slice(0, -2)}`;

      await loadYearAllAtOnce();

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
