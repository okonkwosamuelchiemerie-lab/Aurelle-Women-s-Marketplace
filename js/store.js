/* Supabase data layer. Only the buyer's cart is stored in browser storage. */

const DB_KEY = 'aurelle_db_v2';
const CART_KEY = 'aurelle_cart_v1';
const DAY_MS = 86400000;
const uid = (p) => p + '_' + Math.random().toString(36).slice(2, 9);

const PALETTE = [
  ['#f0e2d3', '#c9a27a'], ['#e8d5c0', '#b8865b'], ['#f3e6d8', '#d2b48c'],
  ['#ead9c6', '#a9744f'], ['#efdfcf', '#c08a60'], ['#e6d3bf', '#9b6b45'],
];

const DEFAULT_PRODUCT_IMAGES = {
  'Ankara Wrap Midi Dress': 'assets/images/ankara-dress.jpg',
  'Satin Slip Dress': 'assets/images/satin-dress.jpg',
  'Linen Two-Piece Set': 'assets/images/clothing-set.jpg',
  'Pleated Maxi Skirt': 'assets/images/pleated-skirt.jpg',
  'Velvet Matte Lipstick Set (6pc)': 'assets/images/makeup.jpg',
  'Full Glam Makeup Kit': 'assets/images/full-glam-palette.jpg',
  'Glow Highlighter Palette': 'assets/images/highlighter-glow.jpg',
  'Hydrating Sheet Masks (10pc)': 'assets/images/skincare.jpg',
  'Turmeric Clay Face Mask': 'assets/images/face-mask-model.jpg',
  'Gold Layered Necklace': 'assets/images/jewelry.jpg',
  'Pearl Drop Earrings': 'assets/images/pearl-earrings.jpg',
  'Stackable Ring Set': 'assets/images/stackable-rings.jpg',
  'Structured Leather Tote': 'assets/images/handbag.jpg',
  'Mini Crossbody Bag': 'assets/images/crossbody-model.jpg',
  'Block Heel Sandals': 'assets/images/shoes.jpg',
  'Classic Nude Pumps': 'assets/images/teal-brogues.jpg',
};
const LEGACY_DEFAULT_PRODUCT_IMAGES = {
  'Ankara Wrap Midi Dress': 'assets/images/ankara-dress.jpg',
  'Satin Slip Dress': 'assets/images/satin-dress.jpg',
  'Linen Two-Piece Set': 'assets/images/clothing-set.jpg',
  'Pleated Maxi Skirt': 'assets/images/clothing-set.jpg',
  'Velvet Matte Lipstick Set (6pc)': 'assets/images/makeup.jpg',
  'Full Glam Makeup Kit': 'assets/images/makeup.jpg',
  'Glow Highlighter Palette': 'assets/images/makeup.jpg',
  'Hydrating Sheet Masks (10pc)': 'assets/images/skincare.jpg',
  'Turmeric Clay Face Mask': 'assets/images/skincare.jpg',
  'Gold Layered Necklace': 'assets/images/jewelry.jpg',
  'Pearl Drop Earrings': 'assets/images/jewelry.jpg',
  'Stackable Ring Set': 'assets/images/jewelry.jpg',
  'Structured Leather Tote': 'assets/images/handbag.jpg',
  'Mini Crossbody Bag': 'assets/images/handbag.jpg',
  'Block Heel Sandals': 'assets/images/shoes.jpg',
  'Classic Nude Pumps': 'assets/images/shoes.jpg',
};
const DEFAULT_SHOP_COVERS = {
  s_1: 'assets/images/shop-fashion-cover.jpg',
  s_2: 'assets/images/shop-beauty-cover.jpg',
  s_3: 'assets/images/shop-jewelry-cover.jpg',
  s_4: 'assets/images/shop-accessories-cover.jpg',
};
const LEGACY_DEFAULT_SHOP_COVERS = {
  s_1: 'assets/images/fashion-billboard.jpg',
  s_2: 'assets/images/skincare.jpg',
  s_3: 'assets/images/jewelry.jpg',
  s_4: 'assets/images/handbag.jpg',
};

function seed() {
  const t = Date.now();
  const mk = (id, name, email) => ({ id, name, email, phone: '0801000000' + id.slice(-1), password: 'demo123', role: 'seller', createdAt: t, address: '' });
  const users = [mk('u_s1', 'Zuri Okafor', 'zuri@demo.com'), mk('u_s2', 'Amara Eze', 'amara@demo.com'), mk('u_s3', 'Ifeoma Bello', 'ifeoma@demo.com'), mk('u_s4', 'Tolu Adeyemi', 'tolu@demo.com')];
  const shops = [
    { id: 's_1', ownerId: 'u_s1', name: 'Zuri Atelier', city: 'Lagos', categories: ['womenswear'], bio: 'Contemporary African-inspired dresses, sets and skirts, tailored in small batches. Every piece is made to make you feel unforgettable.', whatSells: 'Ankara and satin dresses, two-piece sets, skirts' },
    { id: 's_2', ownerId: 'u_s2', name: 'Glow by Amara', city: 'Abuja', categories: ['makeup', 'masks'], bio: 'Makeup kits and skincare masks for every skin tone. Original products only, always sealed.', whatSells: 'Makeup kits, lipsticks, face masks' },
    { id: 's_3', ownerId: 'u_s3', name: 'Ivory & Gold', city: 'Lagos', categories: ['jewelry'], bio: 'Delicate, everyday jewelry in gold-tone and freshwater pearl. Gift-ready packaging on every order.', whatSells: 'Necklaces, earrings, rings' },
    { id: 's_4', ownerId: 'u_s4', name: 'Bella Totes & Steps', city: 'Port Harcourt', categories: ['bags', 'shoes'], bio: 'Handbags and heels that go from office to owambe. Quality leather, comfortable fits.', whatSells: 'Handbags, heels, sandals' },
  ];
  const list = [
    ['s_1', 'Ankara Wrap Midi Dress', 'womenswear', 18500, 12, 'A flattering wrap silhouette in a bold hand-finished Ankara print. Fully lined, adjustable tie waist. Available in sizes 8 to 18.'],
    ['s_1', 'Satin Slip Dress', 'womenswear', 24000, 8, 'Liquid-soft satin with a bias cut and adjustable straps. Perfect for dinners and date nights.'],
    ['s_1', 'Linen Two-Piece Set', 'womenswear', 21000, 10, 'Breathable linen crop top and high-waist trousers. Effortless, polished and comfortable.'],
    ['s_1', 'Pleated Maxi Skirt', 'womenswear', 12500, 15, 'Flowing pleats with a soft elastic waist. Pairs with anything in your wardrobe.'],
    ['s_2', 'Velvet Matte Lipstick Set (6pc)', 'makeup', 9500, 30, 'Six long-wearing matte shades from nude to berry. Enriched with vitamin E so lips stay soft.'],
    ['s_2', 'Full Glam Makeup Kit', 'makeup', 32000, 6, 'Everything you need: foundation, concealer, palette, brushes, lashes and setting spray in a travel case.'],
    ['s_2', 'Glow Highlighter Palette', 'makeup', 8000, 20, 'Four buildable highlighters from soft champagne to deep bronze. Lights up every skin tone.'],
    ['s_2', 'Hydrating Sheet Masks (10pc)', 'masks', 6500, 40, 'Hyaluronic acid sheet masks for an instant plump, dewy glow. Ten individually sealed sachets.'],
    ['s_2', 'Turmeric Clay Face Mask', 'masks', 5000, 25, 'A purifying clay mask with turmeric and aloe to even tone and calm breakouts.'],
    ['s_3', 'Gold Layered Necklace', 'jewelry', 14500, 14, 'Three delicate layered chains in 18k gold-tone, tarnish-resistant and skin-friendly.'],
    ['s_3', 'Pearl Drop Earrings', 'jewelry', 7500, 22, 'Freshwater pearl drops on hypoallergenic posts. A timeless gift.'],
    ['s_3', 'Stackable Ring Set', 'jewelry', 9000, 18, 'Five slim gold-tone rings you can mix, match and stack.'],
    ['s_4', 'Structured Leather Tote', 'bags', 38000, 5, 'Roomy structured tote that fits a 14-inch laptop. Genuine leather with suede lining.'],
    ['s_4', 'Mini Crossbody Bag', 'bags', 22000, 9, 'A compact crossbody with a gold chain strap. Fits phone, cards and lipstick.'],
    ['s_4', 'Block Heel Sandals', 'shoes', 19500, 11, 'Comfortable 7cm block heels with an ankle strap. Sizes 37 to 42.'],
    ['s_4', 'Classic Nude Pumps', 'shoes', 23000, 7, 'The one pair that goes with everything. Cushioned insole, pointed toe.'],
  ];
  const products = list.map(([shopId, name, category, price, stock, description], i) => ({
    id: 'p_' + (i + 1), shopId, name, category, price, stock, description,
    images: DEFAULT_PRODUCT_IMAGES[name] ? [DEFAULT_PRODUCT_IMAGES[name]] : [],
    art: PALETTE[i % PALETTE.length], createdAt: t - i * 3600000,
  }));
  const more = [
    { businessType: BUSINESS_TYPES[0], yearsInBusiness: '3–5 years', state: 'Lagos', address: 'Lekki Phase 1', sourcing: SOURCING_OPTIONS[0], delivery: ['Own dispatch rider', 'Courier / logistics company'], deliveryTime: '1–3 days', returnPolicy: 'Exchange within 7 days' },
    { businessType: BUSINESS_TYPES[1], yearsInBusiness: '1–3 years', state: 'FCT (Abuja)', address: 'Wuse 2', sourcing: SOURCING_OPTIONS[1], delivery: ['Courier / logistics company'], deliveryTime: '3–7 days', returnPolicy: 'No returns' },
    { businessType: BUSINESS_TYPES[0], yearsInBusiness: '5+ years', state: 'Lagos', address: 'Ikeja', sourcing: SOURCING_OPTIONS[3], delivery: ['Own dispatch rider', 'Customer pickup'], deliveryTime: 'Same day', returnPolicy: 'Refund within 7 days' },
    { businessType: BUSINESS_TYPES[2], yearsInBusiness: 'Less than 1 year', state: 'Rivers', address: 'GRA Phase 2', sourcing: SOURCING_OPTIONS[2], delivery: ['Courier / logistics company'], deliveryTime: '3–7 days', returnPolicy: 'Exchange within 7 days' },
  ];
  shops.forEach((sh, i) => Object.assign(sh, more[i], { verified: 'verified', demo: true, cover: DEFAULT_SHOP_COVERS[sh.id] }));
  users.forEach((u) => { u.status = 'active'; u.demo = true; });
  return { users, shops, products, orders: [], messages: [], cart: [], session: null };
}

function autoRelease(d) {
  let changed = false;
  const orders = d.orders.map((o) => {
    if (o.status === 'shipped' && o.shippedAt && Date.now() - o.shippedAt > AUTO_RELEASE_DAYS * DAY_MS) {
      changed = true;
      return Object.assign({}, o, { status: 'completed', completedAt: Date.now(), autoReleased: true });
    }
    return o;
  });
  return changed ? Object.assign({}, d, { orders }) : d;
}

function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const hadLocalAdmin = data.users.some((user) => user.role === 'admin');
      const hadPayoutDetails = data.shops.some((shop) => shop.bank);
      if (hadLocalAdmin) {
        data.users = data.users.filter((user) => user.role !== 'admin');
        if (data.session && !data.users.some((user) => user.id === data.session)) data.session = null;
      }
      if (hadPayoutDetails) data.shops.forEach((shop) => { delete shop.bank; });
      if (hadLocalAdmin || hadPayoutDetails) localStorage.setItem(DB_KEY, JSON.stringify(data));
      const demoShopIds = data.shops.filter((shop) => shop.demo).map((shop) => shop.id);
      data.products.forEach((product) => {
        if (product.category === 'dresses' || product.category === 'clothes') product.category = 'womenswear';
        const image = DEFAULT_PRODUCT_IMAGES[product.name];
        const legacyImage = LEGACY_DEFAULT_PRODUCT_IMAGES[product.name];
        const images = product.images || [];
        if (demoShopIds.includes(product.shopId) && image && (!images.length || (legacyImage && images[0] === legacyImage))) {
          product.images = [image].concat(images.slice(1));
        }
      });
      data.shops.forEach((shop) => {
        if (!(shop.categories || []).some((category) => category === 'dresses' || category === 'clothes')) return;
        const categories = shop.categories.map((category) => category === 'dresses' || category === 'clothes' ? 'womenswear' : category);
        shop.categories = categories.filter((category, index) => categories.indexOf(category) === index);
      });
      data.shops.forEach((shop) => {
        const legacyCover = LEGACY_DEFAULT_SHOP_COVERS[shop.id];
        if (demoShopIds.includes(shop.id) && (!shop.cover || (legacyCover && shop.cover === legacyCover))) {
          shop.cover = DEFAULT_SHOP_COVERS[shop.id];
        }
      });
      return autoRelease(data);
    }
  } catch (e) { /* ignore */ }
  const s = seed();
  try { localStorage.setItem(DB_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
  return s;
}

function loadLiveDB() {
  let cart = [];
  try {
    const savedCart = localStorage.getItem(CART_KEY);
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      if (Array.isArray(parsed)) cart = parsed;
    } else {
      const legacy = JSON.parse(localStorage.getItem(DB_KEY) || 'null');
      if (legacy && Array.isArray(legacy.cart)) cart = legacy.cart;
    }
  } catch (e) { /* ignore invalid browser data */ }
  return { users: [], shops: [], products: [], orders: [], messages: [], sellerApplications: [], cart };
}

let db = loadLiveDB();
const listeners = [];
const onChange = (fn) => listeners.push(fn);
const supabaseClient = window.supabase && window.supabase.createClient
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: true } })
  : null;
let authProfile = null;
let authReady = false;
let authGeneration = 0;

function publishAuthChange() { listeners.forEach((f) => f()); }

function mapShop(row) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    state: row.state,
    city: row.city,
    categories: row.categories || [],
    bio: row.bio || '',
    whatSells: row.what_sells || '',
    social: row.social || '',
    logo: row.logo_path || '',
    cover: row.cover_path || '',
    verified: row.verified,
    createdAt: row.created_at ? Date.parse(row.created_at) : Date.now(),
  };
}

function mapProduct(row) {
  return {
    id: row.id,
    shopId: row.shop_id,
    name: row.name,
    category: row.category,
    description: row.description || '',
    price: Number(row.price),
    stock: row.stock,
    images: row.images || [],
    art: PALETTE[Math.abs(String(row.id).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % PALETTE.length],
    createdAt: row.created_at ? Date.parse(row.created_at) : Date.now(),
  };
}

function mapSellerApplication(row) {
  return {
    ownerId: row.owner_id,
    businessType: row.business_type,
    cac: row.cac,
    yearsInBusiness: row.years_in_business,
    address: row.business_address,
    sourcing: row.sourcing,
    productCount: row.product_count,
    monthlyOrders: row.monthly_orders,
    delivery: row.delivery_methods || [],
    deliveryTime: row.delivery_time,
    returnPolicy: row.return_policy,
    businessName: row.business_name,
    categories: row.categories || [],
    bio: row.bio || '',
    state: row.state || '',
    city: row.city || '',
    whatSells: row.what_sells || '',
    social: row.social || '',
    status: row.status,
    createdAt: row.created_at ? Date.parse(row.created_at) : Date.now(),
  };
}

function mapMessage(row) {
  return {
    id: row.id,
    from: row.sender_id,
    to: row.recipient_id,
    productId: row.product_id,
    text: row.body,
    at: row.created_at ? Date.parse(row.created_at) : Date.now(),
  };
}

async function loadMarketplaceData() {
  const [shopsResult, productsResult] = await Promise.all([
    supabaseClient.from('shops').select('*').order('created_at', { ascending: false }),
    supabaseClient.from('products').select('*').order('created_at', { ascending: false }),
  ]);
  if (shopsResult.error) return { ok: false, error: 'Could not load shops: ' + shopsResult.error.message };
  if (productsResult.error) return { ok: false, error: 'Could not load products: ' + productsResult.error.message };

  const shops = (shopsResult.data || []).map(mapShop);
  const products = (productsResult.data || []).map(mapProduct);
  let users = authProfile ? [authProfile] : [];
  let sellerApplications = [];
  let messages = [];
  let orders = [];

  if (authProfile) {
    const [applicationsResult, messagesResult, ordersResult, contactsResult] = await Promise.all([
      supabaseClient.from('seller_applications').select('*').order('created_at', { ascending: false }),
      supabaseClient.from('messages').select('*').order('created_at', { ascending: true }),
      supabaseClient.from('orders').select('*').order('created_at', { ascending: false }),
      supabaseClient.rpc('message_contacts'),
    ]);
    if (applicationsResult.error) return { ok: false, error: 'Could not load seller applications: ' + applicationsResult.error.message };
    if (messagesResult.error) return { ok: false, error: 'Could not load messages: ' + messagesResult.error.message };
    if (ordersResult.error) return { ok: false, error: 'Could not load orders: ' + ordersResult.error.message };
    if (contactsResult.error) return { ok: false, error: 'Could not load message contacts: ' + contactsResult.error.message };
    sellerApplications = (applicationsResult.data || []).map(mapSellerApplication);
    messages = (messagesResult.data || []).map(mapMessage);

    const orderRows = ordersResult.data || [];
    if (orderRows.length) {
      const { data: itemRows, error: itemsError } = await supabaseClient
        .from('order_items')
        .select('*')
        .in('order_id', orderRows.map((order) => order.id));
      if (itemsError) return { ok: false, error: 'Could not load order items: ' + itemsError.message };
      orders = orderRows.map((row) => ({
        id: row.id,
        buyerId: row.buyer_id,
        shopId: row.shop_id,
        subtotal: Number(row.subtotal),
        rate: Number(row.commission_rate),
        commission: Number(row.commission_amount),
        payout: Number(row.seller_amount),
        address: { line: row.delivery_address },
        status: row.status,
        createdAt: row.created_at ? Date.parse(row.created_at) : Date.now(),
        shippedAt: row.shipped_at ? Date.parse(row.shipped_at) : null,
        completedAt: row.completed_at ? Date.parse(row.completed_at) : null,
        items: (itemRows || []).filter((item) => item.order_id === row.id).map((item) => ({
          productId: item.product_id,
          name: item.product_name,
          price: Number(item.unit_price),
          qty: item.quantity,
          category: '',
          image: null,
        })),
      }));
    }

    if (authProfile.role === 'admin') {
      const { data, error } = await supabaseClient.rpc('admin_list_users');
      if (error) return { ok: false, error: 'Could not load users: ' + error.message };
      users = (data || []).map((row) => ({
        id: row.id,
        email: row.email || '',
        name: row.name || '',
        phone: row.phone || '',
        role: row.role,
        status: row.status,
        createdAt: row.created_at ? Date.parse(row.created_at) : Date.now(),
        source: 'supabase',
      }));
    } else {
      users = users.concat((contactsResult.data || []).map((row) => ({
        id: row.user_id,
        name: row.name || '',
        role: row.role,
      })));
    }

    sellerApplications.forEach((application) => {
      const shop = shops.find((item) => item.ownerId === application.ownerId);
      if (shop) Object.assign(shop, application);
    });
  }

  db = Object.assign({}, db, { users, shops, products, messages, orders, sellerApplications });
  return { ok: true };
}

async function refreshMarketplaceData() {
  const result = await loadMarketplaceData();
  if (result.ok) publishAuthChange();
  return result;
}

async function setAuthSession(session) {
  const generation = ++authGeneration;
  // Same person still signed in (token refresh, tab refocus): keep them logged in while we refresh in the background.
  const sameUser = !!(session && authProfile && authProfile.id === session.user.id);
  if (!sameUser) {
    authProfile = null;
    authReady = false;
  }
  if (!supabaseClient) return { ok: false, error: 'Supabase did not load. Refresh the page and try again.' };

  if (session) {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('id, name, phone, address, role, status, created_at')
      .eq('id', session.user.id)
      .maybeSingle();
    if (generation !== authGeneration) return { ok: true, user: authProfile };
    if (error) {
      authReady = true;
      publishAuthChange();
      if (sameUser) return { ok: true, user: authProfile };
      return { ok: false, error: 'Could not load your account profile: ' + error.message };
    }
    if (!data) {
      authReady = true;
      publishAuthChange();
      return { ok: false, error: 'Your account profile was not created. Please contact support.' };
    }
    if (data.status === 'suspended') {
      authReady = true;
      publishAuthChange();
      await supabaseClient.auth.signOut();
      return { ok: false, error: 'This account has been suspended. Please contact ' + BRAND.supportEmail + '.' };
    }

    authProfile = Object.assign({}, data, {
      email: session.user.email || '',
      createdAt: data.created_at ? Date.parse(data.created_at) : Date.now(),
      source: 'supabase',
    });
  }

  let result;
  try { result = await loadMarketplaceData(); }
  catch (error) { result = { ok: false, error: 'Could not connect to marketplace data: ' + error.message }; }
  if (generation !== authGeneration) return { ok: true, user: authProfile };
  authReady = true;
  publishAuthChange();
  return result.ok ? { ok: true, user: authProfile } : result;
}

async function initializeAuth() {
  if (!supabaseClient) {
    authReady = true;
    publishAuthChange();
    notify('Supabase did not load. Refresh the page and try again.', 'error');
    return;
  }
  supabaseClient.auth.onAuthStateChange((event, session) => {
    // The first load is handled by getSession() below; a silent token refresh changes nothing for the visitor.
    if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return;
    window.setTimeout(() => {
      setAuthSession(session).then((result) => {
        if (!result.ok) notify(result.error, 'error');
      }, (error) => {
        authProfile = null;
        authReady = true;
        publishAuthChange();
        notify('Could not restore your account session: ' + error.message, 'error');
      });
    }, 0);
  });
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    authReady = true;
    publishAuthChange();
    notify('Could not connect to your account: ' + error.message, 'error');
    return;
  }
  const result = await setAuthSession(data.session);
  if (!result.ok) notify(result.error, 'error');
}

function save(next, silent) {
  db = next;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(db.cart));
    localStorage.removeItem(DB_KEY);
  }
  catch (e) { notify('Browser storage is full. Try fewer or smaller images.', 'error'); }
  if (!silent) listeners.forEach((f) => f());
}
const patch = (p, silent) => save(Object.assign({}, db, p), silent);

/* ── selectors ── */
const me = () => authProfile;
const isAuthReady = () => authReady;
const shopOf = (userId) => db.shops.find((s) => s.ownerId === userId) || null;
const shopById = (id) => db.shops.find((s) => s.id === id) || null;
const productById = (id) => db.products.find((p) => p.id === id) || null;

const shopIsLive = (sh) => {
  if (!sh || sh.verified === 'rejected') return false;
  const user = me();
  if (user && user.role === 'admin') {
    const owner = db.users.find((item) => item.id === sh.ownerId);
    return sh.verified === 'verified' && (!owner || owner.status !== 'suspended');
  }
  return sh.verified === 'verified' || !!(user && user.id === sh.ownerId);
};
const liveShops = () => db.shops.filter(shopIsLive);
const liveProducts = () => db.products.filter((p) => shopIsLive(shopById(p.shopId)));

function sellerRate(shopId) {
  const done = db.orders.filter((o) => o.shopId === shopId && o.status === 'completed').reduce((a, o) => a + o.subtotal, 0);
  return done >= COMMISSION.reducedAfterSales ? COMMISSION.reduced : COMMISSION.standard;
}
function sellerStats(shopId) {
  const orders = db.orders.filter((o) => o.shopId === shopId);
  const sum = (arr, k) => arr.reduce((a, o) => a + o[k], 0);
  const held = orders.filter((o) => o.status === 'paid' || o.status === 'shipped');
  const done = orders.filter((o) => o.status === 'completed');
  return { orders, heldPayout: sum(held, 'payout'), paidOut: sum(done, 'payout'), grossDone: sum(done, 'subtotal') };
}
const buyerSpend = (userId) => db.orders.filter((o) => o.buyerId === userId && o.status !== 'refunded').reduce((a, o) => a + o.subtotal, 0);
function cartDetailed() {
  return db.cart.map((c) => {
    const product = productById(c.productId);
    return product ? Object.assign({}, c, { product, shop: shopById(product.shopId) }) : null;
  }).filter(Boolean);
}
function displayName(userId) {
  const u = db.users.find((x) => x.id === userId);
  const shop = db.shops.find((s) => s.ownerId === userId);
  if (shop) return shop.name;
  if (!u) return 'Marketplace member';
  if (u.role === 'seller') return u.name;
  return u.name;
}
function threadsFor(userId) {
  const map = {};
  db.messages.forEach((m) => {
    if (m.from !== userId && m.to !== userId) return;
    const other = m.from === userId ? m.to : m.from;
    if (!map[other] || map[other].at < m.at) map[other] = m;
  });
  return Object.keys(map).map((other) => ({ other, last: map[other] })).sort((a, b) => b.last.at - a.last.at);
}

const ORDER_STATUS = {
  pending_payment: { label: 'Payment pending', tone: 'gold' },
  paid: { label: 'Paid', tone: 'gold' },
  shipped: { label: 'Shipped', tone: 'blue' },
  completed: { label: 'Completed', tone: 'green' },
  refunded: { label: 'Refunded', tone: 'red' },
  cancelled: { label: 'Cancelled', tone: 'red' },
};

/* Resize a photo to at most 1400px on its longest side as a high-quality JPEG.
   Small photos and anything we cannot read are uploaded unchanged. */
async function compressImage(file) {
  const MAX = 1400;
  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    URL.revokeObjectURL(url);
    const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
    if (scale === 1 && file.size <= 400 * 1024) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    return blob && blob.size < file.size ? blob : file;
  } catch (e) {
    return file;
  }
}

/* ── actions ── */
const actions = {
  async signup({ role, name, email, phone, password, metadata }) {
    if (!supabaseClient) return { ok: false, error: 'Supabase did not load. Refresh the page and try again.' };
    const { data, error } = await supabaseClient.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: Object.assign({ name: name.trim(), phone: phone.trim(), role: role === 'seller' ? 'seller' : 'buyer' }, metadata || {}),
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { ok: false, error: error.message };
    if (data.session) {
      const result = await setAuthSession(data.session);
      if (!result.ok) return result;
    }
    return { ok: true, user: authProfile, needsConfirmation: !data.session };
  },
  async login(email, password) {
    if (!supabaseClient) return { ok: false, error: 'Supabase did not load. Refresh the page and try again.' };
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { ok: false, error: error.message };
    const result = await setAuthSession(data.session);
    return result.ok ? { ok: true, user: result.user } : result;
  },
  async logout() {
    if (!supabaseClient) return { ok: false, error: 'Supabase did not load. Refresh the page and try again.' };
    const { error } = await supabaseClient.auth.signOut();
    return error ? { ok: false, error: error.message } : { ok: true };
  },
  async updateUser(id, p) {
    if (authProfile && authProfile.id === id) {
      const { data, error } = await supabaseClient
        .from('profiles')
        .update(p)
        .eq('id', id)
        .select('id, name, phone, address, role, status, created_at')
        .single();
      if (error) return { ok: false, error: error.message };
      authProfile = Object.assign({}, authProfile, data);
      publishAuthChange();
      return { ok: true };
    }
    patch({ users: db.users.map((u) => (u.id === id ? Object.assign({}, u, p) : u)) });
    return { ok: true };
  },

  async createShop(ownerId, data) {
    const { data: row, error } = await supabaseClient.from('shops').insert({
      owner_id: ownerId,
      name: data.name.trim(),
      state: data.state || '',
      city: data.city.trim(),
      categories: data.categories || [],
      bio: data.bio.trim(),
      what_sells: (data.whatSells || '').trim(),
      social: (data.social || '').trim(),
    }).select('*').single();
    if (error) return { ok: false, error: error.message };
    const result = await refreshMarketplaceData();
    return result.ok ? { ok: true, shop: mapShop(row) } : result;
  },
  async updateShop(id, changes) {
    const columns = {
      name: 'name', state: 'state', city: 'city', categories: 'categories',
      bio: 'bio', whatSells: 'what_sells', social: 'social',
      logo: 'logo_path', cover: 'cover_path',
    };
    const update = {};
    Object.keys(columns).forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(changes, key)) update[columns[key]] = changes[key];
    });
    const { error } = await supabaseClient.from('shops').update(update).eq('id', id);
    if (error) return { ok: false, error: error.message };
    return refreshMarketplaceData();
  },

  async addProduct(product) {
    const { error } = await supabaseClient.from('products').insert({
      shop_id: product.shopId,
      name: product.name.trim(),
      category: product.category,
      description: product.description.trim(),
      price: Number(product.price),
      stock: Number(product.stock),
      images: product.images || [],
    });
    if (error) return { ok: false, error: error.message };
    return refreshMarketplaceData();
  },
  async updateProduct(id, changes) {
    const { error } = await supabaseClient.from('products').update(changes).eq('id', id);
    if (error) return { ok: false, error: error.message };
    return refreshMarketplaceData();
  },
  async deleteProduct(id) {
    const { error } = await supabaseClient.from('products').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    db = Object.assign({}, db, { cart: db.cart.filter((item) => item.productId !== id) });
    return refreshMarketplaceData();
  },
  async uploadImage(shopId, file) {
    if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return { ok: false, error: 'Choose a JPEG, PNG, or WebP image.' };
    }
    if (file.size > 15 * 1024 * 1024) return { ok: false, error: 'Each image must be 15 MB or smaller.' };
    // Shrink big phone photos first (same shape, still sharp) so your free storage lasts much longer.
    const prepared = await compressImage(file);
    const extension = prepared.type === 'image/jpeg' ? 'jpg' : prepared.type.split('/')[1];
    const path = shopId + '/' + uid('image') + '.' + extension;
    const { error } = await supabaseClient.storage.from('product-images').upload(path, prepared, {
      cacheControl: '3600',
      contentType: prepared.type,
      upsert: false,
    });
    if (error) return { ok: false, error: error.message };
    const { data } = supabaseClient.storage.from('product-images').getPublicUrl(path);
    return { ok: true, url: data.publicUrl };
  },

  addToCart(productId, qty) {
    qty = qty || 1;
    const ex = db.cart.find((c) => c.productId === productId);
    patch({ cart: ex ? db.cart.map((c) => (c.productId === productId ? Object.assign({}, c, { qty: c.qty + qty }) : c)) : db.cart.concat({ productId, qty }) });
  },
  setCartQty(productId, qty) {
    if (qty < 1) return;
    patch({ cart: db.cart.map((c) => (c.productId === productId ? Object.assign({}, c, { qty }) : c)) });
  },
  removeFromCart(productId) { patch({ cart: db.cart.filter((c) => c.productId !== productId) }); },
  clearCart() { patch({ cart: [] }); },

  async initializePaystackCheckout(checkout) {
    const { data, error } = await supabaseClient.functions.invoke('create-paystack-checkout', { body: checkout });
    return error ? { ok: false, error: error.message } : Object.assign({ ok: true }, data);
  },
  async verifyPaystackPayment(reference) {
    const { data, error } = await supabaseClient.functions.invoke('verify-paystack-payment', { body: { reference } });
    if (error) return { ok: false, error: error.message };
    if (data && data.ok) {
      try { await refreshMarketplaceData(); }
      catch (refreshError) { console.error('Payment confirmed, but order refresh failed', refreshError); }
    }
    return Object.assign({ ok: true }, data);
  },

  async sendMessage(from, to, text, productId) {
    if (!text.trim()) return { ok: false, error: 'Write a message before sending.' };
    const { error } = await supabaseClient.from('messages').insert({
      sender_id: from,
      recipient_id: to,
      product_id: productId || null,
      body: text.trim(),
    });
    if (error) return { ok: false, error: error.message };
    return refreshMarketplaceData();
  },
  /* ── seller application (creates the account AND the shop in one go) ── */
  signupSeller(d) {
    return actions.signup({
      role: 'seller',
      name: d.name,
      email: d.email,
      phone: d.phone,
      password: d.password,
      metadata: {
        seller_application: {
          business_type: d.businessType,
          cac: (d.cac || '').trim(),
          years_in_business: d.yearsInBusiness,
          business_address: d.address.trim(),
          sourcing: d.sourcing,
          product_count: d.productCount,
          monthly_orders: d.monthlyOrders,
          delivery_methods: d.delivery || [],
          delivery_time: d.deliveryTime,
          return_policy: d.returnPolicy,
          business_name: d.businessName.trim(),
          categories: d.categories || [],
          bio: d.bio.trim(),
          state: d.state,
          city: d.city.trim(),
          what_sells: d.whatSells.trim(),
          social: (d.social || '').trim(),
        },
      },
    });
  },

  /* ── admin ── */
  async setUserStatus(id, status) {
    const { error } = await supabaseClient.rpc('admin_set_profile_status', { p_user_id: id, p_status: status });
    if (error) return { ok: false, error: error.message };
    return refreshMarketplaceData();
  },
  async setShopVerified(id, verified) {
    const { error } = await supabaseClient.rpc('admin_set_shop_status', { p_shop_id: id, p_status: verified });
    if (error) return { ok: false, error: error.message };
    return refreshMarketplaceData();
  },
  async createShopFromApplication(ownerId) {
    const application = db.sellerApplications.find((item) => item.ownerId === ownerId);
    if (!application) return { ok: false, error: 'Your seller application was not found. Contact support for help.' };
    return actions.createShop(ownerId, {
      name: application.businessName,
      city: application.city,
      state: application.state,
      categories: application.categories,
      bio: application.bio,
      whatSells: application.whatSells,
      social: application.social,
    });
  },
};
