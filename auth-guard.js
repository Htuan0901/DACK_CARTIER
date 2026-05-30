(() => {
  'use strict';

  function safeJsonParse(raw, fallback) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function loadSession() {
    return safeJsonParse(localStorage.getItem('session'), null);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const requiredRole = document.body.dataset.requireAuth;
    if (!requiredRole) return;

    const loginPage = requiredRole === 'admin'
      ? 'dangnhap-admin.html'
      : 'dangnhap-nguoidung.html';

    const dashboardPage = requiredRole === 'admin'
      ? 'admin-dashboard.html'
      : 'nguoidung-dashboard.html';

    const session = loadSession();

    if (!session || !session.email || session.role !== requiredRole) {
      window.location.replace(loginPage);
      return;
    }

    const el = document.getElementById('guard-user-email');
    if (el) el.textContent = session.email;
  });
})();
