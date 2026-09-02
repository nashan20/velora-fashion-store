import { useEffect, useMemo, useState } from 'react';
import { Heart, ShieldCheck, Truck, RotateCcw, ZoomIn, Star } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

export default function Product({ products, addToCart, toggleWishlist, wishlist }) {
  const { id } = useParams();
  const p = products.find((x) => x.id === id) || products[0];
  const [size, setSize] = useState(p?.sizes?.[0] || 'M');
  const [color, setColor] = useState(p?.color || '');
  const [activeImage, setActiveImage] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const liked = wishlist.some((x) => x.id === p.id);

  useEffect(() => {
    setSize(p?.sizes?.[0] || 'M');
    setColor(p?.color || '');
    setActiveImage(0);
    setZoomed(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [p?.id]);

  const gallery = p.gallery?.length ? p.gallery : [p.image];
  const related = useMemo(() => products.filter((x) => x.id !== p.id && (x.category === p.category || x.type === p.type)).slice(0, 4), [products, p]);

  return (
    <main>
      <section className="pdp">
        <div className="pdp-gallery">
          <div className="pdp-thumbs">
            {gallery.map((img, index) => <button key={`${img}-${index}`} className={index === activeImage ? 'active' : ''} onClick={() => { setActiveImage(index); setZoomed(false); }}><img src={img} alt={`${p.name} view ${index + 1}`} /></button>)}
          </div>
          <button className={`pdp-main-image ${zoomed ? 'zoomed' : ''}`} onClick={() => setZoomed((v) => !v)} aria-label="Zoom product image">
            <img src={gallery[activeImage]} alt={p.name} />
            <span><ZoomIn /> {zoomed ? 'Reduce' : 'Zoom'}</span>
          </button>
        </div>

        <div className="pdp-info">
          <small>{p.category} · {p.type}</small>
          <h1>{p.name}</h1>
          <div className="pdp-price"><span>${p.price}</span>{p.oldPrice && <s>${p.oldPrice}</s>}<span>★ {p.rating}</span></div>
          <p className="pdp-copy">{p.description}</p>
          <div className={`stock-note ${p.stock < 8 ? 'low' : ''}`}>{p.stock > 0 ? p.stock < 8 ? `Low stock · only ${p.stock} remaining` : `In stock · ${p.stock} available` : 'Sold out'}</div>

          <div className="variant-block">
            <div className="variant-title"><span>Colour</span><b>{color}</b></div>
            <div className="color-swatches">
              {(p.colors || [{ name: p.color, hex: '#171717' }]).map((c) => <button key={c.name} title={c.name} className={color === c.name ? 'active' : ''} onClick={() => setColor(c.name)}><span style={{ background: c.hex }} /></button>)}
            </div>
          </div>

          <div className="size-row">
            <div><span>Select size</span><Link to="/size-guide">Size guide</Link></div>
            <div>{(p.sizes || ['XS', 'S', 'M', 'L', 'XL']).map((s) => <button key={s} className={size === s ? 'active' : ''} onClick={() => setSize(s)}>{s}</button>)}</div>
          </div>

          <div className="buy-row">
            <button disabled={!p.stock} onClick={() => addToCart(p, size, color)}>{p.stock ? `Add to bag · $${p.price}` : 'Sold out'}</button>
            <button aria-label="Add to wishlist" onClick={() => toggleWishlist(p)}><Heart fill={liked ? 'currentColor' : 'none'} /></button>
          </div>

          <div className="benefits"><p><Truck /> Free delivery over $150</p><p><RotateCcw /> 30-day returns</p><p><ShieldCheck /> Secure checkout</p></div>
          <details open><summary>Product details</summary><p>{p.material}</p></details>
          <details><summary>Care guide</summary><p>{p.care}</p></details>
        </div>
      </section>

      <section className="reviews-section">
        <div className="section-head"><div><small>CLIENT NOTES</small><h2>Reviews</h2></div><div className="review-score"><b>{p.rating}</b><span>★★★★★</span><small>{p.reviews?.length || 0} verified reviews</small></div></div>
        <div className="review-grid">{(p.reviews || []).map((r, idx) => <article key={`${r.name}-${idx}`}><div>{Array.from({ length: r.rating }).map((_, i) => <Star key={i} fill="currentColor" />)}</div><p>“{r.text}”</p><footer><b>{r.name}</b><span>{r.date}</span></footer></article>)}</div>
      </section>

      <section className="collection related-section">
        <div className="section-head"><div><small>COMPLETE THE EDIT</small><h2>You may also like</h2></div><Link to={`/${p.category.toLowerCase()}`}>View {p.category.toLowerCase()} →</Link></div>
        <div className="product-grid">{related.map((x) => <ProductCard key={x.id} product={x} addToCart={addToCart} toggleWishlist={toggleWishlist} isWishlisted={wishlist.some((w) => w.id === x.id)} />)}</div>
      </section>
    </main>
  );
}
