/* Small helpers that build pieces of HTML (icons, product cards, order cards, header, footer). */

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ICONS = {
  dresses: '<path d="M9 4h6l1 4 3 2-2 11H7L5 10l3-2z"/><path d="M9 4c0 2 1 3 3 3s3-1 3-3"/>',
  clothes: '<path d="M12 9V7.5a2 2 0 1 0-2-2"/><path d="M12 9l9 7a1 1 0 0 1-.6 1.8H3.6A1 1 0 0 1 3 16z"/>',
  womenswear: '<path d="M9 4h6l1 4 3 2-2 11H7L5 10l3-2z"/><path d="M9 4c0 2 1 3 3 3s3-1 3-3"/>',
  menswear: '<path d="M8 4 12 6l4-2 5 4-3 4-2-1v9H8v-9l-2 1-3-4z"/><path d="M10 5.2 12 8l2-2.8"/>',
  underwear: '<path d="M5 4h14l1 15-4 2-4-7-4 7-4-2z"/><path d="M5 9h14M8 4v5m8-5v5"/>',
  makeup: '<rect x="8.5" y="12" width="7" height="9" rx="1"/><rect x="9.5" y="8" width="5" height="4"/><path d="M9.5 8l2.5-5 2.5 5"/>',
  jewelry: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l3 6 3-6M12 21L9 9M12 21l3-12"/>',
  bags: '<path d="M5 8h14l1 13H4z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  shoes: '<path d="M3 17c4 0 5-5 6-9l4 3c2 1 5 2 8 2v4H3z"/><path d="M19 17v4"/>',
  masks: '<path d="M3 9c3-2 15-2 18 0v3c0 4-4 7-9 7s-9-3-9-7z"/><path d="M8 12h.01M16 12h.01M9 16c2 1 4 1 6 0"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5L16 9.5"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  gift: '<rect x="3" y="8" width="18" height="4"/><path d="M5 12v9h14v-9M12 8v13M12 8c-3 0-5-1-4-3s4 0 4 3zM12 8c3 0 5-1 4-3s-4 0-4 3z"/>',
  cart: '<path d="M3 4h2l2.4 11h11l2-8H6.5"/><circle cx="9" cy="19.5" r="1.2"/><circle cx="17" cy="19.5" r="1.2"/>',
  store: '<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9"/><path d="M5.5 12v8h13v-8"/>',
  truck: '<path d="M2 6h12v10H2zM14 10h4l3 3v3h-7"/><circle cx="6.5" cy="17.5" r="1.7"/><circle cx="17.5" cy="17.5" r="1.7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a14 14 0 0 1-3.1 3.8M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10.7 10.7 0 0 0 4.1-.8"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
};
const icon = (name, size = 22, stroke = 1.6, cls = '') =>
  `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;


/* toasts */
function notify(msg, type) {
  const host = document.getElementById('toasts');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'toast ' + (type === 'error' ? 'error' : '');
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(() => el.remove(), 3600);
}

const logo = (light) => `<a href="#/" class="logo ${light ? 'logo-light' : ''}"><span class="logo-mark">A</span><span class="logo-text">${esc(BRAND.name)}</span></a>`;



function productCard(p) {
  const user = me();
  const shop = shopById(p.shopId);
  const canBuy = !user || user.role === 'buyer';
  return `
  <div class="pcard">
    <a href="#/product/${p.id}" class="pcard-img">${art(p)}
      ${p.stock > 0 && p.stock <= 3 ? `<span class="tag">Only ${p.stock} left</span>` : ''}
      ${p.stock === 0 ? '<span class="tag tag-dark">Sold out</span>' : ''}
    </a>
    <div class="pcard-body">
      <span class="eyebrow">${esc(catLabel(p.category))}</span>
      <a href="#/product/${p.id}" class="pcard-name">${esc(p.name)}</a>
      <a href="#/shop/${p.shopId}" class="pcard-shop">${icon('store', 14)} ${esc(shop ? shop.name : '')}</a>
      <div class="pcard-row"><strong>${money(p.price)}</strong>
        ${canBuy && p.stock > 0 ? `<button class="mini-btn" aria-label="Add to cart" data-act="add-cart" data-id="${p.id}">${icon('plus', 18)}</button>` : ''}
      </div>
    </div>
  </div>`;
}


function orderCard(o, role) {
  const shop = shopById(o.shopId);
  const buyer = db.users.find((u) => u.id === o.buyerId);
  const addr = o.address || {};
  return `
  <div class="order">
    <div class="order-head">
      <div><strong>Order #${esc(String(o.id).slice(0, 8).toUpperCase())}</strong><span class="muted"> · ${new Date(o.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
      ${statusBadge(o.status)}
    </div>
    <div class="order-items">
      ${o.items.map((i) => `<div class="order-item">${art({ art: i.art, category: i.category, image: i.image, name: i.name }, { cls: 'thumb' })}<div><div>${esc(i.name)}</div><div class="muted">Qty ${i.qty} · ${money(i.price)}</div></div></div>`).join('')}
    </div>
    <div class="order-foot">
      <div class="muted">${role === 'buyer'
        ? `Sold by <a href="#/shop/${o.shopId}"><u>${esc(shop ? shop.name : '')}</u></a>`
        : `Buyer: ${esc(buyer ? buyer.name : '')} · ${esc(addr.phone)}<br>Ship to: ${esc(addr.line)}, ${esc(addr.city)}`}</div>
      <div class="order-money">
        <div>Total <strong>${money(o.subtotal)}</strong></div>
      </div>
    </div>
    <div class="order-actions">
      <span class="muted small">Order updates and payments are unavailable until checkout is enabled.</span>
    </div>
  </div>`;
}


/* ───────────── product pictures (illustrated, so the site looks rich before sellers upload photos) ───────────── */
function illustration(cat, c1, c2) {
  const W = 'rgba(255,255,255,.95)', W2 = 'rgba(255,255,255,.7)', G = '#a9744f', D = 'rgba(70,40,20,.2)';
  const bg = '<circle cx="168" cy="44" r="72" fill="rgba(255,255,255,.18)"/><circle cx="20" cy="228" r="62" fill="rgba(255,255,255,.14)"/>';
  const floor = '<ellipse cx="100" cy="228" rx="54" ry="7" fill="rgba(0,0,0,.14)"/>';
  const clothingShape = `<path d="M84 36 L100 66 L116 36 L127 43 L121 104 L154 212 Q100 234 46 212 L79 104 L73 43 Z" fill="${W}"/>
      <path d="M79 104 Q100 116 121 104 L122 116 Q100 128 78 116 Z" fill="${G}"/>
      <path d="M92 128 L70 214 M108 128 L130 214 M100 130 L100 222" stroke="${D}" stroke-width="2" fill="none"/>`;
  const shapes = {
    clothes: clothingShape,
    womenswear: clothingShape,
    menswear: `<path d="M77 36 100 48 123 36 151 54 138 88 125 80 130 216H70L75 80 62 88 49 54Z" fill="${W}"/>
      <path d="M100 48v168M91 68l9 10 9-10" stroke="${G}" stroke-width="3" fill="none"/>
      <circle cx="100" cy="98" r="2" fill="${G}"/><circle cx="100" cy="122" r="2" fill="${G}"/><circle cx="100" cy="146" r="2" fill="${G}"/>`,
    underwear: `<path d="M48 54h104l-8 154h-36l-8-72-8 72H56z" fill="${W}"/>
      <path d="M48 54h104l-3 42H51z" fill="${G}"/>
      <path d="M51 96l49 20 49-20" stroke="${D}" stroke-width="3" fill="none"/>`,
    makeup: `<rect x="62" y="150" width="36" height="64" rx="5" fill="${W}"/>
      <rect x="62" y="132" width="36" height="20" rx="3" fill="${G}"/>
      <path d="M67 132 V100 Q67 86 80 78 Q93 86 93 100 V132 Z" fill="#8f4a32"/>
      <path d="M72 100 Q74 92 80 88" stroke="rgba(255,255,255,.55)" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="142" cy="186" r="32" fill="${W}"/><circle cx="142" cy="186" r="23" fill="${c2}" opacity=".75"/><circle cx="142" cy="186" r="13" fill="${W2}"/>`,
    jewelry: `<path d="M46 38 Q100 196 154 38" fill="none" stroke="${G}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M60 38 Q100 160 140 38" fill="none" stroke="${G}" stroke-width="2.2" opacity=".75" stroke-linecap="round"/>
      <polygon points="100,146 84,166 100,194 116,166" fill="${W}" stroke="${G}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M84 166 H116 M100 146 L92 166 L100 194 L108 166 Z" stroke="${G}" stroke-width="1.5" fill="none"/>
      <circle cx="56" cy="204" r="16" fill="none" stroke="${G}" stroke-width="6"/><polygon points="56,180 48,190 64,190" fill="${W}" stroke="${G}" stroke-width="1.5"/>
      <circle cx="152" cy="208" r="10" fill="${W}"/><circle cx="149" cy="205" r="3" fill="rgba(255,255,255,1)"/>`,
    bags: `<path d="M70 102 Q70 54 100 54 Q130 54 130 102" fill="none" stroke="${W}" stroke-width="7" stroke-linecap="round"/>
      <path d="M46 102 H154 L164 214 Q100 228 36 214 Z" fill="${W}"/>
      <path d="M46 102 H154 L158 136 Q100 154 42 136 Z" fill="${D}"/>
      <rect x="90" y="130" width="20" height="17" rx="3" fill="${G}"/>`,
    shoes: `<path d="M38 198 C36 180 58 174 78 158 C98 142 104 114 112 98 L130 104 C128 130 136 148 160 160 L162 172 L156 222 L145 222 L143 178 C118 186 92 204 66 206 C50 207 39 205 38 198 Z" fill="${W}"/>
      <path d="M38 198 C48 207 66 206 66 206 C92 204 118 186 143 178" stroke="${G}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M112 98 L130 104" stroke="${G}" stroke-width="4" stroke-linecap="round"/>`,
    masks: `<ellipse cx="100" cy="118" rx="54" ry="76" fill="${W}"/>
      <ellipse cx="80" cy="102" rx="13" ry="6" fill="${c2}" opacity=".65"/><ellipse cx="120" cy="102" rx="13" ry="6" fill="${c2}" opacity=".65"/>
      <path d="M96 122 Q100 130 104 122" stroke="${D}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M86 156 Q100 166 114 156 Q100 176 86 156 Z" fill="${c2}" opacity=".65"/>
      <rect x="26" y="172" width="46" height="56" rx="6" fill="${W2}"/><path d="M38 192 Q49 180 60 192 Q49 210 38 192 Z" fill="${G}"/>`,
  };
  return `<svg class="illus" viewBox="0 0 200 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${bg}${floor}${shapes[cat] || shapes.clothes}</svg>`;
}

// Product picture: the seller's uploaded photo, or an illustrated tile for that category.
function art(item, o = {}) {
  const cls = o.cls || '';
  const img = item && ((item.images && item.images[o.index || 0]) || item.image);
  if (img) return `<div class="art ${cls}"><img src="${esc(img)}" alt="${esc(item.name || '')}" loading="lazy"></div>`;
  const c = (item && item.art) || ['#f0e2d3', '#c9a27a'];
  return `<div class="art ${cls}" style="background:linear-gradient(145deg,${c[0]},${c[1]})">${illustration((item && item.category) || 'clothes', c[0], c[1])}</div>`;
}

/* ───────────── shop helpers ───────────── */
const shopLoc = (sh) => { const a = [sh.city, sh.state].filter(Boolean); return a.length === 2 && a[0] === a[1] ? a[0] : a.join(', '); };
const shopAvatar = (sh, cls = '') => sh.logo
  ? `<span class="avatar avatar-img ${cls}"><img src="${esc(sh.logo)}" alt=""></span>`
  : `<span class="avatar ${cls}">${esc((sh.name || '?')[0])}</span>`;
function verifyBadge(sh) {
  if (sh.verified === 'rejected') return '<span class="pill pill-red">Not approved</span>';
  if (sh.verified === 'pending') return '<span class="pill pill-gray">New seller · under review</span>';
  return `<span class="pill pill-gold">${icon('shield', 14)} Verified seller</span>`;
}

/* ───────────── header & footer ───────────── */
function headerHTML(ui, route) {
  const user = me();
  const cartCount = db.cart.reduce((a, c) => a + c.qty, 0);
  const cat = route.q.get('cat');
  const p0 = route.parts[0];
  const link = (href, text, active) => `<a href="${href}" class="${active ? 'active' : ''}">${text}</a>`;
  const dash = user && (user.role === 'seller' ? 'Seller dashboard' : user.role === 'admin' ? 'Admin dashboard' : 'My account');
  return `
  <div class="container nav">
    ${logo()}
    <nav class="nav-links ${ui.navOpen ? 'open' : ''}">
      ${link('#/', 'Home', !p0)}
      ${link('#/browse', 'Shop all', p0 === 'browse' && !cat)}
      ${CATEGORIES.slice(0, 3).map((c) => link('#/browse?cat=' + c.id, c.label, cat === c.id)).join('')}
      ${link('#/about', 'About us', p0 === 'about')}
      ${!user || user.role === 'buyer' ? '<a href="#/signup?role=seller" class="nav-sell">Sell with us</a>' : '<span class="nav-sell"></span>'}
    </nav>
    <div class="nav-actions">
      ${!user || user.role === 'buyer' ? `<a href="#/cart" class="icon-btn" aria-label="Cart">${icon('cart')}${cartCount ? `<span class="count">${cartCount}</span>` : ''}</a>` : ''}
      ${user ? `
        <div class="user-menu">
          <button class="user-chip" data-act="toggle-user"><span class="avatar">${esc(user.name[0].toUpperCase())}</span><span class="user-chip-name">${esc(user.name.split(' ')[0])}</span></button>
          ${ui.userMenu ? `<div class="dropdown">
            <a href="${user.role === 'admin' ? '#/admin' : '#/dashboard'}">${dash}</a>
            ${user.role !== 'admin' ? '<a href="#/messages">Messages</a>' : ''}
            <button data-act="logout">Log out</button></div>` : ''}
        </div>` : `
        <a href="#/login" class="btn btn-ghost btn-sm hide-sm">Log in</a>
        <a href="#/signup" class="btn btn-primary btn-sm">Join</a>`}
      <button class="icon-btn burger" data-act="toggle-nav" aria-label="Menu">${icon('menu')}</button>
    </div>
  </div>`;
}

function footerHTML() {
  return `
  <div class="container footer-grid">
    <div>${logo(true)}<p class="footer-about">${esc(BRAND.name)} is a fashion and beauty marketplace for everyone. Accounts, approved shops, product listings, image uploads and buyer-seller messages use Supabase. Checkout, orders and payouts are not enabled.</p></div>
    <div><h4>Shop</h4>${CATEGORIES.map((c) => `<a href="#/browse?cat=${c.id}">${c.label}</a>`).join('')}</div>
    <div><h4>${esc(BRAND.name)}</h4><a href="#/about">About us</a><a href="#/signup?role=seller">Become a seller</a><a href="#/terms">Terms &amp; service status</a><a href="#/terms?s=commission">Commission proposal</a></div>
    <div><h4>Contact us</h4>
      <a href="mailto:${esc(BRAND.supportEmail)}">${esc(BRAND.supportEmail)}</a>
      <a href="tel:${esc(BRAND.phone)}">${esc(BRAND.phoneDisplay)}</a>
      <a href="${esc(BRAND.whatsapp)}" target="_blank" rel="noopener">Chat on WhatsApp</a>
      <span class="footer-addr">${esc(BRAND.address)}</span>
    </div>
  </div>
  <div class="container footer-bottom"><span>© ${new Date().getFullYear()} ${esc(BRAND.name)}. All rights reserved.</span></div>`;
}

const statusBadge = (st) => {
  const status = ORDER_STATUS[st] || { label: 'Unknown', tone: 'gold' };
  return `<span class="badge badge-${status.tone}">${status.label}</span>`;
};
