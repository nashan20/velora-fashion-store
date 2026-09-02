const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const tokenStore = {
  get: () => localStorage.getItem('veloraToken') || '',
  set: (token) => token ? localStorage.setItem('veloraToken', token) : localStorage.removeItem('veloraToken'),
  clear: () => localStorage.removeItem('veloraToken'),
};

async function request(path, options = {}) {
  const token = tokenStore.get();
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (error) {
    const networkError = new Error('Could not reach the VELORA API. Make sure the backend is running on port 5000.');
    networkError.cause = error;
    throw networkError;
  }

  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
  if (!response.ok) {
    const error = new Error(data?.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  health: () => request('/health'),
  products: () => request('/products'),
  product: (id) => request(`/products/${id}`),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  updateMe: (body) => request('/users/me', { method: 'PUT', body: JSON.stringify(body) }),
  createOrder: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  myOrders: () => request('/orders/mine'),
  order: (id) => request(`/orders/${id}`),
  contact: (body) => request('/contact', { method: 'POST', body: JSON.stringify(body) }),
  newsletter: (body) => request('/newsletter', { method: 'POST', body: JSON.stringify(body) }),
  stripeStatus: () => request('/payments/stripe-status'),
  stripeCheckout: (body) => request('/payments/create-checkout-session', { method: 'POST', body: JSON.stringify(body) }),
  adminStats: () => request('/admin/stats'),
  adminUsers: () => request('/admin/users'),
  adminOrders: () => request('/admin/orders'),
  adminMessages: () => request('/admin/messages'),
  updateOrderStatus: (id, status) => request(`/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  createProduct: (body) => request('/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id, body) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
};

export { API_URL };
