import { Link, useNavigate } from 'react-router-dom';
import { tokenStore } from '../api';

export default function Account({ user, setUser }) {
  const nav = useNavigate();
  const logout = () => {
    tokenStore.clear();
    localStorage.removeItem('veloraUser');
    setUser(null);
    nav('/');
  };
  return (
    <main className="account-page">
      <small>MY VELORA</small>
      <h1>Hello, {user.name}</h1>
      <p>{user.email}</p>
      <div className="dashboard-cards">
        <Link to="/orders"><b>Orders</b><span>Track purchases and order history →</span></Link>
        <Link to="/wishlist"><b>Wishlist</b><span>View your saved pieces →</span></Link>
        <Link to="/profile"><b>Profile</b><span>Manage account information →</span></Link>
        {user.role === 'admin' && <Link to="/admin"><b>Admin studio</b><span>Manage products, orders and customers →</span></Link>}
      </div>
      <button className="outline-btn" onClick={logout}>Sign out</button>
    </main>
  );
}
