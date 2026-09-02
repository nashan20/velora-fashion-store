import 'dotenv/config';
import dns from 'node:dns';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { products as seedProducts } from './data/seedProducts.js';

// Force Node.js to use reliable DNS servers for MongoDB Atlas
dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = express();
const PORT = Number(process.env.PORT || 5000);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'velora-dev-secret-change-me';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@velora.demo').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'VeloraAdmin123!';
const ORDER_STATUSES = ['Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

app.use(cors({ origin: CLIENT_URL.split(',').map((x) => x.trim()), credentials: true }));

// Stripe requires the unparsed request body for webhook signature verification.
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ message: 'Stripe webhook is not configured.' });
  }
  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const signature = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      if (orderId) await updateOrderPayment(orderId, 'Paid', 'Processing', session.id);
    }
    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ message: `Webhook error: ${error.message}` });
  }
});

app.use(express.json({ limit: '2mb' }));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  country: { type: String, default: 'Sri Lanka' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  category: String,
  type: String,
  price: Number,
  oldPrice: Number,
  badge: String,
  color: String,
  hex: String,
  rating: Number,
  stock: Number,
  image: String,
  gallery: [String],
  sizes: [String],
  colors: [{ name: String, hex: String }],
  reviews: [{ name: String, rating: Number, date: String, text: String }],
  description: String,
  material: String,
  care: String,
  featured: Boolean,
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  userId: String,
  userEmail: String,
  items: [{ id: String, name: String, image: String, size: String, color: String, price: Number, qty: Number }],
  customer: mongoose.Schema.Types.Mixed,
  subtotal: Number,
  delivery: Number,
  total: Number,
  status: { type: String, default: 'Processing' },
  paymentMethod: { type: String, default: 'demo-card' },
  paymentStatus: { type: String, default: 'Demo approved' },
  paymentSessionId: String,
}, { timestamps: true });

const contactSchema = new mongoose.Schema({ name: String, email: String, topic: String, message: String }, { timestamps: true });
const subscriberSchema = new mongoose.Schema({ email: { type: String, unique: true, lowercase: true } }, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);
const Subscriber = mongoose.models.Subscriber || mongoose.model('Subscriber', subscriberSchema);

const memory = {
  products: structuredClone(seedProducts),
  users: [],
  orders: [],
  messages: [],
  subscribers: [],
};

const dbReady = () => mongoose.connection.readyState === 1;
const sanitizeUser = (user) => ({
  id: String(user._id || user.id),
  name: user.name,
  email: user.email,
  role: user.role,
  country: user.country || 'Sri Lanka',
  phone: user.phone || '',
  address: user.address || '',
});
const sanitizeProduct = (p) => {
  const obj = p?.toObject ? p.toObject() : { ...p };
  delete obj.__v;
  delete obj._id;
  return obj;
};
const sanitizeOrder = (o) => {
  const obj = o?.toObject ? o.toObject() : { ...o };
  obj.id = obj.orderId || obj.id;
  obj.date = new Date(obj.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  delete obj.__v;
  return obj;
};

function slugify(value = '') {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
function createToken(user) {
  return jwt.sign({ id: String(user._id || user.id), email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}
async function auth(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
  if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}
function adminOnly(req, res, next) {
  if (req.auth?.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
  next();
}
async function findUserByEmail(email) {
  const lower = String(email || '').trim().toLowerCase();
  return dbReady() ? User.findOne({ email: lower }) : memory.users.find((u) => u.email === lower);
}
async function findUserById(id) {
  if (dbReady()) {
    if (!mongoose.isValidObjectId(id)) return null;
    return User.findById(id);
  }
  return memory.users.find((u) => String(u.id) === String(id));
}
async function findProductById(id) {
  return dbReady() ? Product.findOne({ id }) : memory.products.find((p) => p.id === id);
}
async function listProducts() {
  const list = dbReady() ? await Product.find({}).lean() : memory.products;
  return list.map(sanitizeProduct);
}
async function getOrderById(orderId) {
  return dbReady() ? Order.findOne({ orderId }) : memory.orders.find((o) => o.orderId === orderId);
}
async function updateOrderPayment(orderId, paymentStatus, status, sessionId = '') {
  if (dbReady()) return Order.findOneAndUpdate({ orderId }, { paymentStatus, status, paymentSessionId: sessionId }, { new: true });
  const order = memory.orders.find((o) => o.orderId === orderId);
  if (order) Object.assign(order, { paymentStatus, status, paymentSessionId: sessionId });
  return order;
}

app.get('/api/health', (_, res) => res.json({ status: 'ok', service: 'velora-api', database: dbReady() ? 'mongodb' : 'memory-demo' }));

app.post('/api/auth/register', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (name.length < 2) return res.status(400).json({ message: 'Please enter your full name.' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must contain at least 6 characters.' });
    if (await findUserByEmail(email)) return res.status(409).json({ message: 'An account with this email already exists.' });
    const passwordHash = await bcrypt.hash(password, 10);
    let user;
    if (dbReady()) user = await User.create({ name, email, passwordHash, role: 'customer' });
    else {
      user = { id: `USR-${Date.now()}`, name, email, passwordHash, role: 'customer', country: 'Sri Lanka', phone: '', address: '', createdAt: new Date() };
      memory.users.push(user);
    }
    res.status(201).json({ token: createToken(user), user: sanitizeUser(user) });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Incorrect email or password.' });
    res.json({ token: createToken(user), user: sanitizeUser(user) });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/auth/me', auth, async (req, res) => {
  const user = await findUserById(req.auth.id);
  if (!user) return res.status(404).json({ message: 'Account not found.' });
  res.json({ user: sanitizeUser(user) });
});

app.put('/api/users/me', auth, async (req, res) => {
  try {
    const current = await findUserById(req.auth.id);
    if (!current) return res.status(404).json({ message: 'Account not found.' });
    const name = String(req.body.name ?? current.name).trim();
    const email = String(req.body.email ?? current.email).trim().toLowerCase();
    const country = String(req.body.country ?? current.country ?? 'Sri Lanka');
    const phone = String(req.body.phone ?? current.phone ?? '');
    const address = String(req.body.address ?? current.address ?? '');
    const emailOwner = await findUserByEmail(email);
    if (emailOwner && String(emailOwner._id || emailOwner.id) !== String(current._id || current.id)) return res.status(409).json({ message: 'That email is already used by another account.' });
    let updated;
    if (dbReady()) updated = await User.findByIdAndUpdate(req.auth.id, { name, email, country, phone, address }, { new: true });
    else {
      Object.assign(current, { name, email, country, phone, address });
      updated = current;
    }
    const user = sanitizeUser(updated);
    res.json({ user, token: createToken(updated) });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/products', async (_, res) => {
  try { res.json(await listProducts()); }
  catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await findProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json(sanitizeProduct(product));
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/products', auth, adminOnly, async (req, res) => {
  try {
    const payload = { ...req.body };
    payload.id = slugify(payload.id || payload.name);
    if (!payload.id || !payload.name) return res.status(400).json({ message: 'Product name is required.' });
    if (await findProductById(payload.id)) return res.status(409).json({ message: 'A product with this slug already exists.' });
    payload.price = Number(payload.price || 0);
    payload.stock = Number(payload.stock || 0);
    payload.rating = Number(payload.rating || 4.8);
    payload.gallery = Array.isArray(payload.gallery) && payload.gallery.length ? payload.gallery : [payload.image].filter(Boolean);
    payload.image = payload.image || payload.gallery[0] || '';
    payload.colors = Array.isArray(payload.colors) && payload.colors.length ? payload.colors : [{ name: payload.color || 'Black', hex: payload.hex || '#171717' }];
    payload.sizes = Array.isArray(payload.sizes) && payload.sizes.length ? payload.sizes : ['XS', 'S', 'M', 'L', 'XL'];
    payload.reviews = payload.reviews || [];
    let created;
    if (dbReady()) created = await Product.create(payload);
    else { created = payload; memory.products.unshift(payload); }
    res.status(201).json(sanitizeProduct(created));
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.put('/api/products/:id', auth, adminOnly, async (req, res) => {
  try {
    const current = await findProductById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Product not found.' });
    const payload = { ...req.body };
    delete payload._id; delete payload.__v;
    if (payload.price != null) payload.price = Number(payload.price);
    if (payload.stock != null) payload.stock = Number(payload.stock);
    let updated;
    if (dbReady()) updated = await Product.findOneAndUpdate({ id: req.params.id }, payload, { new: true });
    else { Object.assign(current, payload); updated = current; }
    res.json(sanitizeProduct(updated));
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.delete('/api/products/:id', auth, adminOnly, async (req, res) => {
  try {
    if (dbReady()) {
      const deleted = await Product.findOneAndDelete({ id: req.params.id });
      if (!deleted) return res.status(404).json({ message: 'Product not found.' });
    } else {
      const index = memory.products.findIndex((p) => p.id === req.params.id);
      if (index < 0) return res.status(404).json({ message: 'Product not found.' });
      memory.products.splice(index, 1);
    }
    res.json({ message: 'Product deleted.' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/orders', auth, async (req, res) => {
  try {
    const requestedItems = Array.isArray(req.body.items) ? req.body.items : [];
    if (!requestedItems.length) return res.status(400).json({ message: 'Your bag is empty.' });
    const resolved = [];
    for (const item of requestedItems) {
      const product = await findProductById(item.id);
      if (!product) return res.status(400).json({ message: `Product ${item.id} is no longer available.` });
      const qty = Math.max(1, Math.min(10, Number(item.qty || 1)));
      if (Number(product.stock || 0) < qty) return res.status(409).json({ message: `${product.name} does not have enough stock.` });
      resolved.push({ id: product.id, name: product.name, image: product.image, size: item.size, color: item.color || product.color, price: Number(product.price), qty });
    }
    const subtotal = resolved.reduce((sum, item) => sum + item.price * item.qty, 0);
    const delivery = subtotal >= 150 ? 0 : 12;
    const orderId = `VL${Date.now().toString().slice(-8)}`;
    const payload = {
      orderId,
      userId: req.auth.id,
      userEmail: req.auth.email,
      items: resolved,
      customer: req.body.customer || {},
      subtotal,
      delivery,
      total: subtotal + delivery,
      status: 'Processing',
      paymentMethod: req.body.paymentMethod || 'demo-card',
      paymentStatus: req.body.paymentMethod === 'stripe' ? 'Pending' : 'Demo approved',
      createdAt: new Date(),
    };
    let created;
    if (dbReady()) {
      created = await Order.create(payload);
      for (const item of resolved) await Product.updateOne({ id: item.id }, { $inc: { stock: -item.qty } });
    } else {
      created = payload;
      memory.orders.unshift(created);
      for (const item of resolved) {
        const product = memory.products.find((p) => p.id === item.id);
        if (product) product.stock = Math.max(0, Number(product.stock || 0) - item.qty);
      }
    }
    res.status(201).json(sanitizeOrder(created));
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/orders/mine', auth, async (req, res) => {
  try {
    const orders = dbReady()
      ? await Order.find({ $or: [{ userId: req.auth.id }, { userEmail: req.auth.email }] }).sort({ createdAt: -1 })
      : memory.orders.filter((o) => o.userId === req.auth.id || o.userEmail === req.auth.email);
    res.json(orders.map(sanitizeOrder));
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/orders/:id', auth, async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (req.auth.role !== 'admin' && order.userId !== req.auth.id && order.userEmail !== req.auth.email) return res.status(403).json({ message: 'You cannot view this order.' });
    res.json(sanitizeOrder(order));
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/contact', async (req, res) => {
  try {
    const payload = { name: req.body.name, email: req.body.email, topic: req.body.topic || 'Other', message: req.body.message, createdAt: new Date() };
    if (!payload.name || !payload.email || !payload.message) return res.status(400).json({ message: 'Name, email and message are required.' });
    if (dbReady()) await Contact.create(payload); else memory.messages.unshift({ id: `MSG-${Date.now()}`, ...payload });
    res.status(201).json({ message: 'Message received.' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/newsletter', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (dbReady()) await Subscriber.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
    else if (!memory.subscribers.includes(email)) memory.subscribers.push(email);
    res.status(201).json({ message: 'Subscribed.' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/payments/stripe-status', (_, res) => res.json({ configured: Boolean(process.env.STRIPE_SECRET_KEY) }));

app.post('/api/payments/create-checkout-session', auth, async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ message: 'Stripe test mode is not configured. Use the demo card checkout or add STRIPE_SECRET_KEY.' });
  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const requestedItems = Array.isArray(req.body.items) ? req.body.items : [];
    if (!requestedItems.length) return res.status(400).json({ message: 'Your bag is empty.' });
    const lineItems = [];
    const resolvedItems = [];
    let subtotal = 0;
    for (const item of requestedItems) {
      const product = await findProductById(item.id);
      if (!product) return res.status(400).json({ message: `Product ${item.id} is unavailable.` });
      const qty = Math.max(1, Math.min(10, Number(item.qty || 1)));
      subtotal += Number(product.price) * qty;
      resolvedItems.push({ id: product.id, name: product.name, image: product.image, size: item.size, color: item.color || product.color, price: Number(product.price), qty });
      lineItems.push({
        quantity: qty,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(Number(product.price) * 100),
          product_data: { name: `${product.name} · ${item.size || ''}`, images: product.image ? [product.image] : [] },
        },
      });
    }
    if (subtotal < 150) lineItems.push({ quantity: 1, price_data: { currency: 'usd', unit_amount: 1200, product_data: { name: 'Standard delivery' } } });
    const orderId = `VL${Date.now().toString().slice(-8)}`;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: req.auth.email,
      metadata: { orderId },
      success_url: `${CLIENT_URL}/order-success?order=${orderId}&stripe=success`,
      cancel_url: `${CLIENT_URL}/checkout?stripe=cancelled`,
    });
    const payload = {
      orderId, userId: req.auth.id, userEmail: req.auth.email,
      items: resolvedItems, customer: req.body.customer || {}, subtotal,
      delivery: subtotal >= 150 ? 0 : 12, total: subtotal + (subtotal >= 150 ? 0 : 12),
      status: 'Processing', paymentMethod: 'stripe', paymentStatus: 'Pending', paymentSessionId: session.id, createdAt: new Date(),
    };
    if (dbReady()) await Order.create(payload); else memory.orders.unshift(payload);
    res.status(201).json({ url: session.url, orderId });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/admin/stats', auth, adminOnly, async (_, res) => {
  try {
    const products = await listProducts();
    const orders = dbReady() ? await Order.find({}).lean() : memory.orders;
    const users = dbReady() ? await User.countDocuments({ role: 'customer' }) : memory.users.filter((u) => u.role === 'customer').length;
    const revenue = orders.filter((o) => o.status !== 'Cancelled').reduce((sum, o) => sum + Number(o.total || 0), 0);
    res.json({ products: products.length, orders: orders.length, customers: users, inventory: products.reduce((n, p) => n + Number(p.stock || 0), 0), revenue });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/admin/users', auth, adminOnly, async (_, res) => {
  try {
    const users = dbReady() ? await User.find({ role: 'customer' }).sort({ createdAt: -1 }) : memory.users.filter((u) => u.role === 'customer');
    res.json(users.map((u) => ({ ...sanitizeUser(u), createdAt: u.createdAt })));
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/admin/orders', auth, adminOnly, async (_, res) => {
  try {
    const orders = dbReady() ? await Order.find({}).sort({ createdAt: -1 }) : memory.orders;
    res.json(orders.map(sanitizeOrder));
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.patch('/api/admin/orders/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const status = req.body.status;
    if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid order status.' });
    let order;
    if (dbReady()) order = await Order.findOneAndUpdate({ orderId: req.params.id }, { status }, { new: true });
    else { order = memory.orders.find((o) => o.orderId === req.params.id); if (order) order.status = status; }
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    res.json(sanitizeOrder(order));
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/admin/messages', auth, adminOnly, async (_, res) => {
  try {
    const messages = dbReady() ? await Contact.find({}).sort({ createdAt: -1 }).lean() : memory.messages;
    res.json(messages);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.use((req, res) => res.status(404).json({ message: 'VELORA API route not found.' }));

async function boot() {
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  memory.users.push({ id: 'USR-ADMIN', name: 'VELORA Admin', email: ADMIN_EMAIL, passwordHash: adminHash, role: 'admin', country: 'Sri Lanka', phone: '', address: '', createdAt: new Date() });

  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('MongoDB connected');
      if ((await Product.countDocuments()) === 0) await Product.insertMany(seedProducts);
      const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
      if (!existingAdmin) await User.create({ name: 'VELORA Admin', email: ADMIN_EMAIL, passwordHash: adminHash, role: 'admin' });
    } catch (error) {
      console.warn(`MongoDB unavailable; using in-memory demo store: ${error.message}`);
    }
  } else {
    console.log('MONGO_URI not set; using in-memory demo store.');
  }

  app.listen(PORT, () => console.log(`VELORA API running on http://localhost:${PORT}`));
}

boot();
