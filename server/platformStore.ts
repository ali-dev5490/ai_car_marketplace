import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  Enquiry,
  ModerationAction,
  PaymentSubmission,
  PublicUser,
  User,
} from '../src/types.js';

const LISTING_FEE_PKR = 2000;

function resolvePlatformFile(): string {
  const candidates = [
    path.join(process.cwd(), 'server', 'platform.json'),
    path.join(process.cwd(), 'platform.json'),
  ];
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      // ignore
    }
  }
  return candidates[0];
}

const PLATFORM_FILE = resolvePlatformFile();

interface Session {
  token: string;
  user_id: number;
  created_at: string;
  expires_at: string;
}

interface PlatformData {
  users: User[];
  sessions: Session[];
  payments: PaymentSubmission[];
  enquiries: Enquiry[];
  moderation: ModerationAction[];
  next_ids: {
    user: number;
    payment: number;
    enquiry: number;
    moderation: number;
  };
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const verify = crypto.scryptSync(password, salt, 64).toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verify, 'hex'));
  } catch {
    return false;
  }
}

function toPublicUser(user: User): PublicUser {
  const { password_hash: _, ...rest } = user;
  return rest;
}

function seedData(): PlatformData {
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: 1,
        name: 'Platform Admin',
        email: 'admin@pakcar.local',
        phone: '0300-0000000',
        password_hash: hashPassword('admin123'),
        city: 'Lahore',
        role: 'admin',
        status: 'active',
        created_at: now,
      },
      {
        id: 2,
        name: 'Demo User',
        email: 'demo@pakcar.local',
        phone: '0321-1111111',
        password_hash: hashPassword('demo123'),
        city: 'Lahore',
        role: 'user',
        status: 'active',
        created_at: now,
      },
    ],
    sessions: [],
    payments: [],
    enquiries: [],
    moderation: [],
    next_ids: { user: 3, payment: 1, enquiry: 1, moderation: 1 },
  };
}

class PlatformStore {
  private data: PlatformData;

  constructor() {
    this.data = this.load();
  }

  private load(): PlatformData {
    try {
      if (fs.existsSync(PLATFORM_FILE)) {
        const raw = fs.readFileSync(PLATFORM_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as PlatformData;
        if (parsed?.users?.length) return parsed;
      }
    } catch (err) {
      console.error('Error loading platform store, reseeding...', err);
    }
    const seeded = seedData();
    this.data = seeded;
    this.save();
    console.log('Platform store seeded (admin@pakcar.local / admin123, demo@pakcar.local / demo123)');
    return seeded;
  }

  private save() {
    try {
      const dir = path.dirname(PLATFORM_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(PLATFORM_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving platform store', err);
    }
  }

  getListingFee(): number {
    return LISTING_FEE_PKR;
  }

  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: number): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  signup(input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    city: string;
  }): { user: PublicUser; token: string } {
    const email = input.email.trim().toLowerCase();
    if (this.getUserByEmail(email)) {
      throw Object.assign(new Error('Email already registered'), { status: 409 });
    }
    const user: User = {
      id: this.data.next_ids.user++,
      name: input.name.trim(),
      email,
      phone: input.phone.trim(),
      password_hash: hashPassword(input.password),
      city: input.city.trim() || 'Lahore',
      role: 'user',
      status: 'active',
      created_at: new Date().toISOString(),
    };
    this.data.users.push(user);
    const token = this.createSession(user.id);
    this.save();
    return { user: toPublicUser(user), token };
  }

  login(email: string, password: string): { user: PublicUser; token: string } {
    const user = this.getUserByEmail(email.trim());
    if (!user || !verifyPassword(password, user.password_hash)) {
      throw Object.assign(new Error('Invalid email or password'), { status: 401 });
    }
    if (user.status === 'blocked' || user.status === 'suspended') {
      throw Object.assign(new Error(`Account is ${user.status}`), { status: 403 });
    }
    const token = this.createSession(user.id);
    this.save();
    return { user: toPublicUser(user), token };
  }

  private createSession(userId: number): string {
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    this.data.sessions = this.data.sessions.filter((s) => new Date(s.expires_at).getTime() > now);
    this.data.sessions.push({
      token,
      user_id: userId,
      created_at: new Date(now).toISOString(),
      expires_at: new Date(now + 1000 * 60 * 60 * 24 * 14).toISOString(),
    });
    return token;
  }

  logout(token: string) {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.save();
  }

  getUserByToken(token: string | undefined | null): PublicUser | null {
    if (!token) return null;
    const session = this.data.sessions.find((s) => s.token === token);
    if (!session) return null;
    if (new Date(session.expires_at).getTime() < Date.now()) {
      this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
      this.save();
      return null;
    }
    const user = this.getUserById(session.user_id);
    if (!user || user.status === 'blocked') return null;
    return toPublicUser(user);
  }

  updateUser(
    id: number,
    patch: Partial<Pick<User, 'name' | 'phone' | 'city' | 'status'>>
  ): PublicUser | undefined {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...patch, id };
    this.save();
    return toPublicUser(this.data.users[idx]);
  }

  createPayment(input: {
    user_id: number;
    listing_id: number;
    amount?: number;
    method: string;
    receipt_note?: string;
    receipt_url?: string;
  }): PaymentSubmission {
    const payment: PaymentSubmission = {
      id: this.data.next_ids.payment++,
      user_id: input.user_id,
      listing_id: input.listing_id,
      amount: input.amount ?? LISTING_FEE_PKR,
      method: input.method,
      receipt_note: input.receipt_note || '',
      receipt_url: input.receipt_url || '',
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    this.data.payments.unshift(payment);
    this.save();
    return payment;
  }

  getPayments(filter?: { user_id?: number; status?: string }): PaymentSubmission[] {
    let list = [...this.data.payments];
    if (filter?.user_id != null) list = list.filter((p) => p.user_id === filter.user_id);
    if (filter?.status) list = list.filter((p) => p.status === filter.status);
    return list;
  }

  getPaymentById(id: number): PaymentSubmission | undefined {
    return this.data.payments.find((p) => p.id === id);
  }

  reviewPayment(
    id: number,
    adminId: number,
    status: 'paid' | 'rejected',
    note?: string
  ): PaymentSubmission | undefined {
    const idx = this.data.payments.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    this.data.payments[idx] = {
      ...this.data.payments[idx],
      status,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      admin_note: note || '',
    };
    this.save();
    return this.data.payments[idx];
  }

  createEnquiry(input: {
    buyer_id: number;
    listing_id: number;
    message: string;
    buyer_name: string;
    buyer_phone: string;
  }): Enquiry {
    const enquiry: Enquiry = {
      id: this.data.next_ids.enquiry++,
      buyer_id: input.buyer_id,
      listing_id: input.listing_id,
      message: input.message.trim(),
      buyer_name: input.buyer_name,
      buyer_phone: input.buyer_phone,
      status: 'open',
      created_at: new Date().toISOString(),
    };
    this.data.enquiries.unshift(enquiry);
    this.save();
    return enquiry;
  }

  getEnquiries(filter?: { buyer_id?: number; listing_ids?: number[] }): Enquiry[] {
    let list = [...this.data.enquiries];
    if (filter?.buyer_id != null) list = list.filter((e) => e.buyer_id === filter.buyer_id);
    if (filter?.listing_ids) {
      const set = new Set(filter.listing_ids);
      list = list.filter((e) => set.has(e.listing_id));
    }
    return list;
  }

  addModeration(input: {
    admin_id: number;
    target_type: 'user' | 'listing' | 'payment';
    target_id: number;
    action: string;
    reason: string;
  }): ModerationAction {
    const action: ModerationAction = {
      id: this.data.next_ids.moderation++,
      ...input,
      created_at: new Date().toISOString(),
    };
    this.data.moderation.unshift(action);
    this.save();
    return action;
  }
}

export const platformStore = new PlatformStore();
export { toPublicUser, LISTING_FEE_PKR };
