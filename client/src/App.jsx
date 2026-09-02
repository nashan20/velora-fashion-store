import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Product from './pages/Product';
import InfoPage from './pages/InfoPage';
import Auth from './pages/Auth';
import Account from './pages/Account';
import Wishlist from './pages/Wishlist';
import CartPage from './pages/CartPage';
import Checkout from './pages/Checkout';
import {
  SearchPage, Contact, Newsletter, Orders, Profile, OrderSuccess, OrderDetail,
} from './pages/UtilityPages';
import {
  AdminDashboard, AdminProducts, AdminProductForm, AdminOrders, AdminCustomers, AdminMessages,
} from './pages/AdminPages';
import { products as seedProducts } from './data/products';
import { api, tokenStore } from './api';

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function ProtectedRoute({ user, role, children }) {
  const location = useLocation();
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (role && user.role !== role) return <Navigate to="/account" replace />;
  return children;
}

export default function App() {
  const [cart, setCart] = useState(() => readStorage('veloraCart', []));
  const [wishlist, setWishlist] = useState(() => readStorage('veloraWishlist', []));
  const [user, setUser] = useState(() => tokenStore.get() ? readStorage('veloraUser', null) : null);
  const [products, setProducts] = useState(seedProducts);
  const [cartOpen, setCartOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState(true);

  useEffect(() => localStorage.setItem('veloraCart', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('veloraWishlist', JSON.stringify(wishlist)), [wishlist]);
  useEffect(() => {
    if (user) localStorage.setItem('veloraUser', JSON.stringify(user));
    else localStorage.removeItem('veloraUser');
  }, [user]);

  const reloadProducts = async () => {
    try {
      const data = await api.products();
      if (Array.isArray(data) && data.length) setProducts(data);
      setApiOnline(true);
      return data;
    } catch {
      setApiOnline(false);
      setProducts((current) => current?.length ? current : seedProducts);
      return seedProducts;
    }
  };

  useEffect(() => { reloadProducts(); }, []);
  useEffect(() => {
    if (!tokenStore.get()) return;
    api.me().then(({ user: freshUser }) => setUser(freshUser)).catch((error) => {
      if (error.status === 401 || error.status === 404) {
        tokenStore.clear();
        setUser(null);
      }
    });
  }, []);

  const addToCart = (product, size = product.sizes?.[0] || 'M', color = product.color) => {
    setCart((items) => {
      const existing = items.find((i) => i.id === product.id && i.size === size && i.color === color);
      if (existing) {
        return items.map((i) =>
          i.id === product.id && i.size === size && i.color === color ? { ...i, qty: Math.min(10, i.qty + 1) } : i
        );
      }
      return [...items, { ...product, size, color, qty: 1 }];
    });
    setCartOpen(true);
  };

  const toggleWishlist = (product) => {
    setWishlist((items) =>
      items.some((i) => i.id === product.id)
        ? items.filter((i) => i.id !== product.id)
        : [...items, product]
    );
  };

  const cartCount = useMemo(() => cart.reduce((n, i) => n + i.qty, 0), [cart]);
  const catalogProps = { products, addToCart, toggleWishlist, wishlist };
  const protectedProps = { user };

  return (
    <>
      <Header
        cartCount={cartCount}
        wishlistCount={wishlist.length}
        openCart={() => setCartOpen(true)}
        user={user}
        apiOnline={apiOnline}
      />

      <Routes>
        <Route path="/" element={<Home {...catalogProps} />} />
        <Route path="/shop" element={<Catalog {...catalogProps} />} />
        <Route path="/new-arrivals" element={<Catalog {...catalogProps} title="New arrivals" subtitle="Fresh signatures for the new season." />} />
        <Route path="/women" element={<Catalog {...catalogProps} title="Women" filter="Women" />} />
        <Route path="/men" element={<Catalog {...catalogProps} title="Men" filter="Men" />} />
        <Route path="/accessories" element={<Catalog {...catalogProps} title="Accessories" filter="Accessories" />} />
        <Route path="/dresses" element={<Catalog {...catalogProps} title="Dresses" filter="Dresses" />} />
        <Route path="/outerwear" element={<Catalog {...catalogProps} title="Outerwear" filter="Outerwear" />} />
        <Route path="/product/:id" element={<Product {...catalogProps} />} />

        <Route path="/collections" element={<InfoPage type="collections" />} />
        <Route path="/journal" element={<InfoPage type="journal" />} />
        <Route path="/about" element={<InfoPage type="about" />} />
        <Route path="/sustainability" element={<InfoPage type="sustainability" />} />
        <Route path="/shipping" element={<InfoPage type="shipping" />} />
        <Route path="/returns" element={<InfoPage type="returns" />} />
        <Route path="/size-guide" element={<InfoPage type="size" />} />
        <Route path="/faq" element={<InfoPage type="faq" />} />
        <Route path="/privacy" element={<InfoPage type="privacy" />} />
        <Route path="/terms" element={<InfoPage type="terms" />} />
        <Route path="/search" element={<SearchPage {...catalogProps} />} />
        <Route path="/wishlist" element={<Wishlist wishlist={wishlist} addToCart={addToCart} toggleWishlist={toggleWishlist} />} />
        <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} />} />

        <Route path="/checkout" element={<ProtectedRoute {...protectedProps}><Checkout cart={cart} setCart={setCart} user={user} reloadProducts={reloadProducts} /></ProtectedRoute>} />
        <Route path="/order-success" element={<ProtectedRoute {...protectedProps}><OrderSuccess /></ProtectedRoute>} />
        <Route path="/login" element={user ? <Navigate to="/account" replace /> : <Auth setUser={setUser} />} />
        <Route path="/register" element={user ? <Navigate to="/account" replace /> : <Auth mode="register" setUser={setUser} />} />
        <Route path="/account" element={<ProtectedRoute {...protectedProps}><Account user={user} setUser={setUser} /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute {...protectedProps}><Orders user={user} /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute {...protectedProps}><OrderDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute {...protectedProps}><Profile user={user} setUser={setUser} /></ProtectedRoute>} />

        <Route path="/contact" element={<Contact />} />
        <Route path="/newsletter" element={<Newsletter />} />

        <Route path="/admin" element={<ProtectedRoute user={user} role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute user={user} role="admin"><AdminProducts products={products} reloadProducts={reloadProducts} /></ProtectedRoute>} />
        <Route path="/admin/products/new" element={<ProtectedRoute user={user} role="admin"><AdminProductForm products={products} reloadProducts={reloadProducts} /></ProtectedRoute>} />
        <Route path="/admin/products/:id/edit" element={<ProtectedRoute user={user} role="admin"><AdminProductForm products={products} reloadProducts={reloadProducts} /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute user={user} role="admin"><AdminOrders /></ProtectedRoute>} />
        <Route path="/admin/customers" element={<ProtectedRoute user={user} role="admin"><AdminCustomers /></ProtectedRoute>} />
        <Route path="/admin/messages" element={<ProtectedRoute user={user} role="admin"><AdminMessages /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer />
      <CartDrawer open={cartOpen} close={() => setCartOpen(false)} cart={cart} setCart={setCart} />
    </>
  );
}
