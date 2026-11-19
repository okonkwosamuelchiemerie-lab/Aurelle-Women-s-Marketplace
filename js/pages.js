/* Every page is a function that returns HTML. `ui` and `route` live in app.js. */

const notFound = (t) => `<div class="container page"><div class="empty"><h3>${t || 'Page not found'}</h3><a href="#/browse" class="btn btn-primary">Back to shop</a></div></div>`;
const pct = (n) => Math.round(n * 100);
const LANDING_HERO_TILES = [
  { image: 'assets/images/hero-shopping.jpg', alt: 'A woman shopping at a boutique', caption: 'Find your next favourite' },
  { image: 'assets/images/hero-style.jpg', alt: 'A bright, playful fashion portrait', caption: 'Style for every day' },
  { image: 'assets/images/hero-white-dress.jpg', alt: 'A woman in a white dress', caption: 'A look to love' },
];

/* ───────────── LANDING (for visitors who are not logged in) ───────────── */
function pageLanding() {
  const featured = liveProducts().filter((p) => p.stock > 0).sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);
  return `
  <section class="hero"><div class="container hero-grid">
    <div class="hero-copy">
      <span class="pill pill-gold">Fashion for everyone · Verified sellers</span>
      <h1>Style for everyone, from sellers you can trust.</h1>
      <p>Men's and women's clothing, makeup, skincare, jewelry, watches, bags and shoes from independent boutiques. Explore new styles and ask sellers about their products.</p>
      <div class="hero-cta">
        <a href="#/browse" class="btn btn-gold btn-lg">Start shopping ${icon('arrow', 18)}</a>
        <a href="#/signup?role=seller" class="btn btn-outline-light btn-lg">Open your shop</a>
      </div>
      <ul class="hero-points">
        <li>${icon('store', 18)} Independent boutiques, all in one place</li>
        <li>${icon('chat', 18)} Chat before you buy</li>
        <li>${icon('gift', 18)} Hidden gifts for loyal shoppers</li>
      </ul>
    </div>
    <div class="hero-visual" aria-hidden="true">
      ${LANDING_HERO_TILES.map((tile, i) => `<div class="hero-tile hero-tile-${i + 1}">${art({ name: tile.alt, images: [tile.image] }, { size: 'lg' })}<div class="hero-tile-cap"><span>${esc(tile.caption)}</span><strong>Explore</strong></div></div>`).join('')}
    </div>
  </div></section>

  <section class="section"><div class="container">
    <div class="section-head"><span class="eyebrow">Browse by category</span><h2>Find your next favourite thing</h2></div>
    <div class="cat-grid">
      ${CATEGORIES.map((c) => `<a href="#/browse?cat=${c.id}" class="cat-tile"><span class="cat-icon">${icon(c.id, 34, 1.3)}</span><strong>${c.label}</strong><span class="muted small">${c.blurb}</span></a>`).join('')}
    </div>
  </div></section>

  <section class="section section-tint"><div class="container">
    <div class="section-head row"><div><span class="eyebrow">Just arrived</span><h2>New from our sellers</h2></div><a href="#/browse" class="link-arrow">View all ${icon('arrow', 16)}</a></div>
    <div class="grid-products">${featured.map(productCard).join('')}</div>
  </div></section>

  <section class="section"><div class="container">
    <div class="section-head center"><span class="eyebrow">How it works</span><h2>Discover styles and connect with sellers</h2>
      <p class="lead">Browse products and message sellers directly. Online purchases and payments are not available through the site.</p></div>
    <div class="steps">
      ${[['search', '1. Explore boutiques', 'Browse clothing, beauty and accessories from independent sellers.'],
         ['chat', '2. Ask the seller', 'Message about sizes, colours, availability or delivery options.'],
         ['star', '3. Find your style', 'Compare products and discover new favourites.'],
         ['store', '4. Support local shops', 'Connect directly with the people behind each boutique.']]
        .map(([i, t, d]) => `<div class="step"><span class="step-icon">${icon(i, 26)}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}
    </div>
  </div></section>

  <section class="band"><div class="container band-grid">
    <div>
      <span class="eyebrow eyebrow-light">For sellers</span>
      <h2>Open your boutique on ${esc(BRAND.name)}</h2>
      <p>Create a shop, upload products and chat with buyers. Shops appear publicly after approval; checkout and seller payouts are not enabled.</p>
      <ul class="ticks">
        <li>${icon('check', 18)} Your own shop page with your name and bio</li>
        <li>${icon('check', 18)} Product listings with up to five photos each</li>
        <li>${icon('check', 18)} Chat with buyers directly on the site</li>
        <li>${icon('check', 18)} Add products and connect with buyers</li>
      </ul>
      <a href="#/signup?role=seller" class="btn btn-gold btn-lg">Become a seller</a>
    </div>
    <div class="fee-card">
      <span class="eyebrow">Simple pricing</span>
      <div class="fee-big">${pct(COMMISSION.reduced)}–${pct(COMMISSION.standard)}%</div>
      <p>commission on each sold item. No setup fee and no monthly fee.</p>
      <div class="fee-rows">
        <div><span>Starting rate</span><strong>${pct(COMMISSION.standard)}%</strong></div>
        <div><span>After ${money(COMMISSION.reducedAfterSales)} in sales</span><strong>${pct(COMMISSION.reduced)}%</strong></div>
      </div>
    </div>
  </div></section>

  <section class="section"><div class="container">
    <div class="section-head"><span class="eyebrow">Meet the sellers</span><h2>Featured boutiques</h2></div>
    <div class="shop-grid">
      ${liveShops().slice(0, 4).map(shopCardHTML).join('')}
    </div>
  </div></section>

  <section class="section section-tint"><div class="container rewards-grid">
    <div class="gift-box"><img src="assets/images/gift-box.jpg" alt="A wrapped gift with a pink ribbon"><span>?</span></div>
    <div>
      <span class="eyebrow">Loyalty rewards</span>
      <h2>Loyalty rewards</h2>
      <p class="lead">Buyer accounts are ready. The loyalty rewards programme is not active yet.</p>
      <a href="#/signup?role=buyer" class="btn btn-primary btn-lg">Create a buyer account</a>
    </div>
  </div></section>

  <section class="section"><div class="container contact-strip">
    <div><span class="eyebrow">Need help?</span><h2>Talk to a real person</h2><p>Questions about an order or selling with us? We're one message away.</p></div>
    <div class="contact-btns">
      <a class="btn btn-primary btn-lg" href="${esc(BRAND.whatsapp)}" target="_blank" rel="noopener">WhatsApp us</a>
      <a class="btn btn-outline btn-lg" href="tel:${esc(BRAND.phone)}">Call ${esc(BRAND.phoneDisplay)}</a>
      <a class="btn btn-outline btn-lg" href="mailto:${esc(BRAND.supportEmail)}">Email us</a>
    </div>
  </div></section>`;
}

/* ───────────── BROWSE ───────────── */
function browseItems() {
  const cat = route.q.get('cat') || 'all';
  return liveProducts().filter((p) => (cat === 'all' || p.category === cat) && (!ui.q || p.name.toLowerCase().includes(ui.q.toLowerCase())));
}
function browseGridHTML() {
  const items = browseItems();
  const cards = items.map(productCard).join('');
  return `<p class="muted small">${items.length} item${items.length === 1 ? '' : 's'}</p>` +
    (items.length ? `<div class="product-marquee" role="region" tabindex="0" aria-label="Products, scroll horizontally"><div class="product-marquee-track"><div class="product-marquee-group">${cards}</div></div></div>` : '<div class="empty"><h3>Nothing found</h3><p>Try another category or search word.</p></div>');
}
function pageBrowse() {
  const cat = route.q.get('cat') || 'all';
  const title = cat === 'all' ? 'Shop all' : catLabel(cat);
  const categoryLinks = `<a href="#/browse" class="chip ${cat === 'all' ? 'on' : ''}">All</a>` +
    CATEGORIES.map((c) => `<a href="#/browse?cat=${c.id}" class="chip ${cat === c.id ? 'on' : ''}">${c.label}</a>`).join('');
  return `
  <div class="container page">
    <div class="page-head"><span class="eyebrow">The collection</span><h1>${esc(title)}</h1></div>
    <div class="toolbar">
      <nav class="browse-chips" aria-label="Product categories" tabindex="0"><div class="browse-chips-track"><div class="browse-chip-group">${categoryLinks}</div></div></nav>
      <div class="toolbar-right">
        <label class="search">${icon('search', 18)}<input id="q" placeholder="Search products" value="${esc(ui.q)}"></label>
        <button class="icon-btn browse-refresh" type="button" data-act="refresh-browse" aria-label="Refresh products" title="Refresh products">${icon('refresh', 20)}</button>
      </div>
    </div>
    <div id="grid">${browseGridHTML()}</div>
  </div>`;
}

/* ───────────── PRODUCT ───────────── */
function pageProduct(id) {
  const p = productById(id);
  if (!p || !shopIsLive(shopById(p.shopId))) return notFound('Product not found');
  const user = me();
  const shop = shopById(p.shopId);
  const isSeller = user && user.role === 'seller';
  const related = liveProducts().filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
  const imgCount = (p.images && p.images.length) || 1;
  const qty = Math.min(Math.max(1, ui.qty), Math.max(1, p.stock));
  return `
  <div class="container page">
    <div class="crumbs"><a href="#/browse">Shop</a> / <a href="#/browse?cat=${p.category}">${esc(catLabel(p.category))}</a> / ${esc(p.name)}</div>
    <div class="pdp">
      <div class="pdp-gallery">
        ${art(p, { size: 'lg', cls: 'pdp-main', index: ui.img })}
        ${imgCount > 1 ? `<div class="pdp-thumbs">${p.images.map((_, i) => `<button class="${i === ui.img ? 'on' : ''}" data-act="pick-img" data-i="${i}">${art(p, { index: i })}</button>`).join('')}</div>` : ''}
      </div>
      <div class="pdp-info">
        <span class="eyebrow">${esc(catLabel(p.category))}</span>
        <h1>${esc(p.name)}</h1>
        <div class="price">${money(p.price)}</div>
        <p class="desc">${esc(p.description)}</p>
        <a href="#/shop/${shop.id}" class="seller-card">${shopAvatar(shop)}<div><strong>${esc(shop.name)}</strong><span class="muted small">${esc(shopLoc(shop))} · ${shop.verified === 'pending' ? 'New seller' : 'Verified seller'}</span></div>${icon('arrow', 18)}</a>
        ${p.stock > 0 ? `
          ${!isSeller ? `<div class="buy-row">
            <div class="qty"><button data-act="pdp-qty" data-d="-1">−</button><span>${qty}</span><button data-act="pdp-qty" data-d="1">+</button></div>
            <button class="btn btn-primary btn-lg grow" data-act="pdp-add" data-id="${p.id}">${icon('cart', 18)} Add to cart</button>
            <button class="btn btn-gold btn-lg" data-act="pdp-buy" data-id="${p.id}">Buy now</button></div>` : '<div class="note">You\'re logged in as a seller. Log in with a buyer account to purchase.</div>'}
          <div class="stock muted small">${p.stock} in stock</div>` : '<div class="note">This item is sold out.</div>'}
        ${!isSeller ? `<button class="btn btn-outline btn-block" data-act="chat-seller" data-to="${shop.ownerId}" data-product="${p.id}">${icon('chat', 18)} Chat with seller</button>` : ''}
        <div class="assure">
          <div>${icon('lock', 20)}<span><strong>Checkout is not active.</strong> Payments and seller payouts are not enabled yet.</span></div>
          <div>${icon('truck', 20)}<span><strong>Delivery by seller.</strong> Agree delivery details in chat before you pay.</span></div>
        </div>
      </div>
    </div>
    ${related.length ? `<section class="section-sm"><h2>You may also like</h2><div class="grid-products">${related.map(productCard).join('')}</div></section>` : ''}
  </div>`;
}

/* ───────────── AUTH ───────────── */
function pageLogin() {
  if (!isAuthReady()) return '<div class="container page narrow"><p>Connecting securely to your account…</p></div>';
  if (me()) return redirect(route.q.get('next') || '/dashboard');
  return `
  <div class="auth-wrap"><div class="auth-card">
    <h1>Welcome back</h1>
    <form data-form="login">
      <label class="field"><span>Email</span><input name="email" type="email" required></label>
      <label class="field"><span>Password</span><span class="password-entry"><input name="password" type="password" required><button class="password-toggle" type="button" data-act="toggle-password" aria-label="Show password" aria-pressed="false" title="Show password">${icon('eye', 18)}</button></span></label>
      <div class="error" id="form-error" hidden></div>
      <button class="btn btn-primary btn-lg btn-block" type="submit">Log in</button>
    </form>
    <p class="muted center small" style="margin:14px 0 4px"><a href="#/forgot"><u>Forgot your password?</u></a></p>
    <p class="muted center small" style="margin:4px 0 14px">New here? <a href="#/signup"><u>Create an account</u></a></p>
  </div></div>`;
}

function pageForgot() {
  return `
  <div class="auth-wrap"><div class="auth-card">
    <h1>Reset your password</h1>
    <p class="muted small">Enter the email you signed up with. We will send you a link to choose a new password.</p>
    <form data-form="forgot">
      <label class="field"><span>Email</span><input name="email" type="email" required></label>
      <div class="error" id="form-error" hidden></div>
      <button class="btn btn-primary btn-lg btn-block" type="submit">Send reset link</button>
    </form>
    <p class="muted center small" style="margin:14px 0"><a href="#/login"><u>Back to log in</u></a></p>
  </div></div>`;
}

function pageReset() {
  if (!isAuthReady()) return '<div class="container page narrow"><p>Checking your reset link…</p></div>';
  if (!me()) return `
  <div class="auth-wrap"><div class="auth-card">
    <h1>This link has expired</h1>
    <p class="muted small">Reset links work once and only for a short time. Request a new one.</p>
    <a class="btn btn-primary btn-block" href="#/forgot">Get a new link</a>
  </div></div>`;
  return `
  <div class="auth-wrap"><div class="auth-card">
    <h1>Choose a new password</h1>
    <form data-form="reset">
      <label class="field"><span>New password</span><input name="password" type="password" minlength="8" required placeholder="At least 8 characters"></label>
      <label class="field"><span>Repeat new password</span><input name="again" type="password" minlength="8" required></label>
      <div class="error" id="form-error" hidden></div>
      <button class="btn btn-primary btn-lg btn-block" type="submit">Save new password</button>
    </form>
  </div></div>`;
}

// Used on the buyer profile, seller shop and admin settings screens.
function passwordCardHTML() {
  return `
    <form class="card form-card narrow-card" data-form="change-password">
      <h3>Change your password</h3>
      <label class="field"><span>Current password</span><input name="current" type="password" autocomplete="current-password" required></label>
      <label class="field"><span>New password</span><input name="next" type="password" minlength="8" autocomplete="new-password" required placeholder="At least 8 characters"></label>
      <label class="field"><span>Repeat new password</span><input name="again" type="password" minlength="8" autocomplete="new-password" required></label>
      <div class="error" id="pw-error" hidden></div>
      <button class="btn btn-outline" type="submit">Update password</button>
    </form>`;
}

function uploaderHTML() {
  return ui.newImages.map((src, i) => `<div class="up-thumb"><img src="${esc(src)}" alt=""><button type="button" data-act="rm-image" data-i="${i}" aria-label="Remove">×</button></div>`).join('') +
    (ui.newImages.length < 5 ? `<label class="up-add">${icon('upload', 22)}<span>Add photos</span><input type="file" id="photos" accept="image/*" multiple hidden></label>` : '');
}

function buyerDashboard(user) {
  const tab = ui.buyerTab;
  const orders = db.orders.filter((o) => o.buyerId === user.id);
  const spend = buyerSpend(user.id);
  let body = '';
  if (tab === 'overview') {
    body = `
    <div class="stat-grid">
      <div class="stat"><span>Total spent</span><strong>${money(spend)}</strong></div>
      <div class="stat"><span>Orders</span><strong>${orders.length}</strong></div>
      <div class="stat"><span>Awaiting delivery</span><strong>${orders.filter((o) => o.status === 'paid' || o.status === 'shipped').length}</strong></div>
      <div class="stat"><span>Rewards</span><strong>Not active yet</strong></div>
    </div>
    <div class="note note-gold">${icon('gift', 18)} <span>Rewards and order history are not active. No purchases are processed through the site.</span></div>`;
  } else if (tab === 'orders') {
    body = `<div class="olist">
      <div class="note note-gold">${icon('shield', 18)} <span>Checkout is disabled, so no new orders can be placed or payments collected.</span></div>
      ${orders.length === 0 ? '<div class="empty"><h3>No orders yet</h3><p>Your orders will show up here.</p><a href="#/browse" class="btn btn-primary">Start shopping</a></div>' : orders.map((o) => orderCard(o, 'buyer')).join('')}</div>`;
  } else {
    body = `
    <form class="card form-card narrow-card" data-form="update-profile">
      <div class="field"><span>Name</span><div>${esc(user.name)}</div></div>
      <div class="field"><span>Email</span><div>${esc(user.email)}</div></div>
      <div class="field"><span>Phone</span><div>${esc(user.phone)}</div></div>
      <label class="field"><span>Default delivery address</span><textarea name="address" rows="3" placeholder="House number, street, area, city">${esc(user.address)}</textarea></label>
      <button class="btn btn-primary" type="submit">Save</button>
    </form>
    ${passwordCardHTML()}`;
  }
  return `
  <div class="container page">
    <div class="dash-head"><div><span class="eyebrow">My account</span><h1>Hello, ${esc(user.name.split(' ')[0])}</h1></div><a href="#/browse" class="btn btn-primary btn-sm">Continue shopping</a></div>
    <div class="tabs">${[['overview', 'Overview'], ['orders', `My orders (${orders.length})`], ['profile', 'Profile']].map(([id, l]) => `<button class="${tab === id ? 'on' : ''}" data-act="tab" data-scope="buyer" data-tab="${id}">${l}</button>`).join('')}</div>
    ${body}
  </div>`;
}

/* ───────────── CART & CHECKOUT ───────────── */
function pageCart() {
  const user = me();
  if (user && user.role === 'seller') return `<div class="container page"><div class="empty"><h3>Sellers can't shop</h3><p>Log in with a buyer account to buy.</p></div></div>`;
  const lines = cartDetailed();
  const total = lines.reduce((a, l) => a + l.product.price * l.qty, 0);
  return `
  <div class="container page">
    <div class="page-head"><span class="eyebrow">Your bag</span><h1>Shopping cart</h1></div>
    ${lines.length === 0 ? '<div class="empty"><h3>Your cart is empty</h3><p>Find something you love.</p><a href="#/browse" class="btn btn-primary">Start shopping</a></div>' : `
    <div class="cart-grid">
      <div class="cart-lines">
        ${lines.map(({ product: p, qty, shop }) => `
        <div class="cart-line">${art(p, { cls: 'thumb' })}
          <div class="cart-info"><a href="#/product/${p.id}"><strong>${esc(p.name)}</strong></a><span class="muted small">Sold by ${esc(shop ? shop.name : '')}</span>
            <div class="qty qty-sm"><button data-act="cart-qty" data-id="${p.id}" data-q="${qty - 1}">−</button><span>${qty}</span><button data-act="cart-qty" data-id="${p.id}" data-q="${Math.min(p.stock, qty + 1)}">+</button></div></div>
          <div class="cart-price"><strong>${money(p.price * qty)}</strong><button class="icon-btn danger" aria-label="Remove" data-act="cart-remove" data-id="${p.id}">${icon('trash', 18)}</button></div>
        </div>`).join('')}
      </div>
      <aside class="card summary">
        <h3>Order summary</h3>
        <div class="sum-row"><span>Subtotal</span><strong>${money(total)}</strong></div>
        <div class="sum-row muted"><span>Delivery</span><span>Agreed with seller</span></div>
        <div class="sum-row total"><span>Total</span><strong>${money(total)}</strong></div>
        <a href="#/checkout" class="btn btn-primary btn-lg btn-block">Checkout</a>
        <p class="muted small" style="margin-top:10px">Paystack test mode only. No real charge or seller payout.</p>
      </aside>
    </div>`}
  </div>`;
}

function pageCheckout() {
  const user = me();
  if (!user) return redirect('/login?next=' + encodeURIComponent('/checkout'));
  if (user.role !== 'buyer') return redirect('/dashboard');
  const lines = cartDetailed();
  if (!lines.length) return redirect('/cart');
  const total = lines.reduce((a, l) => a + l.product.price * l.qty, 0);
  const singleShop = new Set(lines.map((line) => line.product.shopId)).size === 1;
  return `
  <div class="container page">
    <div class="page-head"><span class="eyebrow">Checkout</span><h1>Checkout</h1></div>
    <div class="note note-gold">${icon('lock', 18)}<span>Paystack test mode only. No real charge will be made. Seller payouts are not enabled.</span></div>
    ${!singleShop ? '<div class="note note-gold">Checkout one shop at a time. Remove items from other shops in your cart.</div>' : ''}
    <form class="cart-grid" data-form="checkout">
      <div>
        <div class="card form-card"><h3>Delivery details</h3>
          <label class="field"><span>Address</span><textarea name="line" rows="2" required placeholder="House number, street, area">${esc(user.address)}</textarea></label>
          <div class="two-col">
            <label class="field"><span>City / State</span><input name="city" required></label>
            <label class="field"><span>Phone</span><input name="phone" required value="${esc(user.phone)}"></label>
          </div>
        </div>
        <div class="error" id="form-error" hidden></div>
      </div>
      <aside class="card summary">
        <h3>Your order</h3>
        ${lines.map(({ product: p, qty }) => `<div class="sum-row"><span>${esc(p.name)} × ${qty}</span><span>${money(p.price * qty)}</span></div>`).join('')}
        <div class="sum-row total"><span>Total to pay</span><strong>${money(total)}</strong></div>
        <button class="btn btn-gold btn-lg btn-block" id="pay-btn" type="submit" ${singleShop ? '' : 'disabled'}>${singleShop ? 'Continue to Paystack test checkout' : 'Checkout one shop at a time'}</button>
      </aside>
    </form>
  </div>`;
}

function pagePaymentResult() {
  const user = me();
  if (!user) return redirect('/login?next=' + encodeURIComponent(location.hash.slice(1)));
  const reference = route.q.get('reference');
  if (!reference) return '<div class="container page"><div class="empty"><h3>Payment reference not found</h3><a class="btn btn-primary" href="#/cart">Return to cart</a></div></div>';
  if (ui.paymentVerified) {
    return `<div class="container page narrow"><div class="empty"><h1>Test payment confirmed</h1><p>Your test order was recorded. No real payment was taken and seller payouts are not enabled.</p><p class="muted small">Order ${esc(ui.paymentVerified)}</p><a class="btn btn-primary" href="#/dashboard?tab=orders">View orders</a></div></div>`;
  }
  return `<div class="container page narrow"><div class="empty"><h1>Confirm test payment</h1><p>We’re checking the Paystack transaction. The order will only be marked paid after server verification.</p><button class="btn btn-gold btn-lg" data-act="verify-payment">Verify test payment</button></div></div>`;
}

/* ───────────── MESSAGES ───────────── */
function pageMessages() {
  const user = me();
  if (!user) return redirect('/login?next=' + encodeURIComponent('/messages'));
  const to = route.q.get('to');
  const productId = route.q.get('product');
  let threads = threadsFor(user.id);
  const active = to || (threads[0] && threads[0].other) || null;
  if (active && !threads.some((t) => t.other === active)) threads = [{ other: active, last: { text: 'New conversation' } }].concat(threads);
  const convo = active ? db.messages.filter((m) => (m.from === user.id && m.to === active) || (m.from === active && m.to === user.id)) : [];
  const product = productId ? productById(productId) : null;
  const otherShop = active ? db.shops.find((shop) => shop.ownerId === active) : null;
  return `
  <div class="container page">
    <div class="page-head"><span class="eyebrow">Inbox</span><h1>Messages</h1></div>
    <div class="chat">
      <aside class="chat-list">
        ${threads.length === 0 ? '<p class="muted pad">No conversations yet. Open a product and tap "Chat with seller".</p>' : ''}
        ${threads.map((t) => `<button class="${t.other === active ? 'on' : ''}" data-act="open-chat" data-id="${t.other}"><span class="avatar">${esc(displayName(t.other)[0])}</span><span><strong>${esc(displayName(t.other))}</strong><span class="muted small clip">${esc(t.last.text)}</span></span></button>`).join('')}
      </aside>
      <section class="chat-main">
        ${!active ? '<div class="empty"><h3>Select a conversation</h3></div>' : `
        <div class="chat-head"><strong>${esc(displayName(active))}</strong>${otherShop ? `<a class="small" href="#/shop/${otherShop.id}"><u>View shop</u></a>` : ''}</div>
        <div class="chat-body" id="chat-body">
          ${product ? `<div class="chat-product">Asking about: <a href="#/product/${product.id}">${esc(product.name)}</a></div>` : ''}
          ${convo.length === 0 ? '<p class="muted center small">Say hello. Ask about sizes, colours or delivery.</p>' : ''}
          ${convo.map((m) => `<div class="bubble ${m.from === user.id ? 'me' : ''}">${esc(m.text)}<span>${new Date(m.at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</span></div>`).join('')}
        </div>
        <div class="safe-tip">Do not send payment based on this site. Checkout is not active.</div>
        <form class="chat-input" data-form="send-message" data-to="${active}" data-product="${productId || ''}"><input name="text" placeholder="Type a message…" autocomplete="off"><button class="btn btn-primary" type="submit">Send</button></form>`}
      </section>
    </div>
  </div>`;
}

/* ───────────── TERMS ───────────── */
function pageTerms() {
  return `
  <div class="container page narrow prose">
    <span class="eyebrow">Legal</span><h1>Terms &amp; Agreement</h1>
    <p class="muted">This is a template for your launch. Have a lawyer review it before going live.</p>
    <h2>1. Current availability</h2>
    <p>Accounts, shops, product listings, images and messages are stored in Supabase. Checkout, order payment, escrow, refunds and seller payouts are not active. Do not submit payment or bank details.</p>
    <h2 id="commission">2. Proposed commission</h2>
    <p>The displayed ${pct(COMMISSION.reduced)}% to ${pct(COMMISSION.standard)}% commission is a draft and is not currently charged. Final terms will be published before launch.</p>
    <h2>3. Payments and disputes</h2>
    <p>There are no live payment, escrow, refund or payout services at this time. Contact support at ${esc(BRAND.supportEmail)} with questions.</p>
    <h2 id="disputes">4. Seller responsibilities</h2>
    <p>Sellers must list only genuine products, describe them accurately, keep stock up to date and ship promptly.</p>
    <h2>5. Buyer responsibilities</h2>
    <p>Buyers must provide a correct delivery address and confirm receipt only when goods are in hand.</p>
    <h2>6. Loyalty rewards</h2>
    <p>Loyalty rewards are not currently active.</p>
  </div>`;
}
