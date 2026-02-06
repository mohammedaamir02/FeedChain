const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const DEMO_MODE = true; // TEMPORARY: Set to false to use real API

function getToken(): string | null {
  return localStorage.getItem('feedchain_token');
}

// Mock data for demo mode
const MOCK_FOOD_POSTS: FoodPost[] = [
  {
    id: 'mock-post-1',
    donor_id: 'demo-0000-0000-0000-000000000000',
    food_type: 'Pizza',
    quantity: '5 boxes',
    expiry_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    pickup_lat: 12.9716,
    pickup_lng: 77.5946,
    status: 'available',
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-post-2',
    donor_id: 'demo-0000-0000-0000-000000000000',
    food_type: 'Rice & Vegetables',
    quantity: '10 kg',
    expiry_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    pickup_lat: 12.9352,
    pickup_lng: 77.6245,
    status: 'claimed',
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
];

const MOCK_CLAIMS: Claim[] = [
  {
    id: 'mock-claim-1',
    food_post_id: 'mock-post-2',
    ngo_id: 'mock-ngo-1',
    status: 'picked',
    claimed_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    picked_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    people_served: 25,
    distribution_location: 'Community Center',
  },
];

const MOCK_IMPACT: ImpactSummary = {
  meals_served: 1250,
  active_ngos: 8,
  successful_distributions: 94,
};

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // In demo mode, return mock data for protected endpoints
  if (DEMO_MODE && path !== '/auth/register' && path !== '/auth/login') {
    // Return mock data based on the endpoint
    if (path === '/auth/me') {
      return { user_id: 'demo-0000-0000-0000-000000000000', role: 'donor' } as T;
    }
    if (path === '/food-posts/my') {
      return MOCK_FOOD_POSTS as T;
    }
    if (path === '/claims/my') {
      return MOCK_CLAIMS as T;
    }
    if (path === '/impact/summary') {
      return MOCK_IMPACT as T;
    }
    if (path === '/admin/overview') {
      return { food_posts: MOCK_FOOD_POSTS, claims: MOCK_CLAIMS } as T;
    }
    // Return empty array or object for other GET requests
    if (options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'DELETE') {
      return [] as T;
    }
    // Return success for mutations
    return { message: 'Success (demo mode)' } as T;
  }

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
