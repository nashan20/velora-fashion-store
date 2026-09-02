import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, ExternalLink } from 'lucide-react';
import { api } from '../api';

export default function Checkout({ cart, setCart, user, reloadProducts }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(searchParams.get('stripe') === 'cancelled' ? 'Stripe checkout was cancelled. Your bag is unchanged.' : '');
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [payment, setPayment] = useState({ cardholder: '', card: '4242 4242 4242 4242', expiry: '12 / 30', cvc: '123' });
  const [details, setDetails] = useState({
    firstName: user?.name?.split(' ')[0] || '', lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '', phone: user?.phone || '', address: user?.address || '', city: '', postalCode: '', country: user?.country || 'Sri Lanka',
  });
  const subtotal = cart.reduce((n, i) => n + i.price * i.qty, 0);
  const delivery = subtotal >= 150 ? 0 : 12;
  const total = subtotal + delivery;

  useEffect(() => { api.stripeStatus().then((x) => setStripeConfigured(Boolean(x.configured))).catch(() => setStripeConfigured(false)); }, []);
  if (!cart.length) return <main className="checkout checkout-empty"><div><h1>No items to checkout</h1><p>Add a product to your bag before continuing.</p></div></main>;

  const updateDetail = (e) => setDetails({ ...details, [e.target.name]: e.target.value });
  const updatePayment = (e) => setPayment({ ...payment, [e.target.name]: e.target.value });

  const placeDemoOrder = async () => {
    setBusy(true); setError('');
    try {
      const order = await api.createOrder({
        customer: details, paymentMethod: 'demo-card',
        items: cart.map((i) => ({ id: i.id, size: i.size, color: i.color, qty: i.qty })),
      });
      localStorage.setItem('veloraLastOrder', JSON.stringify(order));
      setCart([]);
      await reloadProducts?.();
      navigate('/order-success', { state: { order } });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const payWithStripe = async () => {
    setBusy(true); setError('');
    try {
      const result = await api.stripeCheckout({ customer: details, items: cart.map((i) => ({ id: i.id, size: i.size, color: i.color, qty: i.qty })) });
      if (result?.url) window.location.assign(result.url);
    } catch (err) { setError(err.message); setBusy(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (step === 1) return setStep(2);
    if (step === 2) {
      const digits = payment.card.replace(/\D/g, '');
      if (digits !== '4242424242424242') return setError('For the portfolio demo, use card number 4242 4242 4242 4242.');
      return setStep(3);
    }
    await placeDemoOrder();
  };

  return (
    <main className="checkout">
      <div>
        <small>SECURE CHECKOUT · STEP {step} OF 3</small>
        <h1>{step === 1 ? 'Delivery' : step === 2 ? 'Payment' : 'Review order'}</h1>
        {error && <p className="checkout-error">{error}</p>}
        <form onSubmit={submit}>
          {step === 1 && <div className="form-grid">
            <input name="firstName" required placeholder="First name" value={details.firstName} onChange={updateDetail} />
            <input name="lastName" required placeholder="Last name" value={details.lastName} onChange={updateDetail} />
            <input name="email" required type="email" placeholder="Email" value={details.email} onChange={updateDetail} />
            <input name="phone" required placeholder="Phone" value={details.phone} onChange={updateDetail} />
            <input name="address" className="full" required placeholder="Address" value={details.address} onChange={updateDetail} />
            <input name="city" required placeholder="City" value={details.city} onChange={updateDetail} />
            <input name="postalCode" required placeholder="Postal code" value={details.postalCode} onChange={updateDetail} />
            <select name="country" className="full" value={details.country} onChange={updateDetail}><option>Sri Lanka</option><option>United Kingdom</option><option>Australia</option><option>United States</option></select>
          </div>}

          {step === 2 && <div>
            <div className="payment-card"><div className="payment-heading"><CreditCard /><div><b>Portfolio demo card</b><small>No real card data is transmitted or charged.</small></div></div>
              <div className="form-grid">
                <input className="full" name="cardholder" required placeholder="Cardholder name" value={payment.cardholder} onChange={updatePayment} />
                <input className="full" name="card" required inputMode="numeric" placeholder="4242 4242 4242 4242" value={payment.card} onChange={updatePayment} />
                <input name="expiry" required placeholder="MM / YY" value={payment.expiry} onChange={updatePayment} />
                <input name="cvc" required placeholder="CVC" value={payment.cvc} onChange={updatePayment} />
              </div>
            </div>
            {stripeConfigured && <div className="stripe-option"><div><b>Stripe test checkout is configured</b><p>Use Stripe's hosted Checkout page with your test-mode secret key.</p></div><button type="button" className="outline-btn" disabled={busy} onClick={payWithStripe}>Open Stripe <ExternalLink /></button></div>}
          </div>}

          {step === 3 && <div className="review-box">
            {cart.map((i) => <p key={`${i.id}-${i.size}-${i.color}`}><span>{i.name} · {i.color} · Size {i.size} × {i.qty}</span><b>${i.price * i.qty}</b></p>)}
            <hr /><p><span>Subtotal</span><b>${subtotal}</b></p><p><span>Delivery</span><b>{delivery ? `$${delivery}` : 'Free'}</b></p><p><span>Total</span><b>${total}</b></p>
            <p><span>Deliver to</span><b>{details.firstName} {details.lastName}, {details.city}</b></p><p><span>Payment</span><b>Demo card ending 4242</b></p>
          </div>}

          <div className="checkout-actions">
            {step > 1 && <button type="button" className="outline-btn" disabled={busy} onClick={() => setStep(step - 1)}>Back</button>}
            <button className="primary-btn" disabled={busy}>{busy ? 'Processing…' : step < 3 ? 'Continue' : 'Place order'}</button>
          </div>
        </form>
      </div>
      <aside>
        <h2>Order total</h2><p>${total}</p><small>{user?.email}</small><small>Shipping: {delivery ? `$${delivery}` : 'Complimentary'}</small>
        <div className="checkout-mini-items">{cart.map((i) => <div key={`${i.id}-${i.size}-${i.color}`}><img src={i.image} alt="" /><span>{i.name}<small>{i.color} · {i.size} · Qty {i.qty}</small></span><b>${i.price * i.qty}</b></div>)}</div>
      </aside>
    </main>
  );
}
