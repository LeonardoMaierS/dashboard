window.addEventListener('DOMContentLoaded', function () {
  const API_BASE = window.ENV.REMOTE_BASE_URL;
  const CACHE_NS = "dash:v1";
  const MONTH_SLUGS = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const SLUG_TO_FULL = { janeiro: "Janeiro", fevereiro: "Fevereiro", marco: "Março", abril: "Abril", maio: "Maio", junho: "Junho", julho: "Julho", agosto: "Agosto", setembro: "Setembro", outubro: "Outubro", novembro: "Novembro", dezembro: "Dezembro" };
  const injectedSids = new Set();
  let BEARER = null;

  ensurePasswordModal();
  function ensurePasswordModal() {
    if (document.getElementById('password-modal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="password-modal" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);z-index:9999;padding:24px">
        <div style="width:min(92vw,380px);background:linear-gradient(180deg,#14323a,#1b3c45);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.45);padding:28px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
            <i aria-hidden="true" style="width:32px;height:32px;border-radius:8px;background:#19414a;display:inline-flex;align-items:center;justify-content:center">
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M12 3l8 4.5v9L12 21 4 16.5v-9L12 3Z" stroke="#8fd6e5" stroke-width="1.4"/></svg>
            </i>
            <div style="display:flex;flex-direction:column">
              <span style="color:#eaf7fb;font-weight:800;font-size:18px;margin:0 0 6px">Acesso ao Dashboard</span>
              <span style="color:#9cc7d1;font-size:13px">Digite a senha para carregar os dados</span>
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;background:#102a30;border:1px solid #1e4149;border-radius:10px;padding:10px 12px">
            <input type="password" id="site-password" placeholder="Senha" autocomplete="current-password" style="flex:1;background:transparent;border:0;outline:0;color:#eaf7fb;font-size:15px"/>
          </div>
          <button id="password-btn" style="width:100%;margin-top:12px;background:#2a5862;color:#eaf7fb;border:0;border-radius:10px;padding:12px 14px;font-weight:800;font-size:15px;cursor:pointer">Entrar</button>
          <div id="password-error" style="display:none;color:#e05d6f;font-size:13px;margin-top:10px"></div>
        </div>
      </div>
      <div id="global-loader" style="position:fixed;inset:0;background:rgba(10,20,24,.6);backdrop-filter:saturate(120%) blur(2px);display:none;align-items:center;justify-content:center;z-index:10000">
        <div style="background:linear-gradient(180deg,#14323a,#1b3c45);padding:14px 18px;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.45);display:flex;align-items:center;gap:10px;color:#eaf7fb;font-weight:700">
          <span style="width:18px;height:18px;border-radius:50%;border:2px solid rgba(234,247,251,.25);border-top-color:#eaf7fb;animation:spin .9s linear infinite;display:inline-block"></span>
          <span>Carregando dados…</span>
        </div>
      </div>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    `);
    document.getElementById('password-btn').onclick = handleEnter;
    document.getElementById('site-password').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleEnter(); });
  }
  function setLoading(on) { const o = document.getElementById('global-loader'); if (o) o.style.display = on ? 'flex' : 'none'; }

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
  async function sha256Hex(t) { const e = new TextEncoder().encode(t); const b = await crypto.subtle.digest('SHA-256', e); return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join(''); }
  function clearNamespace() { LS.keys().forEach(k => { if (k.startsWith(`${CACHE_NS}:`)) LS.del(k); }); }

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

  async function fetchMonth(year, monthSlug, etag) {
    const headers = { 'Content-Type': 'application/json' };

    if (BEARER) headers['Authorization'] = `Bearer ${BEARER}`;

    if (etag) headers['If-None-Match'] = etag;

    const res = await fetch(`${API_BASE}/files/${year}/${monthSlug}`, { method: 'POST', headers, body: '{}' });

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

  function injectOrReplaceScript(id, code) { const old = document.getElementById(id); if (old) old.remove(); const s = document.createElement('script'); s.id = id; s.async = false; s.textContent = code; (document.head || document.documentElement).appendChild(s); }
  function injectFromBase64(contentB64, path) { const clean = (contentB64 || '').replace(/\s+/g, ''); const decoded = atob(clean); const sid = `injected-${(path || '').replace(/[^\w-]/g, '-')}`; injectOrReplaceScript(sid, decoded); injectedSids.add(sid); }
  function rollbackInjected(year) {
    injectedSids.forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });
    injectedSids.clear();
    Object.entries(SLUG_TO_FULL).forEach(([slug, full]) => { const key = `_${full}${year}Encrypted`; try { delete window[key]; } catch { } });
    try { delete window.monthsData; } catch { }
  }

  // ===== UI: habilita botão do mês quando disponível =====
  function onMonthReady(slug) {
    const btn = document.querySelector(`[data-month="${slug}"]`);

    if (btn) { btn.disabled = false; btn.classList.remove('is-loading', 'is-disabled'); }

    if (typeof markMonthAsReady === 'function') markMonthAsReady(slug);
  }

  // ===== Pipeline por mês (cache-first seguro; cache não autoriza) =====
  async function loadMonthWithCache(year, slug) {
    const kB = keyB64(year, slug);
    const kM = keyMeta(year, slug);
    const cachedB64 = LS.get(kB);
    const metaRaw = LS.get(kM);
    let meta = null; try { meta = metaRaw ? JSON.parse(metaRaw) : null; } catch { }

    if (cachedB64) { injectFromBase64(cachedB64, meta?.path || `data/${year}/${slug}.js`); onMonthReady(slug); }

    const r = await fetchMonth(year, slug, meta?.etag);

    if (!r.ok) {
      if (!cachedB64) throw new Error(`month ${slug}: ${r.error || r.status}`);

      return { slug, networkOk: false, source: 'cache-fallback' };
    }

    if (r.status === 304) return { slug, networkOk: false, source: 'cache' };

    if (r.data?.content) {
      LS.set(kB, r.data.content);
      LS.set(kM, JSON.stringify({ path: r.data.path || `data/${year}/${slug}.js`, etag: r.etag || null, tsCached: Date.now() }));
      injectFromBase64(r.data.content, r.data.path);
      onMonthReady(slug);

      startUI()

      return { slug, networkOk: true, source: cachedB64 ? 'updated' : 'network' };
    }

    return { slug, networkOk: false, source: 'empty' };
  }

  // ===== Seleção de meses (não além do mês atual) =====
  function monthsForYear(year) {
    const now = new Date(); const yNow = now.getFullYear(); const mNow = now.getMonth(); // 0..11
    if (year < yNow) return MONTH_SLUGS.slice();
    if (year > yNow) return [];
    return MONTH_SLUGS.slice(0, mNow + 1);
  }

  // ===== Carregamento paralelo (12 de uma vez no ano vigente) =====
  async function loadYearAllAtOnce(year) {
    const months = monthsForYear(year);

    const promises = months.map(slug =>
      loadMonthWithCache(year, slug)
        .then(r => ({ ok: true, r }))
        .catch(err => ({ ok: false, slug, err: String(err) }))
    );

    const settled = await Promise.all(promises);

    let networkSuccess = 0;

    for (const it of settled) {
      if (it.ok && it.r.networkOk) networkSuccess++;
    }

    return { networkSuccess, monthsCount: months.length };
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

      const { networkSuccess, monthsCount } = await loadYearAllAtOnce(year);

      // exige pelo menos 1 200 OK quando houver meses a carregar
      if (monthsCount > 0 && networkSuccess === 0) {
        rollbackInjected(year);
        throw new Error('invalid_password_or_origin');
      }

      // 4) garantir CryptoJS
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
