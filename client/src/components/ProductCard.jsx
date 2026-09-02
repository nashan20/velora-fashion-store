import { Heart, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProductCard({ product, addToCart, toggleWishlist, isWishlisted }) {
  const defaultSize = product.sizes?.[0] || 'M';
  return (
    <article className="product-card">
      <div className="product-image">
        <Link to={`/product/${product.id}`}><img src={product.image} alt={product.name} loading="lazy" /></Link>
        {product.badge && <span className="badge">{product.badge}</span>}
        <button className={`heart ${isWishlisted ? 'liked' : ''}`} onClick={() => toggleWishlist?.(product)} aria-label="Toggle wishlist"><Heart fill={isWishlisted ? 'currentColor' : 'none'} /></button>
        <button className="quick" onClick={() => addToCart(product, defaultSize, product.color)} disabled={!product.stock}><ShoppingBag /> {product.stock ? 'Quick add' : 'Sold out'}</button>
      </div>
      <div className="product-meta">
        <div><Link to={`/product/${product.id}`}><h3>{product.name}</h3></Link><p>{product.type} · {product.color}</p><small>{product.stock < 8 ? `Only ${product.stock} left` : 'In stock'}</small></div>
        <div className="price">${product.price}{product.oldPrice && <s>${product.oldPrice}</s>}</div>
      </div>
    </article>
  );
}
