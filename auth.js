window.addEventListener('DOMContentLoaded', function () {
  if (window.monthsData && typeof window.monthsData === "object") {
    return;
  }

  document.body.insertAdjacentHTML('beforeend', `
    <div id="password-modal" style="display:flex; align-items:center; justify-content:center; position:fixed; inset:0; background:#00151ccf; z-index:9999;">
      <div style="background:#14323a; padding:30px 32px; border-radius:16px; box-shadow:0 8px 28px #00151c;">
        <label for="site-password" style="color:#eaf7fb;font-size:17px;font-weight:600;display:block;margin-bottom:12px;">Digite a senha para acessar o dashboard:</label>
        <input type="password" id="site-password" style="font-size:16px;padding:6px 14px;border-radius:7px;outline:none;border:1px solid #1e4149;background:#192f36;color:#fff;margin-bottom:8px;width:210px;">
        <button id="password-btn" style="margin-left:8px;padding:7px 20px;border-radius:7px;background:#284f58;color:#fff;border:none;font-size:16px;font-weight:600;cursor:pointer;">Entrar</button>
        <div id="password-error" style="color:#c02942;font-size:14px;margin-top:10px;display:none;">Senha incorreta.</div>
      </div>
    </div>
  `);

  document.getElementById('password-btn').onclick = function () {
    const pass = `${document.getElementById('site-password').value}ecommer`;
    console.log(pass)
    try {
      const str = window._monthsDataEncrypted;
      const decrypted = CryptoJS.AES.decrypt(str, pass).toString(CryptoJS.enc.Utf8);
      window.monthsData = JSON.parse(decrypted);
      document.getElementById('password-modal').style.display = 'none';

      document.getElementById('dashboard-main').style.display = 'block';
      initializeMonthSelector();
      updateDashboard();
      initializeModals();
    } catch (e) {
      console.log(e)
      document.getElementById('password-error').style.display = 'block';
    }
  };
});
