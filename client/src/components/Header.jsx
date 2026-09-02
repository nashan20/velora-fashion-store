import { Heart, Menu, Search, ShoppingBag, User, X, WifiOff } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';

export default function Header({ cartCount = 0, wishlistCount = 0, openCart, user, apiOnline = true }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);
  return (
    <>
      <div className="announcement">
        COMPLIMENTARY DELIVERY OVER $150 <span>NEW AUTUMN EDIT ONLINE</span>
        {!apiOnline && <span className="api-offline"><WifiOff /> API demo offline · catalogue fallback active</span>}
      </div>
      <header>
        <button className="icon mobile" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu /></button>
        <Link className="logo" to="/">VELORA</Link>
        <nav>
          <NavLink to="/new-arrivals">New</NavLink><NavLink to="/women">Women</NavLink><NavLink to="/men">Men</NavLink>
          <NavLink to="/accessories">Accessories</NavLink><NavLink to="/collections">Collections</NavLink><NavLink to="/journal">Journal</NavLink>
        </nav>
        <div className="actions">
          <Link className="icon desktop" to="/search" aria-label="Search"><Search /></Link>
          <Link className="icon desktop bag" to="/wishlist" aria-label="Wishlist"><Heart /><b>{wishlistCount}</b></Link>
          <Link className="icon desktop" to={user ? '/account' : '/login'} aria-label={user ? 'My account' : 'Sign in'} title={user ? `Signed in as ${user.name}` : 'Sign in'}><User /></Link>
          <button className="icon bag" onClick={openCart} aria-label="Shopping bag"><ShoppingBag /><b>{cartCount}</b></button>
        </div>
      </header>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-head"><Link className="logo" to="/" onClick={close}>VELORA</Link><button className="icon" onClick={close}><X /></button></div>
        <div className="mobile-menu-links">
          <NavLink onClick={close} to="/new-arrivals">New arrivals</NavLink><NavLink onClick={close} to="/women">Women</NavLink><NavLink onClick={close} to="/men">Men</NavLink>
          <NavLink onClick={close} to="/accessories">Accessories</NavLink><NavLink onClick={close} to="/collections">Collections</NavLink><NavLink onClick={close} to="/journal">Journal</NavLink>
          <NavLink onClick={close} to="/search">Search</NavLink><NavLink onClick={close} to="/wishlist">Wishlist ({wishlistCount})</NavLink><NavLink onClick={close} to={user ? '/account' : '/login'}>{user ? 'My account' : 'Sign in'}</NavLink>
          {user?.role === 'admin' && <NavLink onClick={close} to="/admin">Admin studio</NavLink>}
        </div>
      </div>
      {menuOpen && <button className="mobile-menu-scrim" onClick={close} aria-label="Close menu" />}
    </>
  );
}
