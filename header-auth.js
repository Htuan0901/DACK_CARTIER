(() => {
  'use strict';

  function safeJsonParse(raw, fallback) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const session = safeJsonParse(localStorage.getItem('session'), null);
    const userLinks = document.querySelectorAll('a.header-user-link, a[href="dangnhap.html"]');

    userLinks.forEach(link => {
      if (!session || !session.email) {
        link.href = 'dangnhap-nguoidung.html';
        link.title = 'Đăng nhập người dùng';
        return;
      }
      if (session.role === 'admin') {
        link.href = 'admin-dashboard.html';
        link.title = 'Khu vực Admin';
      } else {
        link.href = 'nguoidung-dashboard.html';
        link.title = 'Tài khoản của tôi';
      }
    });
  });
})();
