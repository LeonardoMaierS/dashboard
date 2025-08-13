window.addEventListener('DOMContentLoaded', function () {
  const API_BASE = window.ENV.REMOTE_BASE_URL;
  const CONCURRENCY = 6;
  const CACHE_NS = "dash:v1";
  const MONTH_SLUGS = ["janeiro","fevereiro","marco","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

  ensurePasswordModal();

  function ensurePasswordModal() {
    if (document.getElementById('password-modal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="password-modal" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);z-index:9999;padding:24px">
        <div style="width:min(92vw,380px);background:linear-gradient(180deg,#14323a,#1b3c45);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.45);padding:28px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
            <i aria-hidden="true"><img src="./assets/logo.svg" alt="Logo" style="width:18px;height:18px;display:block;opacity:.9"></i>
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
    document.getElementById('site-password').addEventListener('keydown', (e)=>{ if(e.key==='Enter') handleEnter(); });
  }
  function setLoading(on){
    const overlay = document.getElementById('global-loader');
    if (!overlay) return;
    overlay.style.display = on ? 'flex' : 'none';
  }

  // ---------- Cache ----------
  const LS = {
    get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
    set(k,v){ try{ localStorage.setItem(k, v); }catch(e){ /* quota */ } },
    del(k){ try{ localStorage.removeItem(k); }catch(e){ } },
    keys(){ try{ return Object.keys(localStorage); }catch(e){ return []; } }
  };
  const keyB64  = (y,slug)=>`${CACHE_NS}:${y}:${slug}:b64`;
  const keyMeta = (y,slug)=>`${CACHE_NS}:${y}:${slug}:meta`;
  const keyPass = ()=>`${CACHE_NS}:lastPassHash`;

  async function sha256Hex(text){
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  function clearNamespace(){
    LS.keys().forEach(k=>{ if(k.startsWith(`${CACHE_NS}:`)) LS.del(k); });
  }

  // ---------- Network ----------
  async function fetchMonth(password, year, monthSlug, etag){
    const headers = { 'Content-Type': 'application/json' };
    if (etag) headers['If-None-Match'] = etag;
    const res = await fetch(`${API_BASE}/files/${year}/${monthSlug}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ password })
    });
    if (res.status === 304) {
      return { status: 304, etag: etag || null, data: null };
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} ${monthSlug}`);
    const et = res.headers.get('ETag') || null;
    const j = await res.json(); // { content, path }
    return { status: 200, etag: et, data: j };
  }

  // ---------- Script injection ----------
  function injectOrReplaceScript(id, code) {
    const old = document.getElementById(id);
    if (old) old.remove();
    const s = document.createElement('script');
    s.id = id;
    s.async = false;
    s.textContent = code;
    (document.head || document.documentElement).appendChild(s);
  }

  function injectFromBase64(contentB64, path){
    const clean = (contentB64 || '').replace(/\s+/g,'');
    const decoded = atob(clean);
    const sid = `injected-${(path||'').replace(/[^\w-]/g,'-')}`;
    injectOrReplaceScript(sid, decoded);
  }

  // ---------- Pipeline por mês ----------
  async function loadMonthWithCache(password, year, slug){
    const kB = keyB64(year, slug);
    const kM = keyMeta(year, slug);
    const cachedB64 = LS.get(kB);
    const metaRaw = LS.get(kM);
    let meta = null;
    try { meta = metaRaw ? JSON.parse(metaRaw) : null; } catch { meta = null; }

    // 1) Cache-first: se existe, injeta já
    if (cachedB64) {
      injectFromBase64(cachedB64, meta?.path || `data/${year}/${slug}.js`);
    }

    // 2) Revalidação/Download
    try {
      const { status, etag, data } = await fetchMonth(password, year, slug, meta?.etag);
      if (status === 304) {
        return { slug, from: cachedB64 ? 'cache' : 'network-304' };
      }

      if (data?.content) {
        // salva cache
        LS.set(kB, data.content);
        LS.set(kM, JSON.stringify({
          path: data.path || `data/${year}/${slug}.js`,
          etag: etag || null,
          tsCached: Date.now()
        }));

        // reinjeta atualizado (substitui se já existia)
        injectFromBase64(data.content, data.path);
        return { slug, from: cachedB64 ? 'updated' : 'network' };
      }
      return { slug, from: 'empty' };
    } catch (e) {
      // Se falhar e já tínhamos cache, mantemos o que foi injetado
      if (cachedB64) return { slug, from: 'cache-fallback', err: String(e) };
      throw e;
    }
  }

  // ---------- Paralelismo controlado ----------
  async function parallelLoadYear(password, year){
    const order = MONTH_SLUGS.map((slug, idx) => ({ slug, prio: 11 - idx }))
                             .sort((a,b)=>a.prio-b.prio);
    const queue = order.slice();
    const inflight = new Set();
    const results = [];

    return new Promise((resolve, reject) => {
      const next = () => {
        if (results.length === order.length) return resolve(results);
        while (inflight.size < CONCURRENCY && queue.length){
          const { slug } = queue.shift();
          const p = loadMonthWithCache(password, year, slug)
            .then(r => { results.push(r); })
            .catch(err => { results.push({ slug, from:'error', err:String(err) }); })
            .finally(() => { inflight.delete(p); next(); });
          inflight.add(p);
        }
      };
      next();
    });
  }

  // ---------- Boot ----------
  function startUI(){
    const modal = document.getElementById('password-modal'); if (modal) modal.style.display='none';
    const main = document.getElementById('dashboard-main'); if (main) main.style.display='block';
    const dataMonths = (typeof getMonthData==='function') ? getMonthData() : (window.monthsData||{});
    if (typeof initializeMonthSelector==='function') initializeMonthSelector(dataMonths);
    if (typeof updateDashboard==='function') updateDashboard(dataMonths);
    if (typeof initializeExportBlock==='function') initializeExportBlock(dataMonths);
    if (typeof initializeModals==='function') initializeModals();
  }

  async function handleEnter(){
    const passEl = document.getElementById('site-password');
    const errEl = document.getElementById('password-error');
    errEl.style.display = 'none';
    const pwd = (passEl.value||'').trim();
    if (!pwd){ errEl.style.display='block'; errEl.textContent='Informe a senha.'; return; }

    try{
      setLoading(true);
      // invalida cache se senha mudou
      const newHash = await sha256Hex(pwd);
      const prevHash = LS.get(keyPass());
      if (prevHash && prevHash !== newHash) clearNamespace();
      LS.set(keyPass(), newHash);

      const year = new Date().getFullYear();
      window.definedYear = year;
      window._dashboardPassword = `${pwd}${pwd.slice(0, -2)}`;

      await parallelLoadYear(pwd, year);
      loadYearDataEncrypted(year);
      if (!window.monthsData || typeof window.monthsData!=='object') throw new Error('monthsData vazio');

      passEl.value = '';
      startUI();
    } catch(e){
      console.error(e);
      errEl.style.display='block';
      errEl.textContent='Falha ao carregar os dados.';
    } finally {
      setLoading(false);
    }
  }
});
