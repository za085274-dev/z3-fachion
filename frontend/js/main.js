/* ════════════════════════════════════════════
   STITCH — Core JS
   ════════════════════════════════════════════ */

const API = '/api';

// ── API helpers ──────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const api = {
  getProducts:    (q = '') => apiFetch(`/products${q}`),
  getProduct:     (id)     => apiFetch(`/products/${id}`),
  getCart:        ()       => apiFetch('/cart'),
  addToCart:      (body)   => apiFetch('/cart', { method: 'POST', body: JSON.stringify(body) }),
  updateCartItem: (key, q) => apiFetch(`/cart/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify({ quantity: q }) }),
  removeCartItem: (key)    => apiFetch(`/cart/${encodeURIComponent(key)}`, { method: 'DELETE' }),
  clearCart:      ()       => apiFetch('/cart', { method: 'DELETE' }),
  checkout:       (body)   => apiFetch('/checkout', { method: 'POST', body: JSON.stringify(body) }),
};

// ── Nav ──────────────────────────────────────
function initNav() {
  const nav = document.querySelector('.nav');
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');

  window.addEventListener('scroll', () => {
    nav?.classList.toggle('scrolled', window.scrollY > 10);
  });

  hamburger?.addEventListener('click', () => {
    mobileNav?.classList.toggle('open');
  });

  // Active link
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (href !== '/' && path.startsWith(href))) {
      a.classList.add('active');
    }
  });

  updateCartCount();
}

// ── Cart count ───────────────────────────────
async function updateCartCount() {
  try {
    const { data } = await api.getCart();
    const count = data.items.reduce((s, i) => s + i.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
      el.classList.toggle('hidden', count === 0);
    });
  } catch {}
}

// ── Toast ────────────────────────────────────
function showToast(msg, icon = '✓') {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span class="toast-icon">${icon}</span>${msg}`;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Format price ─────────────────────────────
function fmt(price) {
  return 'EGP' + Number(price).toFixed(2);
}

// ── Skeleton loader ──────────────────────────
function skeletonCards(n = 4) {
  return Array.from({ length: n }, () => `
    <div class="product-card skeleton-card">
      <div class="product-img-wrap"><div class="skeleton skeleton-img"></div></div>
      <div class="product-info">
        <div class="skeleton skeleton-line short" style="width:40%"></div>
        <div class="skeleton skeleton-line" style="width:80%"></div>
        <div class="skeleton skeleton-line short" style="width:30%"></div>
      </div>
    </div>`).join('');
}

// ── Product card HTML ────────────────────────
function productCardHTML(p) {
  return `
    <div class="product-card" data-id="${p.id}" onclick="goToProduct('${p.id}')">
      <div class="product-img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        ${p.featured ? '<span class="product-badge new">New</span>' : ''}
        <button class="product-quick-add" onclick="quickAdd(event,'${p.id}')">
          Quick Add
        </button>
      </div>
      <div class="product-info">
        <div class="product-category">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-price"><span class="current">${fmt(p.price)}</span></div>
      </div>
    </div>`;
}

function goToProduct(id) {
  window.location.href = `/pages/product.html?id=${id}`;
}

async function quickAdd(e, id) {
  e.stopPropagation();
  const btn = e.target;
  btn.textContent = 'Adding…';
  btn.disabled = true;
  try {
    const { data: product } = await api.getProduct(id);
    await api.addToCart({ productId: id, size: product.sizes[0], quantity: 1 });
    showToast(`${product.name} added to cart`);
    updateCartCount();
    btn.textContent = '✓ Added';
    setTimeout(() => { btn.textContent = 'Quick Add'; btn.disabled = false; }, 1500);
  } catch (err) {
    btn.textContent = 'Quick Add';
    btn.disabled = false;
    showToast(err.message, '✕');
  }
}

// ── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', initNav);
