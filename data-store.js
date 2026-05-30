(() => {
  'use strict';

  const ORDERS_KEY = 'orders';
  const EVENTS_KEY = 'analytics_events';

  function safeJsonParse(raw, fallback) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function getCategoryFromProductId(id) {
    const p = String(id || '').toUpperCase();
    if (p.startsWith('VT')) return 'Vòng tay';
    if (p.startsWith('BT')) return 'Bông tai';
    if (p.startsWith('DC')) return 'Dây chuyền';
    if (p.startsWith('DH') || p.startsWith('Đ')) return 'Đồng hồ';
    if (p.startsWith('N')) return 'Nhẫn';
    if (p.startsWith('TC') || p.startsWith('BST')) return 'Bộ sưu tập';
    return 'Khác';
  }

  function loadAccounts() {
    const accounts = safeJsonParse(localStorage.getItem('accounts'), []);
    return Array.isArray(accounts) ? accounts : [];
  }

  function getOrders() {
    const orders = safeJsonParse(localStorage.getItem(ORDERS_KEY), []);
    return Array.isArray(orders) ? orders : [];
  }

  function saveOrders(orders) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }

  function saveOrder(order) {
    const orders = getOrders();
    orders.push(order);
    saveOrders(orders);
    return order;
  }

  function getEvents() {
    const events = safeJsonParse(localStorage.getItem(EVENTS_KEY), []);
    return Array.isArray(events) ? events : [];
  }

  function trackEvent(type, productId, meta = {}) {
    const events = getEvents();
    events.push({
      type,
      productId,
      category: getCategoryFromProductId(productId),
      at: new Date().toISOString(),
      ...meta
    });
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  }

  function countUsers() {
    return loadAccounts().filter(a => a.role === 'user').length;
  }

  function getProductCount() {
    return Array.isArray(window.allProducts) ? window.allProducts.length : 0;
  }

  function getStats() {
    const orders = getOrders();
    const revenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const events = getEvents();

    const soldMap = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        const id = item.id || item.productId;
        if (!id) return;
        soldMap[id] = (soldMap[id] || 0) + (item.quantity || 1);
      });
    });

    const topSelling = Object.entries(soldMap)
      .map(([id, qty]) => {
        const product = (window.allProducts || []).find(p => p.id === id);
        return {
          id,
          name: product ? product.name : id,
          quantity: qty,
          category: getCategoryFromProductId(id)
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const countByType = (type) =>
      events.filter(e => e.type === type).reduce((acc, e) => {
        acc[e.productId] = (acc[e.productId] || 0) + 1;
        return acc;
      }, {});

    const topViewed = mapToRank(countByType('view'), 'views');
    const topCart = mapToRank(countByType('cart_add'), 'adds');

    const categoryOrders = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        const cat = getCategoryFromProductId(item.id || item.productId);
        categoryOrders[cat] = (categoryOrders[cat] || 0) + (item.quantity || 1);
      });
    });

    const revenueByMonth = {};
    orders.forEach(o => {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      revenueByMonth[key] = (revenueByMonth[key] || 0) + (Number(o.total) || 0);
    });

    return {
      productCount: getProductCount(),
      orderCount: orders.length,
      revenue,
      userCount: countUsers(),
      topSelling,
      topViewed,
      topCart,
      categoryOrders,
      revenueByMonth,
      orders: orders.slice().reverse()
    };
  }

  function mapToRank(map, valueKey) {
    return Object.entries(map)
      .map(([id, count]) => {
        const product = (window.allProducts || []).find(p => p.id === id);
        return {
          id,
          name: product ? product.name : id,
          [valueKey]: count,
          category: getCategoryFromProductId(id)
        };
      })
      .sort((a, b) => b[valueKey] - a[valueKey])
      .slice(0, 10);
  }

  function seedDemoDataIfEmpty() {
    if (getOrders().length > 0) return;
    if (!Array.isArray(window.allProducts) || window.allProducts.length < 3) return;

    const demoItems = window.allProducts.slice(0, 3).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      quantity: 1,
      image: p.image
    }));
    const subtotal = demoItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax = subtotal * 0.05;
    const now = new Date();
    saveOrder({
      id: 'ORD-DEMO-1',
      userEmail: 'demo@cartier.com',
      customerName: 'Khách demo',
      address: 'TP. Hồ Chí Minh',
      items: demoItems,
      subtotal,
      tax,
      total: subtotal + tax,
      status: 'completed',
      createdAt: new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    });
  }

  window.DataStore = {
    getCategoryFromProductId,
    getOrders,
    saveOrder,
    trackEvent,
    getStats,
    seedDemoDataIfEmpty,
    countUsers,
    loadAccounts
  };
})();
