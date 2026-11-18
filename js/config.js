/* ─────────────────────────────────────────────────────────────
   EDIT THIS FILE to change the brand name, commission and rewards.
   ───────────────────────────────────────────────────────────── */

// Support contact email.
const ADMIN_EMAIL = 'okonkwosamuelchiemerie@gmail.com';

const SUPABASE_URL = 'https://ryjsvvtyddebwityidht.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_KPz--PLAo-hEfUoopQ3AIg_OTuNe9bJ';

const BRAND = {
  name: 'Aurelle',
  tagline: "Where every woman's style lives",
  currency: '₦',
  supportEmail: ADMIN_EMAIL,
  phone: '+2348163013017',
  phoneDisplay: '+234 816 301 3017',
  whatsapp: 'https://wa.me/2348163013017',
  address: 'Lagos, Nigeria',
};

// Commission taken from every sold item.
// 8% to start. After `reducedAfterSales` in completed sales it drops to 7%.
const COMMISSION = {
  standard: 0.08,
  reduced: 0.07,
  reducedAfterSales: 300000,
};

// Demo-only setting; no live payment or payout is configured.
const AUTO_RELEASE_DAYS = 5;

const CATEGORIES = [
  { id: 'dresses', label: 'Dresses', blurb: 'Ankara, occasion & everyday dresses' },
  { id: 'clothes', label: 'Clothes', blurb: 'Two-piece sets, skirts & everyday wear' },
  { id: 'makeup', label: 'Makeup', blurb: 'Kits, lips, palettes & more' },
  { id: 'jewelry', label: 'Jewelry', blurb: 'Necklaces, rings & earrings' },
  { id: 'bags', label: 'Bags', blurb: 'Totes, crossbody & clutches' },
  { id: 'shoes', label: 'Shoes', blurb: 'Heels, flats & sandals' },
  { id: 'masks', label: 'Face Masks', blurb: 'Skin-loving masks & care' },
];

// Loyalty: total spent unlocks tiers and a hidden gift.
const REWARDS = {
  tiers: [
    { name: 'Member', min: 0 },
    { name: 'Silver', min: 50000 },
    { name: 'Gold', min: 100000 },
  ],
  giftUnlockSpend: 100000,
  gifts: [
    'A luxury lip & gloss set',
    'A ₦5,000 voucher for your next order',
    'A silk hair scarf',
    'A hydrating face-mask hamper',
    'Free delivery on your next 3 orders',
  ],
};

const catLabel = (id) => (CATEGORIES.find((c) => c.id === id) || {}).label || id;
const money = (n) => BRAND.currency + Math.round(n).toLocaleString('en-NG');

/* Choices used by the seller application form */
const NG_STATES = ['Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'];
const BUSINESS_TYPES = ['Registered company (CAC)', 'Registered business name (CAC)', 'Not registered yet (individual seller)'];
const YEARS_OPTIONS = ['Just starting', 'Less than 1 year', '1–3 years', '3–5 years', '5+ years'];
const SOURCING_OPTIONS = ['I make or design them myself', 'I buy from local wholesalers', 'I import them', 'A mix of the above'];
const PRODUCT_COUNT_OPTIONS = ['1–10 products', '11–50 products', '51–200 products', 'More than 200 products'];
const MONTHLY_ORDER_OPTIONS = ['Fewer than 20 orders', '20–50 orders', '50–200 orders', 'More than 200 orders'];
const DELIVERY_METHODS = ['Own dispatch rider', 'Courier / logistics company', 'Customer pickup'];
const DELIVERY_TIMES = ['Same day', '1–3 days', '3–7 days', 'More than 7 days'];
const RETURN_POLICIES = ['No returns', 'Exchange within 7 days', 'Refund within 7 days'];

const isNgPhone = (p) => /^(\+234|234|0)[789]\d{9}$/.test(String(p || '').replace(/[\s-]/g, ''));
const fmtDate = (t) => new Date(t).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
