import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { api, tokenStore } from '../api';

export function SearchPage({ products, addToCart, toggleWishlist, wishlist }) {
  const [q, setQ] = useState('');
  const list = q ? products.filter((p) => (`${p.name} ${p.category} ${p.type} ${p.color}`).toLowerCase().includes(q.toLowerCase())) : [];
  return <main className="shop"><div className="shop-title"><small>DISCOVER</small><h1>Search</h1><input className="big-search" autoFocus placeholder="Search products, categories…" value={q} onChange={(e) => setQ(e.target.value)} /></div>{q && !list.length && <div className="empty-state"><h2>No results</h2><p>Try “coat”, “dress”, “bag” or “tailoring”.</p></div>}<div className="product-grid shop-grid">{list.map((p) => <ProductCard key={p.id} product={p} addToCart={addToCart} toggleWishlist={toggleWishlist} isWishlisted={wishlist.some((w) => w.id === p.id)} />)}</div></main>;
}

export function Contact() {
  const [form, setForm] = useState({ name: '', email: '', topic: 'Order enquiry', message: '' });
  const [status, setStatus] = useState({ busy: false, message: '', error: false });
  const submit = async (e) => {
    e.preventDefault(); setStatus({ busy: true, message: '', error: false });
    try { const result = await api.contact(form); setForm({ name: '', email: '', topic: 'Order enquiry', message: '' }); setStatus({ busy: false, message: result.message || 'Message received.', error: false }); }
    catch (err) { setStatus({ busy: false, message: err.message, error: true }); }
  };
  return <main className="contact-page"><div><small>CLIENT SERVICES</small><h1>How can we help?</h1><p>Our team replies Monday–Friday, 9:00–18:00.</p><div className="contact-notes"><p><b>Orders</b><span>Track purchases from My VELORA.</span></p><p><b>Returns</b><span>30 days on unworn full-price items.</span></p></div></div><form onSubmit={submit}><input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}><option>Order enquiry</option><option>Product & sizing</option><option>Returns</option><option>Other</option></select><textarea required rows="7" placeholder="Tell us how we can help" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /><button disabled={status.busy}>{status.busy ? 'Sending…' : 'Send message'}</button>{status.message && <p className={status.error ? 'auth-error' : 'success'}>{status.message}</p>}</form></main>;
}

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const submit = async (e) => { e.preventDefault(); try { await api.newsletter({ email }); setStatus('Welcome to the VELORA list.'); setEmail(''); } catch (err) { setStatus(err.message); } };
  return <main className="newsletter-page"><small>PRIVATE EDITS · EARLY ACCESS</small><h1>Stay close to VELORA.</h1><p>Receive new collection stories, editorial notes and private release access.</p><form onSubmit={submit}><input required type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} /><button>Join the list</button></form>{status && <p>{status}</p>}</main>;
}

export function Orders() {
  const [orders, setOrders] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { api.myOrders().then(setOrders).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  return <main className="account-page"><small>MY VELORA</small><h1>Orders</h1>{loading ? <p>Loading order history…</p> : error ? <p className="auth-error">{error}</p> : orders.length ? orders.map((o) => <Link className="order-row" to={`/orders/${o.id}`} key={o.id}><div><b>{o.id}</b><span>{o.date}</span></div><span className={`status-pill status-${String(o.status).toLowerCase()}`}>{o.status}</span><span>{o.items?.length || 0} item{o.items?.length === 1 ? '' : 's'}</span><b>${o.total}</b></Link>) : <><p>No orders yet.</p><Link className="primary-btn" to="/shop">Start shopping</Link></>}</main>;
}

export function OrderDetail() {
  const { id } = useParams(); const [order, setOrder] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.order(id).then(setOrder).catch((e) => setError(e.message)); }, [id]);
  if (error) return <main className="account-page"><h1>Order</h1><p className="auth-error">{error}</p></main>;
  if (!order) return <main className="account-page"><h1>Order</h1><p>Loading…</p></main>;
  return <main className="account-page order-detail"><small>ORDER {order.id}</small><h1>{order.status}</h1><div className="order-detail-grid"><section><h2>Items</h2>{order.items.map((i) => <article className="order-product" key={`${i.id}-${i.size}-${i.color}`}><img src={i.image} alt={i.name} /><div><b>{i.name}</b><span>{i.color} · {i.size} · Qty {i.qty}</span></div><strong>${i.price * i.qty}</strong></article>)}</section><aside><h2>Summary</h2><p><span>Subtotal</span><b>${order.subtotal}</b></p><p><span>Delivery</span><b>{order.delivery ? `$${order.delivery}` : 'Free'}</b></p><p><span>Total</span><b>${order.total}</b></p><hr/><p><span>Payment</span><b>{order.paymentStatus}</b></p><p><span>Placed</span><b>{order.date}</b></p></aside></div><Link className="text-link" to="/orders">← Back to orders</Link></main>;
}

export function Profile({ user, setUser }) {
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', country: user?.country || 'Sri Lanka', phone: user?.phone || '', address: user?.address || '' });
  const [status, setStatus] = useState({ message: '', error: false, busy: false });
  const save = async (e) => {
    e.preventDefault(); setStatus({ message: '', error: false, busy: true });
    try { const result = await api.updateMe(form); tokenStore.set(result.token); setUser(result.user); localStorage.setItem('veloraUser', JSON.stringify(result.user)); setStatus({ message: 'Profile saved.', error: false, busy: false }); }
    catch (err) { setStatus({ message: err.message, error: true, busy: false }); }
  };
  return <main className="account-page"><small>MY VELORA</small><h1>Profile</h1><form className="profile-card" onSubmit={save}><label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label><label>Address<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label><label>Country<select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}><option>Sri Lanka</option><option>United Kingdom</option><option>Australia</option><option>United States</option></select></label><button className="primary-btn" disabled={status.busy}>{status.busy ? 'Saving…' : 'Save changes'}</button>{status.message && <p className={status.error ? 'auth-error' : 'success'}>{status.message}</p>}</form></main>;
}

export function OrderSuccess() {
  const { state } = useLocation();
  const params = new URLSearchParams(useLocation().search);
  const queryOrder = params.get('order');
  const [fetched, setFetched] = useState(null);
  let saved = null; try { saved = JSON.parse(localStorage.getItem('veloraLastOrder') || 'null'); } catch { saved = null; }
  useEffect(() => { if (queryOrder) api.order(queryOrder).then(setFetched).catch(() => {}); }, [queryOrder]);
  const order = state?.order || fetched || saved;
  return <main className="success-page"><div>✓</div><small>ORDER CONFIRMED</small><h1>Thank you.</h1><p>Your order <b>{order?.id || queryOrder || 'VELORA'}</b> has been placed successfully.</p>{order?.total != null && <p>Total: <b>${order.total}</b></p>}<Link className="primary-btn" to="/orders">View orders</Link></main>;
}
