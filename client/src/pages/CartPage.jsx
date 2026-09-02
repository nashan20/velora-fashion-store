import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

export default function CartPage({ cart, setCart }) {
  const total = cart.reduce((n, i) => n + i.price * i.qty, 0);
  const changeQty = (item, delta) => setCart((items) => items.map((x) => x.id === item.id && x.size === item.size && x.color === item.color ? { ...x, qty: Math.max(1, Math.min(10, x.qty + delta)) } : x));
  const remove = (item) => setCart((items) => items.filter((x) => !(x.id === item.id && x.size === item.size && x.color === item.color)));
  return <main className="cart-page"><h1>Shopping bag</h1>{!cart.length ? <div className="cart-empty"><p>Your bag is currently empty.</p><Link className="primary-btn" to="/shop">Continue shopping</Link></div> : <><div className="cart-list">{cart.map((i) => <article key={`${i.id}-${i.size}-${i.color}`}><img src={i.image} alt={i.name}/><div><h3>{i.name}</h3><p>{i.color} · Size {i.size}</p><div className="qty"><button onClick={() => changeQty(i, -1)}>−</button><span>{i.qty}</span><button onClick={() => changeQty(i, 1)}>+</button></div><button className="remove-line" onClick={() => remove(i)}><Trash2 /> Remove</button></div><b>${i.price * i.qty}</b></article>)}</div><aside className="order-summary"><h2>Summary</h2><p><span>Subtotal</span><b>${total}</b></p><p><span>Delivery</span><b>{total >= 150 ? 'Free' : '$12'}</b></p><hr/><p><span>Total</span><b>${total + (total >= 150 ? 0 : 12)}</b></p><Link className="primary-btn" to="/checkout">Secure checkout</Link><Link className="drawer-view-bag" to="/shop">Continue shopping</Link></aside></>}</main>;
}
