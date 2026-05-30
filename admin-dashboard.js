(() => {
  'use strict';

  let charts = [];

  function destroyCharts() {
    charts.forEach(c => c.destroy());
    charts = [];
  }

  function downloadCsv(filename, rows) {
    const csv = rows.map(r => r.map(cell => {
      const s = String(cell == null ? '' : cell);
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function renderDashboard() {
    window.DataStore.seedDemoDataIfEmpty();
    const stats = window.DataStore.getStats();

    document.getElementById('kpi-products').textContent = stats.productCount;
    document.getElementById('kpi-orders').textContent = stats.orderCount;
    document.getElementById('kpi-revenue').textContent = '$' + stats.revenue.toFixed(2);
    document.getElementById('kpi-users').textContent = stats.userCount;

    const tbody = document.getElementById('admin-orders-body');
    if (!stats.orders.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-muted text-center">Chưa có đơn hàng</td></tr>';
    } else {
      tbody.innerHTML = stats.orders.slice(0, 20).map(o => {
        const d = new Date(o.createdAt);
        return `<tr>
          <td><code>${o.id}</code></td>
          <td>${o.customerName || '—'}</td>
          <td>${o.userEmail || '—'}</td>
          <td>$${Number(o.total).toFixed(2)}</td>
          <td>${d.toLocaleString('vi-VN')}</td>
        </tr>`;
      }).join('');
    }

    destroyCharts();
    renderRevenueChart(stats.revenueByMonth);
    renderCategoryChart(stats.categoryOrders);
    renderTopSellingChart(stats.topSelling);
    renderBehaviorChart(stats.topViewed, stats.topCart);
  }

  function renderRevenueChart(revenueByMonth) {
    const keys = Object.keys(revenueByMonth).sort();
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    charts.push(new Chart(ctx, {
      type: 'line',
      data: {
        labels: keys.length ? keys : ['Chưa có dữ liệu'],
        datasets: [{
          label: 'Doanh thu ($)',
          data: keys.length ? keys.map(k => revenueByMonth[k]) : [0],
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          fill: true,
          tension: 0.3
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    }));
  }

  function renderCategoryChart(categoryOrders) {
    const labels = Object.keys(categoryOrders);
    const values = Object.values(categoryOrders);
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    const colors = ['#3498db', '#8B4513', '#2ecc71', '#e74c3c', '#9b59b6', '#f39c12'];
    charts.push(new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels.length ? labels : ['Chưa có'],
        datasets: [{
          data: values.length ? values : [1],
          backgroundColor: colors
        }]
      },
      options: { responsive: true }
    }));
  }

  function renderTopSellingChart(topSelling) {
    const ctx = document.getElementById('topSellingChart');
    if (!ctx) return;
    const items = topSelling.slice(0, 8);
    charts.push(new Chart(ctx, {
      type: 'bar',
      data: {
        labels: items.length ? items.map(i => i.name.slice(0, 18)) : ['—'],
        datasets: [{
          label: 'Số lượng bán',
          data: items.length ? items.map(i => i.quantity) : [0],
          backgroundColor: '#2c3e50'
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } }
      }
    }));
  }

  function renderBehaviorChart(topViewed, topCart) {
    const ctx = document.getElementById('behaviorChart');
    if (!ctx) return;
    const names = [...new Set([
      ...topViewed.slice(0, 5).map(x => x.name),
      ...topCart.slice(0, 5).map(x => x.name)
    ])].slice(0, 6);

    const views = names.map(n => {
      const f = topViewed.find(x => x.name === n);
      return f ? f.views : 0;
    });
    const carts = names.map(n => {
      const f = topCart.find(x => x.name === n);
      return f ? f.adds : 0;
    });

    charts.push(new Chart(ctx, {
      type: 'bar',
      data: {
        labels: names.length ? names.map(n => n.slice(0, 14)) : ['Chưa có'],
        datasets: [
          { label: 'Lượt xem', data: views.length ? views : [0], backgroundColor: '#3498db' },
          { label: 'Thêm giỏ', data: carts.length ? carts : [0], backgroundColor: '#8B4513' }
        ]
      },
      options: { responsive: true }
    }));
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderDashboard();

    document.getElementById('admin-logout').addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('session');
      window.location.href = 'dangnhap-admin.html';
    });

    document.getElementById('export-orders-csv').addEventListener('click', () => {
      const orders = window.DataStore.getOrders();
      const rows = [
        ['id', 'customerName', 'userEmail', 'total', 'status', 'createdAt'],
        ...orders.map(o => [o.id, o.customerName, o.userEmail, o.total, o.status, o.createdAt])
      ];
      downloadCsv('orders-export.csv', rows);
    });

    document.getElementById('export-revenue-csv').addEventListener('click', () => {
      const stats = window.DataStore.getStats();
      const keys = Object.keys(stats.revenueByMonth).sort();
      const rows = [
        ['month', 'revenue'],
        ...keys.map(k => [k, stats.revenueByMonth[k]])
      ];
      downloadCsv('revenue-by-month.csv', rows);
    });
  });
})();
