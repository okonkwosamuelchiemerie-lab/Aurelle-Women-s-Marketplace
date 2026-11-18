/* More pages: logged-in home, about, sign-up (with the seller application), shop, dashboards and the admin area. */

const kv = (label, value) => `<div class="kv"><span>${label}</span><strong>${value ? value : '—'}</strong></div>`;
const optionsHTML = (list, current, placeholder) => `<option value="">${placeholder || 'Select…'}</option>` + list.map((o) => `<option ${current === o ? 'selected' : ''}>${esc(o)}</option>`).join('');

/* ───────────── HOME (for logged-in visitors) ───────────── */
function pageHome() {
  const user = me();
  if (!user) return pageLanding();
  if (user.role === 'admin') return redirect('/admin');
  const live = liveProducts().filter((p) => p.stock > 0).sort((a, b) => b.createdAt - a.createdAt);
  const first = esc(user.name.split(' ')[0]);
  let lead = '';
  let tiles = [];
  if (user.role === 'buyer') {
    const orders = db.orders.filter((o) => o.buyerId === user.id);
    const onTheWay = orders.filter((o) => o.status === 'paid' || o.status === 'shipped').length;
    const cartCount = db.cart.reduce((a, c) => a + c.qty, 0);
    lead = 'Find something you love today. Checkout is coming soon.';
    tiles = [
      ['#/cart', 'cart', 'My cart', cartCount + (cartCount === 1 ? ' item' : ' items')],
      ['#/dashboard?tab=orders', 'truck', 'My orders', onTheWay + ' on the way'],
      ['#/messages', 'chat', 'Messages', 'Chat with sellers'],
      ['#/dashboard', 'gift', 'Rewards', 'Coming with checkout'],
    ];
  } else {
    const shop = shopOf(user.id);
    const st = shop ? sellerStats(shop.id) : null;
    lead = !shop ? 'Set up your shop to start selling.' : shop.verified === 'pending' ? 'Your application is under review. You can already add products while we verify you.' : 'Here is how your shop is doing today.';
    tiles = [
      ['#/dashboard?tab=orders', 'truck', 'Orders to ship', (st ? st.orders.filter((o) => o.status === 'paid').length : 0) + ' waiting'],
      ['#/dashboard', 'lock', 'Payouts', 'Not available yet'],
      ['#/dashboard?tab=products', 'plus', 'Add products', (shop ? db.products.filter((p) => p.shopId === shop.id).length : 0) + ' live'],
      ['#/messages', 'chat', 'Messages', 'Reply to buyers'],
    ];
  }
  return `
  <section class="home-hero"><div class="container">
    <span class="eyebrow">Welcome back</span>
    <h1>Hello, ${first}</h1>
    <p class="lead">${lead}</p>
    <div class="quick">${tiles.map(([href, ic, t, s]) => `<a href="${href}" class="quick-tile"><span class="quick-ic">${icon(ic, 22)}</span><span><strong>${t}</strong><small>${s}</small></span></a>`).join('')}</div>
  </div></section>

  <section class="section"><div class="container">
    <div class="section-head"><span class="eyebrow">Browse by category</span><h2>What are you looking for?</h2></div>
    <div class="cat-grid">${CATEGORIES.map((c) => `<a href="#/browse?cat=${c.id}" class="cat-tile"><span class="cat-icon">${icon(c.id, 34, 1.3)}</span><strong>${c.label}</strong><span class="muted small">${c.blurb}</span></a>`).join('')}</div>
  </div></section>

  <section class="section section-tint"><div class="container">
    <div class="section-head row"><div><span class="eyebrow">Just arrived</span><h2>New from our sellers</h2></div><a href="#/browse" class="link-arrow">View all ${icon('arrow', 16)}</a></div>
    <div class="grid-products">${live.slice(0, 8).map(productCard).join('') || '<div class="empty"><h3>No products yet</h3></div>'}</div>
  </div></section>

  <section class="section"><div class="container">
    <div class="section-head"><span class="eyebrow">Meet the sellers</span><h2>Boutiques you'll love</h2></div>
    <div class="shop-grid">${liveShops().slice(0, 4).map(shopCardHTML).join('')}</div>
  </div></section>`;
}

function shopCardHTML(s) {
  const first = liveProducts().find((p) => p.shopId === s.id);
  return `<a href="#/shop/${s.id}" class="shop-card">${s.cover ? `<div class="art shop-card-art"><img src="${esc(s.cover)}" alt=""></div>` : art(first, { cls: 'shop-card-art' })}
    <div class="shop-card-body"><div class="shop-card-name">${shopAvatar(s, 'avatar-sm')}<strong>${esc(s.name)}</strong></div>
    <span class="muted small">${esc(shopLoc(s))} · ${db.products.filter((p) => p.shopId === s.id).length} products</span>
    <p>${esc(s.bio.slice(0, 90))}…</p></div></a>`;
}

/* ───────────── ABOUT ───────────── */
function pageAbout() {
  const faqs = [
    ['Can I pay for an order?', 'Not yet. Checkout is disabled, so no payment or order is processed.'],
    ['When do sellers get paid?', 'Payouts are not enabled. We will publish the payment and payout terms before launch.'],
    ['How much will sellers be charged?', `The displayed ${pct(COMMISSION.reduced)}% to ${pct(COMMISSION.standard)}% commission is a proposal and is not currently charged.`],
    ['What if my order is fake, damaged or never arrives?', 'Orders and payments are not enabled yet. Contact support with questions.'],
    ['How are sellers reviewed?', 'Seller applications are saved in the live backend. Shops and products appear to buyers after approval.'],
    ['Where are you based?', `${BRAND.name} is based in ${BRAND.address}. You can reach us by email, phone or WhatsApp any day.`],
  ];
  return `
  <section class="about-hero"><div class="container">
    <span class="eyebrow eyebrow-light">About us</span>
    <h1>A marketplace for women's fashion &amp; beauty in Nigeria.</h1>
    <p>${esc(BRAND.name)} brings dress and clothing boutiques, makeup artists, jewelers and accessory sellers together in one marketplace. Buyers can browse approved sellers and message them; checkout and payouts are not enabled yet.</p>
    <div class="hero-cta"><a href="#/browse" class="btn btn-gold btn-lg">Start shopping</a><a href="#/signup?role=seller" class="btn btn-outline-light btn-lg">Become a seller</a></div>
  </div></section>

  <section class="section"><div class="container two-block">
    <div><span class="eyebrow">Our story</span><h2>Why ${esc(BRAND.name)} exists</h2>
      <p>Buying from online boutiques should feel exciting, not risky. Too many shoppers have sent money and waited. Too many honest sellers have lost sales because buyers did not trust them yet.</p>
      <p>${esc(BRAND.name)} connects buyers and sellers through approved storefronts, product listings and messaging. Secure payments and seller payouts will be enabled only after a provider is configured.</p></div>
    <div class="about-card"><h3>Our promise</h3><ul class="ticks ticks-dark">
      <li>${icon('check', 18)} Checkout and payouts are coming soon</li>
      <li>${icon('check', 18)} Every seller applies and is reviewed</li>
      <li>${icon('check', 18)} Clear, fair commission for sellers</li>
      <li>${icon('check', 18)} Real people to talk to when something goes wrong</li></ul></div>
  </div></section>

  <section class="section section-tint"><div class="container">
    <div class="section-head center"><span class="eyebrow">What we stand for</span><h2>Our values</h2></div>
    <div class="values">
      ${[['shield', 'Trust', 'We are building secure checkout and seller review.'], ['star', 'Style', 'Dresses, sets, skirts, makeup, skincare, jewelry, bags and shoes, all in one place.'], ['store', 'Community', 'We help small women-led businesses grow with real customers.'], ['check', 'Fairness', 'Clear terms will be published before launch.']]
        .map(([i, t, d]) => `<div class="value"><span class="step-icon">${icon(i, 26)}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}
    </div>
  </div></section>

  <section class="section"><div class="container two-block">
    <div><span class="eyebrow">For everyone</span><h2>How ${esc(BRAND.name)} works</h2>
      <ol class="how-list">
        <li><strong>Shoppers</strong> can browse products and chat with sellers.</li>
        <li><strong>Checkout</strong> is disabled while backend and payment services are prepared.</li>
        <li><strong>Seller payouts</strong> will be enabled only after a provider and final terms are in place.</li>
        <li><strong>Loyalty rewards</strong> will begin after checkout is enabled.</li></ol></div>
    <div class="fee-card"><span class="eyebrow">Transparent pricing</span><div class="fee-big">${pct(COMMISSION.reduced)}–${pct(COMMISSION.standard)}%</div>
      <p>commission on each sold item. Nothing else.</p>
      <div class="fee-rows"><div><span>Starting rate</span><strong>${pct(COMMISSION.standard)}%</strong></div><div><span>After ${money(COMMISSION.reducedAfterSales)} in sales</span><strong>${pct(COMMISSION.reduced)}%</strong></div></div></div>
  </div></section>

  <section class="section section-tint"><div class="container narrow">
    <div class="section-head center"><span class="eyebrow">Questions</span><h2>Frequently asked</h2></div>
    <div class="faq">${faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
  </div></section>

  <section class="section" id="contact"><div class="container two-block">
    <div><span class="eyebrow">Contact us</span><h2>We'd love to hear from you</h2>
      <p class="lead">Questions about an order, selling with us, or working together? Reach us any way you like.</p>
      <div class="contact-list">
        <a href="mailto:${esc(BRAND.supportEmail)}"><span class="quick-ic">${icon('chat', 20)}</span><span><small>Email</small><strong>${esc(BRAND.supportEmail)}</strong></span></a>
        <a href="tel:${esc(BRAND.phone)}"><span class="quick-ic">${icon('truck', 20)}</span><span><small>Phone</small><strong>${esc(BRAND.phoneDisplay)}</strong></span></a>
        <a href="${esc(BRAND.whatsapp)}" target="_blank" rel="noopener"><span class="quick-ic">${icon('chat', 20)}</span><span><small>WhatsApp</small><strong>Chat with us</strong></span></a>
        <div><span class="quick-ic">${icon('store', 20)}</span><span><small>Address</small><strong>${esc(BRAND.address)}</strong></span></div>
      </div></div>
    <form class="card form-card" data-form="contact">
      <h3>Send us a message</h3>
      <label class="field"><span>Your name</span><input name="name" required></label>
      <label class="field"><span>Your phone or email</span><input name="reach" required></label>
      <label class="field"><span>Message</span><textarea name="message" rows="4" required></textarea></label>
      <button class="btn btn-primary btn-lg" type="submit">Send message</button>
      <p class="muted small" style="margin:10px 0 0">This opens your email app with the message ready to send to ${esc(BRAND.supportEmail)}.</p>
    </form>
  </div></section>`;
}

/* ───────────── SIGN-UP (buyer: simple · seller: 4-step business application) ───────────── */
function pageSignup() {
  if (!isAuthReady()) return '<div class="container page narrow"><p>Connecting securely to your account…</p></div>';
  if (me()) return redirect('/dashboard');
  const role = ui.signupRole;
  if (!role) {
    return `
    <div class="auth-wrap"><div class="container auth-choose">
      <span class="eyebrow">Join ${esc(BRAND.name)}</span>
      <h1>How would you like to use ${esc(BRAND.name)}?</h1>
      <p class="lead">Choose one to get started.</p>
      <div class="role-grid">
        <button class="role-card" data-act="pick-role" data-role="buyer"><span class="role-icon">${icon('cart', 30)}</span><h3>I'm a buyer</h3><p>Browse the collection and chat with sellers. Checkout is not active yet.</p><span class="link-arrow">Continue as buyer ${icon('arrow', 16)}</span></button>
        <button class="role-card" data-act="pick-role" data-role="seller"><span class="role-icon">${icon('store', 30)}</span><h3>I'm a seller</h3><p>Submit your seller application for review. Shop and product tools are coming soon.</p><span class="link-arrow">Continue as seller ${icon('arrow', 16)}</span></button>
      </div>
      <p class="muted">Already have an account? <a href="#/login"><u>Log in</u></a></p>
    </div></div>`;
  }
  if (role === 'seller') return sellerApplicationHTML();
  return `
  <div class="auth-wrap"><div class="auth-card">
    <button class="back" data-act="change-role">← Change account type</button>
    <span class="pill pill-gold">Buyer account</span>
    <h1>Create your buyer account</h1>
    <form data-form="signup">
      <label class="field"><span>Full name</span><input name="name" required placeholder="e.g. Chioma Nwosu"></label>
      <label class="field"><span>Email</span><input name="email" type="email" required placeholder="you@email.com"></label>
      <label class="field"><span>Phone number</span><input name="phone" required placeholder="080 0000 0000 or +234…"></label>
      <label class="field"><span>Password</span><span class="password-entry"><input name="password" type="password" required placeholder="At least 6 characters"><button class="password-toggle" type="button" data-act="toggle-password" aria-label="Show password" aria-pressed="false" title="Show password">${icon('eye', 18)}</button></span></label>
      <div class="agree-box"><strong>Buyer agreement</strong><ul>
        <li>Checkout, order payment, and refunds are not active yet.</li>
        <li>Do not submit real payment or bank details.</li>
        <li>Loyalty rewards will begin after checkout is enabled.</li></ul>
        <label class="check"><input type="checkbox" name="agree"><span>I agree to the above and to the <a href="#/terms" target="_blank"><u>full terms</u></a>.</span></label></div>
      <div class="error" id="form-error" hidden></div>
      <button class="btn btn-primary btn-lg btn-block" type="submit">Create account</button>
    </form>
    <p class="muted center small" style="margin-top:14px">Already have an account? <a href="#/login"><u>Log in</u></a></p>
  </div></div>`;
}

const STEP_TITLES = ['Your details', 'Your business', 'Location & delivery', 'Review & submit'];

function sellerApplicationHTML() {
  const step = ui.sellerStep;
  const f = ui.sellerForm;
  const v = (k) => esc(f[k] || '');
  const checks = (name, list) => `<div class="chips">${list.map((o) => {
    const val = o.id || o; const label = o.label || o;
    return `<label class="chip-check"><input type="checkbox" name="${name}" value="${esc(val)}" ${(f[name] || []).includes(val) ? 'checked' : ''}><span>${esc(label)}</span></label>`;
  }).join('')}</div>`;
  let body = '';
  if (step === 1) {
    body = `
      <label class="field"><span>Your full name</span><input name="name" required value="${v('name')}" placeholder="e.g. Chioma Nwosu"></label>
      <label class="field"><span>Email address</span><input name="email" type="email" required value="${v('email')}" placeholder="you@email.com"></label>
      <label class="field"><span>Phone number (WhatsApp preferred)</span><input name="phone" required value="${v('phone')}" placeholder="080 0000 0000 or +234…"></label>
      <label class="field"><span>Password</span><span class="password-entry"><input name="password" type="password" required value="${v('password')}" placeholder="At least 6 characters"><button class="password-toggle" type="button" data-act="toggle-password" aria-label="Show password" aria-pressed="false" title="Show password">${icon('eye', 18)}</button></span></label>`;
  } else if (step === 2) {
    body = `
      <label class="field"><span>Business name (this becomes your shop name)</span><input name="businessName" required value="${v('businessName')}" placeholder="e.g. Zuri Atelier"></label>
      <div class="two-col">
        <label class="field"><span>Type of business</span><select name="businessType" required>${optionsHTML(BUSINESS_TYPES, f.businessType)}</select></label>
        <label class="field"><span>How long have you been selling?</span><select name="yearsInBusiness" required>${optionsHTML(YEARS_OPTIONS, f.yearsInBusiness)}</select></label>
      </div>
      <label class="field"><span>CAC registration number <em class="muted small">(optional, if registered)</em></span><input name="cac" value="${v('cac')}" placeholder="e.g. RC1234567 or BN1234567"></label>
      <div class="field"><span>What do you sell? (pick all that apply)</span>${checks('categories', CATEGORIES)}</div>
      <label class="field"><span>List your main products</span><input name="whatSells" required value="${v('whatSells')}" placeholder="e.g. Ankara dresses, two-piece sets, skirts"></label>
      <label class="field"><span>Tell buyers about your business</span><textarea name="bio" rows="4" required placeholder="Who you are, what makes your products special, and what customers can expect.">${v('bio')}</textarea></label>
      <label class="field"><span>Instagram / TikTok / website <em class="muted small">(optional)</em></span><input name="social" value="${v('social')}" placeholder="e.g. @yourbusiness"></label>`;
  } else if (step === 3) {
    body = `
      <div class="two-col">
        <div class="field"><span>Country</span><input value="Nigeria" disabled></div>
        <label class="field"><span>State</span><select name="state" required>${optionsHTML(NG_STATES, f.state || 'Lagos')}</select></label>
        <label class="field"><span>City / area</span><input name="city" required value="${v('city')}" placeholder="e.g. Ikeja"></label>
        <label class="field"><span>Shop or business address</span><input name="address" required value="${v('address')}" placeholder="Street, area (or 'Online only')"></label>
        <label class="field"><span>Where do your products come from?</span><select name="sourcing" required>${optionsHTML(SOURCING_OPTIONS, f.sourcing)}</select></label>
        <label class="field"><span>How many products will you list?</span><select name="productCount" required>${optionsHTML(PRODUCT_COUNT_OPTIONS, f.productCount)}</select></label>
        <label class="field"><span>Orders you can handle each month</span><select name="monthlyOrders" required>${optionsHTML(MONTHLY_ORDER_OPTIONS, f.monthlyOrders)}</select></label>
        <label class="field"><span>Usual delivery time</span><select name="deliveryTime" required>${optionsHTML(DELIVERY_TIMES, f.deliveryTime)}</select></label>
      </div>
      <div class="field"><span>How do you deliver? (pick all that apply)</span>${checks('delivery', DELIVERY_METHODS)}</div>
      <label class="field"><span>Return policy</span><select name="returnPolicy" required>${optionsHTML(RETURN_POLICIES, f.returnPolicy)}</select></label>`;
  } else {
    body = `
      <div class="note note-gold"><strong>Your shop and seller application will be saved for review.</strong> You can add products and images after submitting; buyers will see them once your shop is approved.</div>
      <div class="note note-gold"><strong>Payout setup is not available yet.</strong> We will provide setup after a payment provider is configured. Do not enter bank details here.</div>
      <div class="agree-box"><strong>Seller agreement</strong><ul>
        <li>The displayed <b>${pct(COMMISSION.reduced)}% to ${pct(COMMISSION.standard)}%</b> commission is a proposal and is not currently charged.</li>
        <li>Final payment, payout, and delivery-confirmation terms will be shown before real transactions are enabled.</li></ul>
        <label class="check"><input type="checkbox" name="agree1" ${f.agree1 ? 'checked' : ''}><span>I understand that commission and payment terms are proposals and will be finalized before launch.</span></label>
        <label class="check"><input type="checkbox" name="agree2" ${f.agree2 ? 'checked' : ''}><span>I confirm all my details are true and I will sell only genuine, accurately described products.</span></label></div>`;
  }
  return `
  <div class="auth-wrap"><div class="auth-card auth-wide">
    <button class="back" data-act="change-role">← Change account type</button>
    <span class="pill pill-gold">Seller application</span>
    <h1>${STEP_TITLES[step - 1]}</h1>
    <ol class="stepper">${STEP_TITLES.map((t, i) => `<li class="${i + 1 === step ? 'on' : i + 1 < step ? 'done' : ''}"><span>${i + 1 < step ? '✓' : i + 1}</span><em>${t}</em></li>`).join('')}</ol>
    <form data-form="seller-step" novalidate>
      ${body}
      <div class="error" id="form-error" hidden></div>
      <div class="step-btns">
        ${step > 1 ? '<button type="button" class="btn btn-outline btn-lg" data-act="seller-back">Back</button>' : ''}
        <button class="btn btn-primary btn-lg grow" type="submit">${step === 4 ? 'Submit application' : 'Continue'}</button>
      </div>
    </form>
    <p class="muted center small" style="margin-top:14px">Already have an account? <a href="#/login"><u>Log in</u></a></p>
  </div></div>`;
}

/* ───────────── SHOP PAGE ───────────── */
function pageShop(id) {
  const shop = shopById(id);
  if (!shop || !shopIsLive(shop)) return notFound('Shop not found');
  const user = me();
  const items = db.products.filter((p) => p.shopId === id).sort((a, b) => b.createdAt - a.createdAt);
  const own = user && user.id === shop.ownerId;
  return `
  <section class="shop-banner" ${shop.cover ? `style="background-image:linear-gradient(rgba(58,38,24,.35),rgba(58,38,24,.55)),url('${esc(shop.cover)}')"` : ''}></section>
  <section class="shop-hero"><div class="container shop-hero-in">
    ${shopAvatar(shop, 'avatar-lg shop-logo')}
    <div>
      <h1>${esc(shop.name)}</h1>
      <div class="shop-meta"><span>${esc(shopLoc(shop))}</span><span>${(shop.categories || []).map(catLabel).join(' · ')}</span>${verifyBadge(shop)}</div>
      <p>${esc(shop.bio)}</p>
      ${shop.whatSells ? `<p class="muted"><strong>Sells:</strong> ${esc(shop.whatSells)}</p>` : ''}
      <div class="shop-facts">
        ${shop.yearsInBusiness ? `<span>${icon('star', 14)} ${esc(shop.yearsInBusiness)} selling</span>` : ''}
        ${shop.deliveryTime ? `<span>${icon('truck', 14)} Delivery: ${esc(shop.deliveryTime)}</span>` : ''}
        ${shop.returnPolicy ? `<span>${icon('check', 14)} ${esc(shop.returnPolicy)}</span>` : ''}
        ${shop.social ? `<span>${icon('chat', 14)} ${esc(shop.social)}</span>` : ''}
      </div>
    </div>
    ${!own && (!user || user.role === 'buyer') ? `<button class="btn btn-primary" data-act="chat-seller" data-to="${shop.ownerId}">${icon('chat', 18)} Chat with seller</button>` : ''}
  </div></section>
  <div class="container page"><h2>Products (${items.length})</h2>
    ${items.length ? `<div class="grid-products">${items.map(productCard).join('')}</div>` : '<div class="empty"><h3>No products yet</h3><p>This seller is still setting up.</p></div>'}
  </div>`;
}

/* ───────────── DASHBOARD ROUTER ───────────── */
function pageDashboard() {
  if (!isAuthReady()) return '<div class="container page narrow"><p>Connecting securely to your account…</p></div>';
  const user = me();
  if (!user) return redirect('/login?next=' + encodeURIComponent('/dashboard'));
  if (user.role === 'admin') return redirect('/admin');
  return user.role === 'seller' ? sellerDashboard(user) : buyerDashboard(user);
}

/* ───────────── SELLER DASHBOARD ───────────── */
function sellerDashboard(user) {
  const shop = shopOf(user.id);
  if (!shop) {
    if (user.source === 'supabase') {
      return `
      <div class="container page narrow">
        <span class="eyebrow">Seller application</span><h1>Your application is under review</h1>
        <p class="lead">We received your seller details. Set up your shop to list products and images while your application is reviewed.</p>
        <button class="btn btn-primary" data-act="create-shop-from-application">Set up my shop</button>
      </div>`;
    }
    return `
    <div class="container page narrow">
      <span class="eyebrow">Step 1 of 2</span><h1>Create your shop</h1>
      <p class="lead">This is your storefront on ${esc(BRAND.name)}. Buyers will see your shop name, bio and everything you sell.</p>
      <form class="card form-card" data-form="create-shop">
        <label class="field"><span>Shop name</span><input name="name" required placeholder="e.g. Zuri Atelier"></label>
        <label class="field"><span>City</span><input name="city" required placeholder="e.g. Lagos"></label>
        <label class="field"><span>Shop bio</span><textarea name="bio" rows="4" required placeholder="Tell buyers who you are and what makes your products special."></textarea></label>
        <label class="field"><span>What do you sell?</span><input name="whatSells" required placeholder="e.g. Dresses, two-piece sets, skirts"></label>
        <div class="field"><span>Categories (pick at least one)</span>
          <div class="chips">${CATEGORIES.map((c) => `<label class="chip-check"><input type="checkbox" name="cat" value="${c.id}"><span>${c.label}</span></label>`).join('')}</div></div>
        <div class="error" id="form-error" hidden></div>
        <button class="btn btn-primary btn-lg" type="submit">Create my shop</button>
      </form>
    </div>`;
  }
  const tab = ui.sellerTab;
  const stats = sellerStats(shop.id);
  const rate = sellerRate(shop.id);
  const products = db.products.filter((p) => p.shopId === shop.id).sort((a, b) => b.createdAt - a.createdAt);
  const toShip = stats.orders.filter((o) => o.status === 'paid').length;
  const toNext = Math.max(0, COMMISSION.reducedAfterSales - stats.grossDone);
  const tabs = [['overview', 'Overview'], ['products', `Products (${products.length})`], ['orders', `Orders (${stats.orders.length})`], ['shop', 'Shop profile']];
  const banner = shop.verified === 'verified' ? `<div class="note note-green">${icon('shield', 18)}<span><strong>You're a Verified seller.</strong> Your badge shows on your shop and products.</span></div>`
    : shop.verified === 'rejected' ? `<div class="note note-red">${icon('shield', 18)}<span><strong>Your application was not approved.</strong> Your shop is hidden from buyers. Contact ${esc(BRAND.supportEmail)} or ${esc(BRAND.phoneDisplay)}.</span></div>`
    : `<div class="note note-gold">${icon('shield', 18)}<span><strong>Your application is under review.</strong> You can already upload products. The Verified badge appears once we approve you.</span></div>`;

  let body = '';
  if (tab === 'overview') {
    body = `
    ${banner}
    <div class="stat-grid">
      <div class="stat"><span>Products listed</span><strong>${products.length}</strong></div>
      <div class="stat"><span>Orders to ship</span><strong>${toShip}</strong></div>
      <div class="stat"><span>Payout balance</span><strong>Not available</strong></div>
      <div class="stat"><span>Paid out</span><strong>Not available</strong></div>
    </div>
    <div class="card fee-note">
      <h3>Your commission: ${pct(rate)}%</h3>
      <p class="muted">${rate === COMMISSION.reduced ? `You've reached the lower ${pct(COMMISSION.reduced)}% rate. Thank you for selling with us!` : `Sell ${money(toNext)} more in completed orders to drop to ${pct(COMMISSION.reduced)}%.`}</p>
      <div class="progress"><span style="width:${Math.min(100, (stats.grossDone / COMMISSION.reducedAfterSales) * 100)}%"></span></div>
    </div>
    ${products.length === 0 ? `<div class="empty" style="margin-top:20px"><h3>Add your first product</h3><p>Your shop is ready. Upload what you sell so buyers can find you.</p><button class="btn btn-primary" data-act="tab" data-scope="seller" data-tab="products">Add products</button></div>` : ''}`;
  } else if (tab === 'products') {
    body = `
    <div class="dash-two">
      <form class="card form-card" data-form="add-product">
        <h3>Upload a new product</h3>
        <div class="two-col">
          <label class="field"><span>Product name</span><input name="name" required placeholder="e.g. Ankara Wrap Dress"></label>
          <label class="field"><span>Category</span><select name="category">${CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === (shop.categories || [])[0] ? 'selected' : ''}>${c.label}</option>`).join('')}</select></label>
          <label class="field"><span>Price (₦)</span><input name="price" type="number" min="1" required placeholder="15000"></label>
          <label class="field"><span>Quantity in stock</span><input name="stock" type="number" min="1" required placeholder="10"></label>
        </div>
        <label class="field"><span>Description</span><textarea name="description" rows="3" required placeholder="Sizes, colours, material, delivery time…"></textarea></label>
        <div class="field"><span>Photos (up to 5)</span><div class="uploader" id="uploader">${uploaderHTML()}</div></div>
        <button class="btn btn-primary btn-lg" type="submit">${icon('plus', 18)} Publish product</button>
      </form>
      <div>
        <h3>Your products</h3>
        ${products.length === 0 ? '<p class="muted">Nothing uploaded yet.</p>' : ''}
        <div class="plist">
          ${products.map((p) => `
          <div class="prow">${art(p, { cls: 'thumb' })}
            <div class="prow-info"><strong>${esc(p.name)}</strong><span class="muted small">${esc(catLabel(p.category))}</span>
              <div class="prow-edit">
                <label>₦<input type="number" min="1" value="${p.price}" data-edit="price" data-id="${p.id}"></label>
                <label>Stock<input type="number" min="0" value="${p.stock}" data-edit="stock" data-id="${p.id}"></label>
              </div>
              <label class="photo-change">${icon('upload', 14)} Change photos<input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden data-photos="${p.id}"></label></div>
            <button class="icon-btn danger" aria-label="Delete product" data-act="delete-product" data-id="${p.id}">${icon('trash', 18)}</button>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
  } else if (tab === 'orders') {
    body = `<div class="olist">${stats.orders.length === 0 ? '<div class="empty"><h3>No orders yet</h3><p>Order processing is not enabled yet.</p></div>' : stats.orders.map((o) => orderCard(o, 'seller')).join('')}</div>`;
  } else {
    body = `
    <div class="brand-up brand-edit">
      <div><span class="lbl">Business logo</span><label class="up-box up-logo">${shop.logo ? `<img src="${esc(shop.logo)}" alt="">` : `<span>${icon('upload', 22)}<small>Add your logo</small></span>`}<input type="file" id="shop-logo" accept="image/*" hidden></label></div>
      <div><span class="lbl">Cover photo</span><label class="up-box up-cover">${shop.cover ? `<img src="${esc(shop.cover)}" alt="">` : `<span>${icon('upload', 22)}<small>Add a cover photo</small></span>`}<input type="file" id="shop-cover" accept="image/*" hidden></label></div>
    </div>
    <form class="card form-card narrow-card" data-form="update-shop">
      <label class="field"><span>Business / shop name</span><input name="name" required value="${esc(shop.name)}"></label>
      <div class="two-col">
        <label class="field"><span>State</span><select name="state">${optionsHTML(NG_STATES, shop.state || 'Lagos')}</select></label>
        <label class="field"><span>City / area</span><input name="city" required value="${esc(shop.city)}"></label>
      </div>
      <label class="field"><span>Bio</span><textarea name="bio" rows="4" required>${esc(shop.bio)}</textarea></label>
      <label class="field"><span>What you sell</span><input name="whatSells" value="${esc(shop.whatSells)}"></label>
      <label class="field"><span>Instagram / TikTok / website</span><input name="social" value="${esc(shop.social || '')}"></label>
      <button class="btn btn-primary" type="submit">Save changes</button>
    </form>`;
  }
  return `
  <div class="container page">
    <div class="dash-head"><div><span class="eyebrow">Seller dashboard</span><h1>${esc(shop.name)}</h1></div><a href="#/shop/${shop.id}" class="btn btn-outline btn-sm">View my shop</a></div>
    <div class="tabs">${tabs.map(([id, l]) => `<button class="${tab === id ? 'on' : ''}" data-act="tab" data-scope="seller" data-tab="${id}">${l}</button>`).join('')}</div>
    ${body}
  </div>`;
}

/* ───────────── ADMIN ───────────── */
function adminUserRows() {
  const q = (ui.au.q || '').toLowerCase();
  const rows = db.users
    .filter((u) => u.role !== 'admin')
    .filter((u) => ui.au.role === 'all' || u.role === ui.au.role)
    .filter((u) => { const sh = shopOf(u.id); return !q || [u.name, u.email, u.phone, sh && sh.name].join(' ').toLowerCase().includes(q); })
    .sort((a, b) => b.createdAt - a.createdAt);
  if (!rows.length) return '<tr><td colspan="7" class="muted center">No users found.</td></tr>';
  return rows.map((u) => {
    const sh = shopOf(u.id);
    const susp = u.status === 'suspended';
    return `<tr>
      <td><strong>${esc(u.name)}</strong></td>
      <td><span class="badge ${u.role === 'seller' ? 'badge-blue' : 'badge-gold'}">${u.role === 'seller' ? 'Seller' : 'Buyer'}</span></td>
      <td><a href="mailto:${esc(u.email)}"><u>${esc(u.email)}</u></a></td>
      <td><a href="tel:${esc(u.phone)}">${esc(u.phone)}</a></td>
      <td>${sh ? esc(sh.name) : '<span class="muted">—</span>'}</td>
      <td>${fmtDate(u.createdAt)}</td>
      <td><span class="badge ${susp ? 'badge-red' : 'badge-green'}">${susp ? 'Suspended' : 'Active'}</span>
        <button class="link-btn" data-act="admin-status" data-id="${u.id}" data-status="${susp ? 'active' : 'suspended'}">${susp ? 'Reactivate' : 'Suspend'}</button></td>
    </tr>`;
  }).join('');
}

function adminSellerCard(sh) {
  const owner = db.users.find((u) => u.id === sh.ownerId) || {};
  const n = db.products.filter((p) => p.shopId === sh.id).length;
  return `
  <div class="card seller-app">
    <div class="sa-head">${shopAvatar(sh, 'avatar-md')}
      <div class="sa-title"><h3>${esc(sh.name)}</h3><span class="muted small">Applied ${fmtDate(sh.createdAt || owner.createdAt || Date.now())}</span></div>
      ${verifyBadge(sh)}</div>
    <div class="kv-grid">
      ${kv('Owner', esc(owner.name))}
      ${kv('Email', owner.email ? `<a href="mailto:${esc(owner.email)}"><u>${esc(owner.email)}</u></a>` : '')}
      ${kv('Phone', owner.phone ? `<a href="tel:${esc(owner.phone)}">${esc(owner.phone)}</a>` : '')}
      ${kv('Business type', esc(sh.businessType))}
      ${kv('CAC number', esc(sh.cac))}
      ${kv('Time selling', esc(sh.yearsInBusiness))}
      ${kv('Location', esc(shopLoc(sh)))}
      ${kv('Address', esc(sh.address))}
      ${kv('Categories', (sh.categories || []).map(catLabel).join(', '))}
      ${kv('Sells', esc(sh.whatSells))}
      ${kv('Source of products', esc(sh.sourcing))}
      ${kv('Products planned', esc(sh.productCount))}
      ${kv('Orders per month', esc(sh.monthlyOrders))}
      ${kv('Delivery', esc((sh.delivery || []).join(', ')))}
      ${kv('Delivery time', esc(sh.deliveryTime))}
      ${kv('Returns', esc(sh.returnPolicy))}
      ${kv('Social / website', esc(sh.social))}
      ${kv('Products live', n)}
    </div>
    <div class="sa-actions">
      ${sh.verified !== 'verified' ? `<button class="btn btn-primary btn-sm" data-act="admin-verify" data-id="${sh.id}" data-v="verified">${icon('check', 16)} Approve seller</button>` : ''}
      ${sh.verified !== 'rejected' ? `<button class="btn btn-outline btn-sm" data-act="admin-verify" data-id="${sh.id}" data-v="rejected">${sh.verified === 'verified' ? 'Revoke approval' : 'Reject'}</button>` : ''}
      ${sh.verified === 'rejected' ? `<button class="btn btn-outline btn-sm" data-act="admin-verify" data-id="${sh.id}" data-v="pending">Move back to review</button>` : ''}
      ${owner.email ? `<a class="btn btn-ghost btn-sm" href="mailto:${esc(owner.email)}">Email seller</a>` : ''}
      <a class="btn btn-ghost btn-sm" href="#/shop/${sh.id}">View shop</a>
    </div>
  </div>`;
}

function pageAdmin() {
  const user = me();
  if (!user || user.role !== 'admin') return redirect('/login?next=' + encodeURIComponent('/admin'));
  const tab = ui.adminTab;
  const people = db.users.filter((u) => u.role !== 'admin');
  const buyers = people.filter((u) => u.role === 'buyer');
  const sellers = people.filter((u) => u.role === 'seller');
  const pending = db.shops.filter((sh) => sh.verified === 'pending');
  const valid = db.orders.filter((o) => o.status !== 'refunded');
  const sales = valid.reduce((a, o) => a + o.subtotal, 0);
  const earned = db.orders.filter((o) => o.status === 'completed').reduce((a, o) => a + o.commission, 0);
  const tabs = [['overview', 'Overview'], ['users', `Users (${people.length})`], ['sellers', `Sellers${pending.length ? ` · ${pending.length} to review` : ` (${db.shops.length})`}`], ['orders', `Orders (${db.orders.length})`], ['settings', 'Settings']];

  let body = '';
  if (tab === 'overview') {
    const recent = people.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
    body = `
    <div class="stat-grid">
      <div class="stat"><span>Total users</span><strong>${people.length}</strong></div>
      <div class="stat"><span>Buyers</span><strong>${buyers.length}</strong></div>
      <div class="stat"><span>Sellers</span><strong>${sellers.length}</strong></div>
      <div class="stat"><span>Sellers awaiting review</span><strong>${pending.length}</strong></div>
      <div class="stat"><span>Products listed</span><strong>${db.products.length}</strong></div>
      <div class="stat"><span>Orders</span><strong>${db.orders.length}</strong></div>
      <div class="stat"><span>Sales volume</span><strong>${money(sales)}</strong></div>
      <div class="stat"><span>Payout balance</span><strong>Not available</strong></div>
    </div>
    <div class="card"><h3>Commission earned</h3><div class="fee-big" style="font-size:2.6rem;text-align:left">${money(earned)}</div><p class="muted small" style="margin:0">From completed orders (the ${pct(COMMISSION.reduced)}–${pct(COMMISSION.standard)}% fee that is yours to keep).</p></div>
    <h3 style="margin-top:28px">Newest users</h3>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th>Joined</th></tr></thead><tbody>
      ${recent.length ? recent.map((u) => `<tr><td>${esc(u.name)}</td><td>${u.role === 'seller' ? 'Seller' : 'Buyer'}</td><td><a href="mailto:${esc(u.email)}"><u>${esc(u.email)}</u></a></td><td>${esc(u.phone)}</td><td>${fmtDate(u.createdAt)}</td></tr>`).join('') : '<tr><td colspan="5" class="muted center">No users yet.</td></tr>'}
    </tbody></table></div>`;
  } else if (tab === 'users') {
    body = `
    <div class="admin-bar">
      <label class="search">${icon('search', 18)}<input id="au-q" placeholder="Search name, email, phone or business" value="${esc(ui.au.q)}"></label>
      <select id="au-role"><option value="all" ${ui.au.role === 'all' ? 'selected' : ''}>All users</option><option value="buyer" ${ui.au.role === 'buyer' ? 'selected' : ''}>Buyers</option><option value="seller" ${ui.au.role === 'seller' ? 'selected' : ''}>Sellers</option></select>
      <button class="btn btn-outline btn-sm" data-act="export-users">${icon('upload', 16)} Download list (CSV)</button>
    </div>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th>Business</th><th>Joined</th><th>Status</th></tr></thead><tbody id="au-body">${adminUserRows()}</tbody></table></div>`;
  } else if (tab === 'sellers') {
    const order = { pending: 0, verified: 1, rejected: 2 };
    const list = db.shops.slice().sort((a, b) => (order[a.verified || 'verified'] - order[b.verified || 'verified']) || ((b.createdAt || 0) - (a.createdAt || 0)));
    body = list.length ? `<div class="sa-list">${list.map(adminSellerCard).join('')}</div>` : '<div class="empty"><h3>No sellers yet</h3><p>Seller applications will appear here for you to review.</p></div>';
  } else if (tab === 'orders') {
    body = db.orders.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Order</th><th>Date</th><th>Buyer</th><th>Seller</th><th>Total</th><th>Our fee</th><th>Status</th></tr></thead><tbody>
      ${db.orders.map((o) => {
        const buyer = db.users.find((u) => u.id === o.buyerId);
        const sh = shopById(o.shopId);
        return `<tr><td>#${esc(o.id.slice(0, 8).toUpperCase())}</td><td>${fmtDate(o.createdAt)}</td><td>${esc(buyer ? buyer.name : '—')}</td><td>${esc(sh ? sh.name : '—')}</td><td>${money(o.subtotal)}</td><td>${money(o.commission)}</td><td>${statusBadge(o.status)}</td></tr>`;
      }).join('')}</tbody></table></div>` : '<div class="empty"><h3>No orders yet</h3></div>';
  } else {
    body = `
    <div class="settings-grid">
      <div class="card form-card">
        <h3>Admin access</h3>
        <p class="muted">Admin roles are managed in Supabase. Never use a browser-stored password or grant admin access from the storefront.</p>
      </div>
      <div class="card form-card">
        <h3>Your business details</h3>
        <div class="kv-grid one">${kv('Admin email', esc(user.email))}${kv('Phone', esc(BRAND.phoneDisplay))}${kv('Address', esc(BRAND.address))}</div>
        <p class="muted small">Change these in <code>js/config.js</code>.</p>
      </div>
    </div>`;
  }
  return `
  <div class="container page">
    <div class="dash-head"><div><span class="eyebrow">Admin</span><h1>Control panel</h1></div><span class="muted small">Signed in as ${esc(user.email)}</span></div>
    <div class="tabs">${tabs.map(([id, l]) => `<button class="${tab === id ? 'on' : ''}" data-act="admin-tab" data-tab="${id}">${l}</button>`).join('')}</div>
    ${body}
  </div>`;
}
