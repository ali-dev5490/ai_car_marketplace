import type { Car, Enquiry, PaymentSubmission, PublicUser } from '../types';

const TOKEN_KEY = 'pakcar_auth_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function authHeaders(extra: HeadersInit = {}): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as any).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function apiSignup(body: {
  name: string;
  email: string;
  phone: string;
  password: string;
  city: string;
}): Promise<{ user: PublicUser; token: string }> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseJson(res);
}

export async function apiLogin(email: string, password: string): Promise<{ user: PublicUser; token: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return parseJson(res);
}

export async function apiLogout() {
  const res = await fetch('/api/auth/logout', { method: 'POST', headers: authHeaders() });
  setToken(null);
  return parseJson(res);
}

export async function apiMe(): Promise<{ user: PublicUser; listing_fee_pkr: number }> {
  const res = await fetch('/api/auth/me', { headers: authHeaders() });
  return parseJson(res);
}

export async function apiUpdateProfile(body: Partial<Pick<PublicUser, 'name' | 'phone' | 'city'>>) {
  const res = await fetch('/api/auth/profile', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return parseJson<{ user: PublicUser }>(res);
}

export async function apiMyListings(): Promise<Car[]> {
  const res = await fetch('/api/cars?mine=1', { headers: authHeaders() });
  return parseJson(res);
}

export async function apiCreateListing(body: Partial<Car>): Promise<Car> {
  const res = await fetch('/api/cars', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return parseJson(res);
}

export async function apiUpdateListing(id: number, body: Partial<Car>): Promise<Car> {
  const res = await fetch(`/api/cars/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return parseJson(res);
}

export async function apiDeleteListing(id: number) {
  const res = await fetch(`/api/cars/${id}`, { method: 'DELETE', headers: authHeaders() });
  return parseJson(res);
}

export async function apiPaymentFee() {
  const res = await fetch('/api/payments/fee');
  return parseJson<{
    listing_fee_pkr: number;
    instructions: Record<string, string>;
  }>(res);
}

export async function apiPayments(): Promise<PaymentSubmission[]> {
  const res = await fetch('/api/payments', { headers: authHeaders() });
  return parseJson(res);
}

export async function apiSubmitPayment(body: {
  listing_id: number;
  method: string;
  receipt_note: string;
  receipt_url?: string;
}): Promise<PaymentSubmission> {
  const res = await fetch('/api/payments', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return parseJson(res);
}

export async function apiReviewPayment(id: number, status: 'paid' | 'rejected', note?: string) {
  const res = await fetch(`/api/payments/${id}/review`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ status, note }),
  });
  return parseJson(res);
}

export async function apiEnquiries(): Promise<Enquiry[]> {
  const res = await fetch('/api/enquiries', { headers: authHeaders() });
  return parseJson(res);
}

export async function apiCreateEnquiry(listing_id: number, message: string): Promise<Enquiry> {
  const res = await fetch('/api/enquiries', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ listing_id, message }),
  });
  return parseJson(res);
}

export async function apiAdminOverview() {
  const res = await fetch('/api/admin/overview', { headers: authHeaders() });
  return parseJson<Record<string, number>>(res);
}

export async function apiAdminUsers(filter = 'all') {
  const res = await fetch(`/api/admin/users?filter=${encodeURIComponent(filter)}`, {
    headers: authHeaders(),
  });
  return parseJson(res);
}

export async function apiAdminUserStatus(id: number, status: string, reason: string) {
  const res = await fetch(`/api/admin/users/${id}/status`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ status, reason }),
  });
  return parseJson(res);
}

export async function apiAdminModerateListing(id: number, action: string, reason: string) {
  const res = await fetch(`/api/admin/listings/${id}/moderate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ action, reason }),
  });
  return parseJson(res);
}

export async function apiAdminListings(): Promise<Car[]> {
  const res = await fetch('/api/cars?all=1', { headers: authHeaders() });
  return parseJson(res);
}
