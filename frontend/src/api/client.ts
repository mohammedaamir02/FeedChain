const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

function getToken(): string | null {
  return localStorage.getItem('feedchain_token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem('feedchain_token');
    localStorage.removeItem('feedchain_user');
    window.dispatchEvent(new Event('feedchain_unauthorized'));
  }

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(res.ok ? text : `Request failed: ${res.status}`);
  }

  if (!res.ok) {
    const detail = typeof (data as { detail?: string })?.detail === 'string'
      ? (data as { detail: string }).detail
      : JSON.stringify((data as { detail?: unknown })?.detail ?? 'Request failed');
    throw new Error(detail);
  }

  return data as T;
}

export type LoginResponse = {
  access_token: string;
  token_type: string;
  user_id: string;
  role: 'donor' | 'ngo' | 'admin';
};

export type User = { user_id: string; role: 'donor' | 'ngo' | 'admin' };

export type FoodPost = {
  id: string;
  donor_id: string;
  food_type: string;
  quantity: string;
  expiry_time: string;
  pickup_lat?: number;
  pickup_lng?: number;
  status: string;
  created_at?: string;
};

export type Claim = {
  id: string;
  food_post_id: string;
  ngo_id: string;
  status: string;
  claimed_at: string;
  picked_at?: string;
  distributed_at?: string;
  people_served?: number;
  distribution_location?: string;
  food_posts?: FoodPost | FoodPost[] | null;
};

export type ImpactSummary = {
  meals_served: number;
  active_ngos: number;
  successful_distributions: number;
};

export type RegisterResponse = {
  message: string;
  user_id: string;
  email: string;
  role: string;
};

export const auth = {
  register: (body: { email: string; password: string; role: 'donor' | 'ngo' | 'admin' }) =>
    api<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  loginWithPassword: (email: string, password: string) =>
    api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  loginWithRole: (role: 'donor' | 'ngo' | 'admin') =>
    api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),
  me: () => api<User>('/auth/me'),
};

export const foodPosts = {
  create: (body: {
    food_type: string;
    quantity: string;
    expiry_time: string;
    pickup_lat?: number;
    pickup_lng?: number;
  }) => api<FoodPost>('/food-posts', { method: 'POST', body: JSON.stringify(body) }),
  my: () => api<FoodPost[]>('/food-posts/my'),
  get: (id: string) => api<FoodPost>(`/food-posts/${id}`),
  nearby: (lat: number, lng: number) =>
    api<FoodPost[]>(
      `/food-posts/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`
    ),
};

export const claims = {
  claim: (postId: string) =>
    api<{ message: string }>(`/food-posts/${postId}/claim`, { method: 'POST' }),
  my: () => api<Claim[]>('/claims/my'),
  cancel: (claimId: string) =>
    api<{ message: string }>(`/claims/${claimId}/cancel`, { method: 'POST' }),
  pickup: (claimId: string) =>
    api<{ message: string; otp_for_demo?: string }>(
      `/claims/${claimId}/pickup`,
      { method: 'POST' }
    ),
  verify: (claimId: string, otp: string) =>
    api<{ message: string }>(`/claims/${claimId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ otp }),
    }),
};

export const distribution = {
  distribute: (
    claimId: string,
    body: { people_served: number; location?: string }
  ) =>
    api<{ message: string }>(`/claims/${claimId}/distribute`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export const impact = {
  summary: () => api<ImpactSummary>('/impact/summary'),
};

export const admin = {
  overview: () =>
    api<{ food_posts: FoodPost[]; claims: Claim[] }>('/admin/overview'),
};
