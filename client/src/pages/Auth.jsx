import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, tokenStore } from '../api';

export default function Auth({ mode = 'login', setUser }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/account';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = mode === 'register' ? await api.register(form) : await api.login({ email: form.email, password: form.password });
      tokenStore.set(result.token);
      localStorage.setItem('veloraUser', JSON.stringify(result.user));
      setUser(result.user);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const fillAdmin = () => setForm({ name: '', email: 'admin@velora.demo', password: 'VeloraAdmin123!' });
  const switchPath = mode === 'login' ? '/register' : '/login';
  const switchLabel = mode === 'login' ? 'New to VELORA? Create account' : 'Already registered? Sign in';
  const nextQuery = next && next !== '/account' ? `?next=${encodeURIComponent(next)}` : '';

  return (
    <main className="auth-page">
      <form onSubmit={submit}>
        <small>VELORA MEMBERS</small>
        <h1>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <p>{mode === 'login' ? 'Access your orders, wishlist and saved details.' : 'Join VELORA for faster checkout and order history.'}</p>
        {mode === 'register' && <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
        <input required type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input required minLength="6" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="auth-error">{error}</p>}
        <button disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        <Link to={`${switchPath}${nextQuery}`}>{switchLabel}</Link>
        {mode === 'login' && <button type="button" className="demo-admin-btn" onClick={fillAdmin}>Fill admin demo credentials</button>}
        <small className="demo-note">Full-stack authentication: passwords are hashed on the Express server and sessions use JWT. Add MongoDB Atlas to persist accounts across server restarts.</small>
      </form>
    </main>
  );
}
