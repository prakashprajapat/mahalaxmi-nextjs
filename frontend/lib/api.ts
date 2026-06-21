const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

async function request<T>(
  path: string,
  options?: RequestInit,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'API error');
  }
  return res.json();
}

// ── Products ─────────────────────────────────────────────────────────────────
export const productsApi = {
  getAll: (params?: {
    category?: string;
    subcategory?: string;
    bestSeller?: boolean;
    page?: number;
    pageSize?: number;
  }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return request<{ success: boolean; products: import('@/types').Product[]; total: number }>(
      `/products${qs ? '?' + qs : ''}`
    );
  },
  getById: (id: number) =>
    request<{ success: boolean; product: import('@/types').Product }>(`/products/${id}`),
  bulkSave: (products: unknown[], token: string) =>
    request('/products', { method: 'POST', body: JSON.stringify({ products }) }, token),
  update: (id: number, data: unknown, token: string) =>
    request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  delete: (id: number, token: string) =>
    request(`/products/${id}`, { method: 'DELETE' }, token),
};

// ── Orders ───────────────────────────────────────────────────────────────────
export const ordersApi = {
  getAll: (params?: { customerId?: string; email?: string; phone?: string }, token?: string) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => v).map(([k, v]) => [k, v!])
    ).toString();
    return request<{ success: boolean; orders: import('@/types').Order[] }>(
      `/orders${qs ? '?' + qs : ''}`,
      undefined,
      token
    );
  },
  getById: (id: string, token?: string) =>
    request<{ success: boolean; order: import('@/types').Order }>(`/orders/${id}`, undefined, token),
  place: (order: unknown) =>
    request<{ success: boolean; orderId: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    }),
  cancel: (orderId: string, token: string) =>
    request(`/orders/${orderId}/cancel`, { method: 'PATCH' }, token),
  requestReturn: (orderId: string, reason: string, token: string) =>
    request(`/orders/${orderId}/return`, { method: 'POST', body: JSON.stringify({ reason }) }, token),
  getByCustomer: (token: string) =>
    request<{ success: boolean; orders: import('@/types').Order[] }>('/orders/my', undefined, token),
  updateStatus: (data: { orderId: string; status: string; awb?: string }, token: string) =>
    request('/orders/status', { method: 'PATCH', body: JSON.stringify(data) }, token),
};

// ── Customers ────────────────────────────────────────────────────────────────
export const customersApi = {
  register: (data: unknown) =>
    request<{ success: boolean; token: string; customer: import('@/types').Customer }>(
      '/customers/register', { method: 'POST', body: JSON.stringify(data) }
    ),
  login: (data: { email: string; password: string }) =>
    request<{ success: boolean; token: string; customer: import('@/types').Customer }>(
      '/customers/login', { method: 'POST', body: JSON.stringify(data) }
    ),
  sendOtp: (phone: string, purpose = 'login') =>
    request('/customers/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, purpose }),
    }),
  verifyOtp: (phone: string, otp: string) =>
    request<{ success: boolean; token?: string; customer?: import('@/types').Customer; newUser?: boolean }>(
      '/customers/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp }) }
    ),
  updateProfile: (id: number, data: unknown, token: string) =>
    request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  getAll: (token: string, params?: { search?: string; page?: number }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString();
    return request<{ success: boolean; customers: import('@/types').Customer[]; total: number }>(
      `/customers${qs ? '?' + qs : ''}`, undefined, token
    );
  },
};

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  adminLogin: (email: string, password: string) =>
    request<{ success: boolean; token: string }>('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: (token: string) => request<{ success: boolean; email: string; role: string }>('/auth/me', undefined, token),
};

// ── Settings ─────────────────────────────────────────────────────────────────
export const settingsApi = {
  getAll: () => request<{ success: boolean; settings: Record<string, string> }>('/settings'),
  upsert: (key: string, value: string, token: string) =>
    request(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }, token),
  bulkUpsert: (settings: Record<string, string>, token: string) =>
    request('/settings/bulk', { method: 'POST', body: JSON.stringify(settings) }, token),
};

// ── Payments ─────────────────────────────────────────────────────────────────
export const paymentsApi = {
  createOrder: (data: unknown) =>
    request<{ success: boolean; orderId: string; localOrderId: string; keyId: string; amountPaise: number }>(
      '/payments/create-order', { method: 'POST', body: JSON.stringify(data) }
    ),
  verify: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    request('/payments/verify', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviewsApi = {
  getPending: (token: string) =>
    request<{ success: boolean; reviews: import('@/types').Review[] }>('/reviews/pending', undefined, token),
  getByProduct: (productId: number) =>
    request<{ success: boolean; reviews: import('@/types').Review[] }>(`/reviews/product/${productId}`),
  submit: (data: { productId: number; rating: number; text: string; orderId?: string }, token: string) =>
    request<{ success: boolean }>('/reviews', { method: 'POST', body: JSON.stringify(data) }, token),
  approve: (id: number, token: string) =>
    request(`/reviews/${id}/approve`, { method: 'PATCH' }, token),
  reject: (id: number, token: string) =>
    request(`/reviews/${id}/reject`, { method: 'PATCH' }, token),
  delete: (id: number, token: string) =>
    request(`/reviews/${id}`, { method: 'DELETE' }, token),
};
