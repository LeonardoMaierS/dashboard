window.addEventListener('DOMContentLoaded', function () {
  function _initDash() {
    const dataMonths = getMonthData();

    document.getElementById('password-modal').style.display = 'none'
    document.getElementById('dashboard-main').style.display = 'block'

    initializeMonthSelector(dataMonths);
    updateDashboard(dataMonths)
    initializeExportBlock(dataMonths)
    initializeModals()
  }

  if (window.monthsData && typeof window.monthsData === "object") {
    _initDash()

    return;
  }

  document.body.insertAdjacentHTML('beforeend', `
    <div id="password-modal" style="display:flex; align-items:center; justify-content:center; position:fixed; inset:0; background:#00151ccf; z-index:9999;">
      <div style="background:#14323a; padding:30px 32px; border-radius:16px; box-shadow:0 8px 28px #00151c;">
        <label for="site-password" style="color:#eaf7fb;font-size:17px;font-weight:600;display:block;margin-bottom:12px;">Digite a senha para acessar o dashboard:</label>
        <input type="password" id="site-password" style="font-size:16px;padding:6px 14px;border-radius:7px;outline:none;border:1px solid #1e4149;background:#192f36;color:#eaf7fb;margin-bottom:8px;width:210px;">
        <button id="password-btn" style="margin-left:8px;padding:7px 20px;border-radius:7px;background:#284f58;color:#eaf7fb;border:none;font-size:16px;font-weight:600;cursor:pointer;">Entrar</button>
        <div id="password-error" style="color:#c02942;font-size:14px;margin-top:10px;display:none;">Senha incorreta.</div>
      </div>
    </div>
  `);

  document.getElementById('password-btn').onclick = function () {
    try {
      window._dashboardPassword = `${document.getElementById('site-password').value}ecommer`;
      window.definedYear = new Date().getFullYear();

      loadYearDataEncrypted(window.definedYear);


      if (window.monthsData && typeof window.monthsData === "object")
        _initDash()

    } catch (e) {
      document.getElementById('password-error').style.display = 'block';
    }
  };
});
