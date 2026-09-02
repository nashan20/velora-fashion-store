import { useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { SlidersHorizontal, X } from 'lucide-react';

export default function Catalog({
  title = 'Shop', subtitle = 'Explore the complete VELORA collection.', products, filter,
  addToCart, toggleWishlist, wishlist,
}) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('featured');
  const [type, setType] = useState('all');
  const [availability, setAvailability] = useState('all');
  const [maxPrice, setMaxPrice] = useState(300);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const base = useMemo(() => products.filter((p) => !filter || p.category === filter || p.type === filter), [products, filter]);
  const types = useMemo(() => [...new Set(base.map((p) => p.type))].sort(), [base]);
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const x = base.filter((p) => {
      const matchesSearch = !term || `${p.name} ${p.category} ${p.type} ${p.color}`.toLowerCase().includes(term);
      const matchesType = type === 'all' || p.type === type;
      const matchesStock = availability === 'all' || (availability === 'in' ? p.stock > 0 : p.stock <= 0);
      return matchesSearch && matchesType && matchesStock && p.price <= maxPrice;
    });
    return [...x].sort((a, b) => {
      if (sort === 'low') return a.price - b.price;
      if (sort === 'high') return b.price - a.price;
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'new') return Number(Boolean(b.badge === 'New')) - Number(Boolean(a.badge === 'New'));
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });
  }, [base, q, sort, type, availability, maxPrice]);

  const clearFilters = () => { setType('all'); setAvailability('all'); setMaxPrice(300); setQ(''); };

  return (
    <main className="shop">
      <div className="shop-title"><small>VELORA · 2026</small><h1>{title}</h1><p>{subtitle}</p></div>
      <div className="shopbar">
        <input placeholder="Search this collection" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="filter-toggle" onClick={() => setFiltersOpen((v) => !v)}><SlidersHorizontal /> Filters</button>
        <span>{list.length} pieces</span>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="featured">Featured</option><option value="new">Newest</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="rating">Top rated</option>
        </select>
      </div>
      <div className={`catalog-layout ${filtersOpen ? 'filters-open' : ''}`}>
        <aside className="catalog-filters">
          <div className="filter-head"><b>Filters</b><button onClick={() => setFiltersOpen(false)}><X /></button></div>
          <label>Category
            <select value={type} onChange={(e) => setType(e.target.value)}><option value="all">All categories</option>{types.map((t) => <option key={t}>{t}</option>)}</select>
          </label>
          <label>Availability
            <select value={availability} onChange={(e) => setAvailability(e.target.value)}><option value="all">All</option><option value="in">In stock</option><option value="out">Sold out</option></select>
          </label>
          <label>Maximum price <span>${maxPrice}</span>
            <input type="range" min="50" max="300" step="10" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} />
          </label>
          <button className="text-button" onClick={clearFilters}>Clear all filters</button>
        </aside>
        <div className="product-grid shop-grid">
          {list.map((p) => <ProductCard key={p.id} product={p} addToCart={addToCart} toggleWishlist={toggleWishlist} isWishlisted={wishlist.some((w) => w.id === p.id)} />)}
        </div>
      </div>
      {!list.length && <div className="empty-state"><h2>No pieces found</h2><p>Try removing a filter or searching for another product.</p><button className="outline-btn" onClick={clearFilters}>Reset filters</button></div>}
    </main>
  );
}
