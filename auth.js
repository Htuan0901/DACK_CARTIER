(() => {
  'use strict';

  function safeJsonParse(raw, fallback) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function getPageRole() {
    const fromBody = document.body && document.body.dataset.authRole;
    if (fromBody === 'admin' || fromBody === 'user') return fromBody;

    const params = new URLSearchParams(window.location.search);
    const role = (params.get('role') || 'user').toLowerCase();
    return role === 'admin' ? 'admin' : 'user';
  }

  function getDashboardUrl(role) {
    return role === 'admin' ? 'admin-dashboard.html' : 'nguoidung-dashboard.html';
  }

  function getLoginUrl(role) {
    return role === 'admin' ? 'dangnhap-admin.html' : 'dangnhap-nguoidung.html';
  }

  function loadAccounts() {
    const accountsRaw = localStorage.getItem('accounts');
    if (accountsRaw) {
      const accounts = safeJsonParse(accountsRaw, []);
      if (Array.isArray(accounts)) return accounts;
    }

    const legacyUsers = safeJsonParse(localStorage.getItem('users'), []);
    if (!Array.isArray(legacyUsers)) return [];

    const migrated = legacyUsers.map(u => ({
      email: String(u.email || '').trim(),
      password: String(u.password || '').trim(),
      role: 'user'
    })).filter(u => u.email && u.password);

    localStorage.setItem('accounts', JSON.stringify(migrated));
    return migrated;
  }

  function saveAccounts(accounts) {
    localStorage.setItem('accounts', JSON.stringify(accounts));
  }

  function loadSession() {
    return safeJsonParse(localStorage.getItem('session'), null);
  }

  function saveSession(session) {
    localStorage.setItem('session', JSON.stringify(session));
  }

  function clearSession() {
    localStorage.removeItem('session');
  }

  function showAlert(message, type = 'success') {
    let container = document.getElementById('auth-alert-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'auth-alert-container';
      container.className = 'container mt-3';

      const formSection = document.querySelector('.main-content .container') ||
        document.querySelector('.auth-card') ||
        document.querySelector('main');
      if (formSection) {
        formSection.prepend(container);
      } else {
        document.body.prepend(container);
      }
    }

    container.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  }

  window.Auth = {
    loadSession,
    saveSession,
    clearSession,
    getPageRole,
    getDashboardUrl,
    getLoginUrl
  };

  document.addEventListener('DOMContentLoaded', () => {
    const role = getPageRole();
    const isLoginPage = document.body.dataset.authPage === 'login';

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const recoveryEmailInput = document.getElementById('recovery-email');
    const recoveryBtn = document.getElementById('recovery-btn');
    const currentUserInfo = document.getElementById('current-user-info');

    function refreshAuthUI() {
      const legacyCurrent = safeJsonParse(localStorage.getItem('currentUser'), null);
      let session = loadSession() || legacyCurrent;
      if (session && !session.role) session.role = 'user';
      if (session && session.email && session.role) saveSession(session);

      const current = loadSession();

      if (isLoginPage && current && current.email && current.role === role) {
        window.location.replace(getDashboardUrl(role));
        return;
      }

      if (current && current.email) {
        if (currentUserInfo) {
          const prefix = current.role === 'admin' ? 'Admin' : 'Người dùng';
          currentUserInfo.textContent = `Bạn đang đăng nhập (${prefix}): ${current.email}`;
        }
        if (emailInput) {
          emailInput.value = current.email;
          emailInput.readOnly = true;
        }
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';

        const goDash = document.getElementById('go-dashboard-btn');
        if (goDash) goDash.style.display = 'inline-block';
      } else {
        if (currentUserInfo) currentUserInfo.textContent = '';
        if (emailInput) emailInput.readOnly = false;
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (signupBtn) signupBtn.style.display = 'inline-block';

        const goDash = document.getElementById('go-dashboard-btn');
        if (goDash) goDash.style.display = 'none';
      }
    }

    const goDashboardBtn = document.getElementById('go-dashboard-btn');
    if (goDashboardBtn) {
      goDashboardBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const current = loadSession();
        if (current) window.location.href = getDashboardUrl(current.role);
      });
    }

    if (loginBtn) {
      loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!emailInput || !passwordInput) return;

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value.trim();
        if (!email || !password) {
          showAlert('Vui lòng nhập đầy đủ email và mật khẩu.', 'danger');
          return;
        }

        const accounts = loadAccounts();
        const acc = accounts.find(u => u.email === email && u.password === password && u.role === role);

        if (acc) {
          saveSession({ email: acc.email, role: acc.role, loginAt: Date.now() });
          showAlert(`Đăng nhập thành công! Đang chuyển hướng...`, 'success');
          setTimeout(() => window.location.replace(getDashboardUrl(acc.role)), 600);
          return;
        }

        const sameEmail = accounts.find(u => u.email === email);
        if (sameEmail && sameEmail.role !== role) {
          showAlert(`Tài khoản này là '${sameEmail.role}'. Vui lòng dùng trang đăng nhập ${sameEmail.role === 'admin' ? 'Admin' : 'Người dùng'}.`, 'warning');
          return;
        }

        showAlert('Email hoặc mật khẩu không đúng.', 'danger');
      });
    }

    if (signupBtn) {
      signupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!emailInput || !passwordInput) return;

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value.trim();
        if (!email || !password) {
          showAlert('Vui lòng nhập đầy đủ email và mật khẩu để đăng ký.', 'danger');
          return;
        }

        const accounts = loadAccounts();
        if (accounts.some(u => u.email === email && u.role === role)) {
          showAlert(`Email này đã được đăng ký cho vai trò '${role}'.`, 'warning');
          return;
        }

        accounts.push({ email, password, role });
        saveAccounts(accounts);
        saveSession({ email, role, loginAt: Date.now() });

        showAlert('Đăng ký thành công! Đang chuyển hướng...', 'success');
        setTimeout(() => window.location.replace(getDashboardUrl(role)), 600);
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        clearSession();
        showAlert('Bạn đã đăng xuất.', 'info');
        if (passwordInput) passwordInput.value = '';
        if (emailInput) {
          emailInput.value = '';
          emailInput.readOnly = false;
        }
        refreshAuthUI();
        if (!isLoginPage) {
          setTimeout(() => window.location.replace(getLoginUrl(role)), 500);
        }
      });
    }

    if (recoveryBtn) {
      recoveryBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!recoveryEmailInput) return;

        const email = recoveryEmailInput.value.trim().toLowerCase();
        if (!email) {
          showAlert('Vui lòng nhập email để lấy lại mật khẩu.', 'danger');
          return;
        }

        const accounts = loadAccounts();
        const acc = accounts.find(u => u.email === email && u.role === role);

        if (acc) {
          showAlert(`(Demo) Mật khẩu hiện tại: "${acc.password}"`, 'info');
        } else {
          showAlert(`Không tìm thấy tài khoản với email này.`, 'warning');
        }
      });
    }

    refreshAuthUI();
  });
})();
