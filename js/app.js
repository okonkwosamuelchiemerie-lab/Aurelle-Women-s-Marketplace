/* Router, page state and all click / form handling. */

const ui = {
  navOpen: false, userMenu: false,
  signupRole: null,
  sellerTab: 'overview', buyerTab: 'overview',
  qty: 1, img: 0,
  newImages: [],
  q: '',
  paymentVerified: null,
  sellerStep: 1, sellerForm: {},
  adminTab: 'overview', au: { q: '', role: 'all' },
};
let route = { parts: [], q: new URLSearchParams() };

const $ = (sel) => document.querySelector(sel);
function parseRoute() {
  const h = location.hash.slice(1) || '/';
  const [path, qs] = h.split('?');
  return { parts: path.split('/').filter(Boolean), q: new URLSearchParams(qs || '') };
}
const go = (path) => { location.hash = '#' + path; };
// Pages call redirect() to send the visitor elsewhere; it renders nothing meanwhile.
// It only fires if the visitor is still on that page (so it never overrides a newer navigation).
function redirect(path) {
  // Never send someone to the login page while we are still checking whether they are signed in.
  if (String(path).startsWith('/login') && !isAuthReady()) {
    return '<div class="container page narrow"><p>Connecting securely to your account…</p></div>';
  }
  const from = location.hash;
  setTimeout(() => { if (location.hash === from) go(path); }, 0);
  return '';
}

function viewHTML() {
  const [a, b] = route.parts;
  switch (a) {
    case undefined: return me() ? pageHome() : pageLanding();
    case 'browse': return pageBrowse();
    case 'product': return pageProduct(b);
    case 'shop': return pageShop(b);
    case 'signup': return pageSignup();
    case 'login': return pageLogin();
    case 'dashboard': return pageDashboard();
    case 'cart': return pageCart();
    case 'checkout': return pageCheckout();
    case 'payment-result': return pagePaymentResult();
    case 'messages': return pageMessages();
    case 'terms': return pageTerms();
    case 'about': return pageAbout();
    case 'admin': return pageAdmin();
    default: return notFound();
  }
}

function renderHeader() { $('#header').innerHTML = headerHTML(ui, route); }

function render() {
  route = parseRoute();
  renderHeader();
  $('#view').innerHTML = viewHTML();
  $('#footer').innerHTML = footerHTML();
  const cb = $('#chat-body');
  if (cb) cb.scrollTop = cb.scrollHeight;
  document.title = BRAND.name + ' — Women\'s Marketplace';
}

function onNavigate() {
  route = parseRoute();
  Object.assign(ui, { navOpen: false, userMenu: false, qty: 1, img: 0, newImages: [], q: '', paymentVerified: null });
  const [a] = route.parts;
  if (a === 'signup') {
    ui.signupRole = ['buyer', 'seller'].includes(route.q.get('role')) ? route.q.get('role') : null;
    ui.sellerStep = 1; ui.sellerForm = {};
  }
  const tabParam = route.q.get('tab');
  if (a === 'dashboard' && tabParam) {
    if (['overview', 'orders', 'profile'].includes(tabParam)) ui.buyerTab = tabParam;
    if (['overview', 'products', 'orders', 'shop'].includes(tabParam)) ui.sellerTab = tabParam;
  }
  render();
  const sec = route.q.get('s');
  if (sec && $('#' + sec)) $('#' + sec).scrollIntoView(); else window.scrollTo(0, 0);
}

window.addEventListener('hashchange', onNavigate);
onChange(render);

/* ───────────── clicks ───────────── */
const handlers = {
  'toggle-nav': () => { ui.navOpen = !ui.navOpen; renderHeader(); },
  'toggle-user': () => { ui.userMenu = !ui.userMenu; renderHeader(); },
  'logout': () => {
    actions.logout().then((r) => {
      if (!r.ok) return notify(r.error, 'error');
      ui.userMenu = false; go('/');
    }).catch((error) => notify('Could not log out: ' + error.message, 'error'));
  },

  'pick-role': (el) => { ui.signupRole = el.dataset.role; render(); },
  'change-role': () => { ui.signupRole = null; render(); },
  'create-shop-from-application': async () => {
    try {
      const result = await actions.createShopFromApplication(me().id);
      if (!result.ok) return notify(result.error, 'error');
      ui.sellerTab = 'products';
      render();
      notify('Your shop is ready. Add products while your application is reviewed.');
    } catch (error) { notify('Could not set up your shop: ' + error.message, 'error'); }
  },

  'add-cart': (el) => {
    const u = me();
    if (u && u.role === 'seller') return notify('Log in with a buyer account to shop.', 'error');
    actions.addToCart(el.dataset.id, 1);
    notify(productById(el.dataset.id).name + ' added to your cart');
  },
  'pick-img': (el) => { ui.img = Number(el.dataset.i); render(); },
  'pdp-qty': (el) => { ui.qty = Math.max(1, ui.qty + Number(el.dataset.d)); render(); },
  'pdp-add': (el) => { const p = productById(el.dataset.id); actions.addToCart(p.id, Math.min(ui.qty, p.stock)); notify(p.name + ' added to your cart'); },
  'pdp-buy': (el) => { const p = productById(el.dataset.id); actions.addToCart(p.id, Math.min(ui.qty, p.stock)); go('/checkout'); },
  'chat-seller': (el) => {
    let target = '/messages?to=' + el.dataset.to + (el.dataset.product ? '&product=' + el.dataset.product : '');
    if (!me()) target = '/login?next=' + encodeURIComponent(target);
    go(target);
  },
  'cart-qty': (el) => actions.setCartQty(el.dataset.id, Number(el.dataset.q)),
  'cart-remove': (el) => actions.removeFromCart(el.dataset.id),
  'toggle-password': (el) => {
    const input = el.closest('.password-entry')?.querySelector('input');
    if (!input) return;
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    const label = visible ? 'Hide password' : 'Show password';
    el.innerHTML = icon(visible ? 'eye-off' : 'eye', 18);
    el.setAttribute('aria-label', label);
    el.setAttribute('aria-pressed', String(visible));
    el.title = label;
  },

  'tab': (el) => { ui[el.dataset.scope + 'Tab'] = el.dataset.tab; render(); },
  'delete-product': async (el) => {
    const p = productById(el.dataset.id);
    if (!p || !confirm('Delete "' + p.name + '"?')) return;
    try {
      const result = await actions.deleteProduct(p.id);
      if (!result.ok) return notify(result.error, 'error');
      notify('Product deleted');
    } catch (error) { notify('Could not delete the product: ' + error.message, 'error'); }
  },
  'rm-image': (el) => { ui.newImages.splice(Number(el.dataset.i), 1); refreshUploader(); },
  'open-chat': (el) => go('/messages?to=' + el.dataset.id),
  'refresh-browse': async (el) => {
    el.disabled = true;
    try {
      const result = await refreshMarketplaceData();
      if (!result.ok) return notify(result.error, 'error');
      notify('Products refreshed');
    } catch (error) { notify('Could not refresh products: ' + error.message, 'error'); }
    finally { el.disabled = false; }
  },
  'verify-payment': async (el) => {
    const reference = route.q.get('reference');
    if (!reference) return notify('Payment reference is missing.', 'error');
    el.disabled = true;
    try {
      const result = await actions.verifyPaystackPayment(reference);
      if (!result.ok) return notify(result.error || 'Payment is not confirmed yet.', 'error');
      actions.clearCart();
      ui.paymentVerified = result.order_id;
      render();
    } catch (error) { notify('Could not verify the payment: ' + error.message, 'error'); }
    finally { if (el.isConnected) el.disabled = false; }
  },

  'seller-back': () => { collectSeller($('[data-form=seller-step]')); ui.sellerStep = Math.max(1, ui.sellerStep - 1); render(); window.scrollTo(0, 0); },

  'admin-tab': (el) => { ui.adminTab = el.dataset.tab; render(); },
  'admin-status': async (el) => {
    try {
      const result = await actions.setUserStatus(el.dataset.id, el.dataset.status);
      if (!result.ok) return notify(result.error, 'error');
      notify(el.dataset.status === 'suspended' ? 'User suspended' : 'User reactivated');
    } catch (error) { notify('Could not update the account: ' + error.message, 'error'); }
  },
  'admin-verify': async (el) => {
    try {
      const result = await actions.setShopVerified(el.dataset.id, el.dataset.v);
      if (!result.ok) return notify(result.error, 'error');
      notify(el.dataset.v === 'verified' ? 'Seller approved' : el.dataset.v === 'rejected' ? 'Seller not approved' : 'Moved back to review');
    } catch (error) { notify('Could not update the seller review: ' + error.message, 'error'); }
  },
  'export-users': () => exportUsers(),
};

/* ───────────── seller application helpers ───────────── */
function collectSeller(form) {
  if (!form) return;
  const fd = new FormData(form);
  for (const k of new Set(fd.keys())) ui.sellerForm[k] = (k === 'categories' || k === 'delivery') ? fd.getAll(k) : fd.get(k);
  ['categories', 'delivery'].forEach((k) => { if (form.querySelector('[name=' + k + ']')) ui.sellerForm[k] = fd.getAll(k); });
  ['agree1', 'agree2'].forEach((k) => { if (form.querySelector('[name=' + k + ']')) ui.sellerForm[k] = !!fd.get(k); });
}

function validateSeller(step, f) {
  const need = (list) => { for (const [k, label] of list) if (!f[k] || !String(f[k]).trim()) return 'Please fill in: ' + label + '.'; return ''; };
  if (step === 1) {
    return need([['name', 'your full name'], ['email', 'your email']])
      || (!/^\S+@\S+\.\S+$/.test(f.email) ? 'Please enter a valid email address.' : '')
      || (!isNgPhone(f.phone) ? 'Please enter a valid Nigerian phone number, e.g. 0816 301 3017 or +234 816 301 3017.' : '')
      || ((f.password || '').length < 6 ? 'Password must be at least 6 characters.' : '');
  }
  if (step === 2) {
    return need([['businessName', 'your business name'], ['businessType', 'type of business'], ['yearsInBusiness', 'how long you have been selling'], ['whatSells', 'your main products'], ['bio', 'a short business description']])
      || (!(f.categories || []).length ? 'Pick at least one category you sell in.' : '')
      || (f.bio.trim().length < 20 ? 'Please describe your business in at least a sentence (20+ characters).' : '');
  }
  if (step === 3) {
    return need([['state', 'your state'], ['city', 'your city / area'], ['address', 'your business address'], ['sourcing', 'where your products come from'], ['productCount', 'how many products you will list'], ['monthlyOrders', 'orders you can handle each month'], ['deliveryTime', 'usual delivery time'], ['returnPolicy', 'your return policy']])
      || (!(f.delivery || []).length ? 'Pick at least one delivery method.' : '');
  }
  return (!f.agree1 || !f.agree2) ? 'Please tick both agreement boxes to submit your application.' : '';
}

function exportUsers() {
  const safe = (c) => { const s = String(c == null ? '' : c); return /^[=+\-@]/.test(s) ? "'" + s : s; };
  const rows = [['Name', 'Role', 'Email', 'Phone', 'Business', 'Status', 'Joined']];
  db.users.filter((u) => u.role !== 'admin').forEach((u) => {
    const sh = shopOf(u.id);
    rows.push([safe(u.name), u.role, safe(u.email), u.phone, safe(sh ? sh.name : ''), u.status || 'active', fmtDate(u.createdAt)]);
  });
  const csv = rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' }));
  link.download = 'aurelle-users.csv';
  link.click();
}

document.addEventListener('click', (e) => {
  if (ui.userMenu && !e.target.closest('.user-menu')) { ui.userMenu = false; renderHeader(); }
  const el = e.target.closest('[data-act]');
  if (el && handlers[el.dataset.act]) handlers[el.dataset.act](el, e);
});

/* ───────────── live inputs (no full re-render so typing is never interrupted) ───────────── */
function refreshUploader() { const u = $('#uploader'); if (u) u.innerHTML = uploaderHTML(); }
document.addEventListener('input', (e) => {
  if (e.target.id === 'q') { ui.q = e.target.value; $('#grid').innerHTML = browseGridHTML(); }
  else if (e.target.id === 'au-q') { ui.au.q = e.target.value; $('#au-body').innerHTML = adminUserRows(); }
});
document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.id === 'au-role') { ui.au.role = t.value; $('#au-body').innerHTML = adminUserRows(); }
  else if (t.id === 'shop-logo' || t.id === 'shop-cover') {
    const kind = t.id === 'shop-logo' ? 'logo' : 'cover';
    if (!t.files[0]) return;
    const shop = shopOf(me().id);
    if (!shop) return notify('Set up your shop before adding images.', 'error');
    try {
      const upload = await actions.uploadImage(shop.id, t.files[0]);
      if (!upload.ok) return notify(upload.error, 'error');
      const result = await actions.updateShop(shop.id, { [kind]: upload.url });
      if (!result.ok) return notify(result.error, 'error');
      notify('Image saved');
    } catch (error) { notify('Could not upload that image: ' + error.message, 'error'); }
  } else if (t.dataset.edit) {
    const v = Number(t.value);
    const changes = t.dataset.edit === 'price' && v > 0 ? { price: v } : t.dataset.edit === 'stock' && v >= 0 ? { stock: v } : null;
    if (changes) {
      try {
        const result = await actions.updateProduct(t.dataset.id, changes);
        if (!result.ok) return notify(result.error, 'error');
        notify(t.dataset.edit === 'price' ? 'Price updated' : 'Stock updated');
      } catch (error) { notify('Could not update the product: ' + error.message, 'error'); }
    }
  } else if (t.dataset.photos) {
    const product = productById(t.dataset.photos);
    const myShop = me() && shopOf(me().id);
    const files = [...t.files].slice(0, 5);
    if (!files.length || !product || !myShop || product.shopId !== myShop.id) return;
    try {
      const urls = [];
      for (const f of files) {
        const up = await actions.uploadImage(myShop.id, f);
        if (!up.ok) { notify(up.error, 'error'); return; }
        urls.push(up.url);
      }
      const result = await actions.updateProduct(product.id, { images: urls });
      if (!result.ok) return notify(result.error, 'error');
      notify('Photos updated');
    } catch (error) { notify('Could not update the photos: ' + error.message, 'error'); }
  } else if (t.id === 'photos') {
    const files = [...t.files].slice(0, 5 - ui.newImages.length);
    const shop = shopOf(me().id);
    if (!shop) return notify('Set up your shop before adding images.', 'error');
    try {
      for (const file of files) {
        const result = await actions.uploadImage(shop.id, file);
        if (!result.ok) { notify(result.error, 'error'); break; }
        ui.newImages.push(result.url);
      }
    } catch (error) { notify('Could not upload the image: ' + error.message, 'error'); }
    refreshUploader();
  }
});

/* ───────────── forms ───────────── */
function showError(msg) { const el = $('#form-error'); if (el) { el.textContent = msg; el.hidden = false; el.scrollIntoView({ block: 'center' }); } }

document.addEventListener('submit', async (e) => {
  const form = e.target.closest('[data-form]');
  if (!form) return;
  e.preventDefault();
  const f = Object.fromEntries(new FormData(form));
  const user = me();

  switch (form.dataset.form) {
    case 'signup': {
      if (!isNgPhone(f.phone)) return showError('Please enter a valid Nigerian phone number, e.g. 0816 301 3017 or +234 816 301 3017.');
      if (f.password.length < 6) return showError('Password must be at least 6 characters.');
      if (!f.agree) return showError('Please accept the agreement to continue.');
      let r;
      try { r = await actions.signup({ role: ui.signupRole, name: f.name, email: f.email, phone: f.phone, password: f.password }); }
      catch (error) { return showError('Could not create your account: ' + error.message); }
      if (!r.ok) return showError(r.error);
      if (r.needsConfirmation) {
        notify('Account created. Check your email to confirm it, then log in.');
        break;
      }
      notify(ui.signupRole === 'seller' ? 'Welcome! Now set up your shop.' : 'Welcome to ' + BRAND.name + '!');
      go('/dashboard');
      break;
    }
    case 'login': {
      let r;
      try { r = await actions.login(f.email, f.password); }
      catch (error) { return showError('Could not log in: ' + error.message); }
      if (!r.ok) return showError(r.error);
      go(route.q.get('next') || '/dashboard');
      break;
    }
    case 'create-shop': {
      const cats = new FormData(form).getAll('cat');
      if (!cats.length) return showError('Pick at least one category you sell in.');
      ui.sellerTab = 'products';
      let result;
      try { result = await actions.createShop(user.id, { name: f.name.trim(), city: f.city.trim(), bio: f.bio.trim(), whatSells: f.whatSells.trim(), categories: cats }); }
      catch (error) { return showError('Could not create your shop: ' + error.message); }
      if (!result.ok) return showError(result.error);
      notify('Your shop is saved and awaiting review. You can add products now.');
      break;
    }
    case 'update-shop': {
      let result;
      try { result = await actions.updateShop(shopOf(user.id).id, { name: f.name, city: f.city, state: f.state, bio: f.bio, whatSells: f.whatSells, social: f.social }); }
      catch (error) { return showError('Could not update your shop: ' + error.message); }
      if (!result.ok) return showError(result.error);
      notify('Shop updated');
      break;
    }
    case 'add-product': {
      const shop = shopOf(user.id);
      let result;
      try { result = await actions.addProduct({ shopId: shop.id, name: f.name.trim(), price: Number(f.price), stock: Number(f.stock), description: f.description.trim(), category: f.category, images: ui.newImages.slice() }); }
      catch (error) { return showError('Could not publish the product: ' + error.message); }
      if (!result.ok) return showError(result.error);
      ui.newImages = [];
      render();
      notify(shop.verified === 'verified'
        ? '"' + f.name.trim() + '" is now live. Add another!'
        : '"' + f.name.trim() + '" is saved and will be visible after shop approval.');
      break;
    }
    case 'update-profile':
      {
        let r;
        try { r = await actions.updateUser(user.id, { address: f.address }); }
        catch (error) { return showError('Could not save your profile: ' + error.message); }
        if (!r.ok) return showError(r.error);
      }
      notify('Saved');
      break;
    case 'checkout': {
      const lines = cartDetailed();
      if (new Set(lines.map((line) => line.product.shopId)).size !== 1) {
        return showError('Checkout one shop at a time. Remove items from other shops and try again.');
      }
      if (!isNgPhone(f.phone)) return showError('Please enter a valid Nigerian phone number.');
      const button = $('#pay-btn');
      if (button) { button.disabled = true; button.textContent = 'Connecting to test checkout…'; }
      try {
        const result = await actions.initializePaystackCheckout({
          items: lines.map((line) => ({ product_id: line.product.id, quantity: line.qty })),
          delivery_address: [f.line, f.city, f.phone].map((value) => String(value || '').trim()).filter(Boolean).join(', '),
        });
        if (!result.ok) return showError(result.error || 'Could not start test checkout.');
        if (!result.authorization_url) return showError('Paystack did not return a checkout link.');
        window.location.assign(result.authorization_url);
      } catch (error) { showError('Could not start test checkout: ' + error.message); }
      finally { if (button) { button.disabled = false; button.textContent = 'Continue to Paystack test checkout'; } }
      break;
    }
    case 'seller-step': {
      collectSeller(form);
      const err = validateSeller(ui.sellerStep, ui.sellerForm);
      if (err) return showError(err);
      if (ui.sellerStep < 4) { ui.sellerStep += 1; render(); window.scrollTo(0, 0); return; }
      let r;
      try { r = await actions.signupSeller(ui.sellerForm); }
      catch (error) { ui.sellerStep = 1; render(); return showError('Could not submit your application: ' + error.message); }
      if (!r.ok) { ui.sellerStep = 1; render(); return showError(r.error); }
      ui.sellerForm = {}; ui.sellerStep = 1; ui.sellerTab = 'overview';
      if (r.needsConfirmation) {
        notify('Application submitted. Check your email to confirm your account, then log in.');
      } else {
        notify('Application received. Your seller application is pending review.');
        go('/dashboard');
      }
      break;
    }
    case 'contact': {
      const body = 'Name: ' + f.name + '\nContact: ' + f.reach + '\n\n' + f.message;
      location.href = 'mailto:' + BRAND.supportEmail + '?subject=' + encodeURIComponent('Message from ' + f.name + ' (website)') + '&body=' + encodeURIComponent(body);
      break;
    }
    case 'send-message': {
      let result;
      try { result = await actions.sendMessage(user.id, form.dataset.to, f.text, form.dataset.product); }
      catch (error) { return showError('Could not send your message: ' + error.message); }
      if (!result.ok) return showError(result.error);
      break;
    }
  }
});

onNavigate();
initializeAuth();
