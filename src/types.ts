/**
 * Types for the AI Car Marketplace Applet
 */

export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'blocked';
export type ListingStatus =
  | 'draft'
  | 'pending_payment'
  | 'pending_review'
  | 'active'
  | 'paused'
  | 'sold'
  | 'suspended';
export type ListingPaymentStatus = 'unpaid' | 'pending' | 'paid' | 'rejected';
export type PaymentReviewStatus = 'pending' | 'paid' | 'rejected';
export type EnquiryStatus = 'open' | 'closed';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  city: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export type PublicUser = Omit<User, 'password_hash'>;

export interface PaymentSubmission {
  id: number;
  user_id: number;
  listing_id: number;
  amount: number;
  method: string;
  receipt_note: string;
  receipt_url: string;
  status: PaymentReviewStatus;
  created_at: string;
  reviewed_by?: number;
  reviewed_at?: string;
  admin_note?: string;
}

export interface Enquiry {
  id: number;
  buyer_id: number;
  listing_id: number;
  buyer_name: string;
  buyer_phone: string;
  message: string;
  status: EnquiryStatus;
  created_at: string;
}

export interface ModerationAction {
  id: number;
  admin_id: number;
  target_type: 'user' | 'listing' | 'payment';
  target_id: number;
  action: string;
  reason: string;
  created_at: string;
}

export interface Car {
  id: number;
  make: string;
  model: string;
  variant: string;
  year: number;
  city: string;
  country?: string;
  state?: string;
  address?: string;
  price: number; // in PKR
  engine_cc: number;
  transmission: 'Automatic' | 'Manual';
  fuel: 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric';
  mileage: number; // in km
  color: string;
  body_type: 'Sedan' | 'Hatchback' | 'SUV' | 'Crossover' | 'Compact' | 'Van' | 'Luxury';
  registered_city: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Need Work';
  seller_name: string;
  phone: string;
  description: string;
  features: string[]; // JSON array of features
  images: string[]; // JSON array of image URLs
  created_at: string;
  /** Phase 2 ownership / moderation */
  owner_user_id?: number | null;
  status?: ListingStatus;
  payment_status?: ListingPaymentStatus;
  moderation_reason?: string;
}

export interface AISearchResponse {
  filters: Partial<Record<keyof Car, any>> & {
    priceMin?: number;
    priceMax?: number;
    yearMin?: number;
    yearMax?: number;
    mileageMax?: number;
  };
  results: Car[];
  reasoning: string;
  confidence: number;
  suggestedQueries?: string[];
}

export interface AIAnalysisResponse {
  make: string;
  model: string;
  variant: string;
  estimated_year: number;
  body_type: string;
  fuel: string;
  transmission: 'Automatic' | 'Manual';
  mileage_estimate: number;
  color: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Need Work';
  features: string[];
  suggested_price: {
    estimatedPrice: number;
    marketRangeMin: number;
    marketRangeMax: number;
    confidence: number;
  };
  seo_title: string;
  description: string;
  market_analysis: string;
  confidence_score: number;
  inspection: {
    engine: number; // 0-100
    body: number; // 0-100
    interior: number; // 0-100
    exterior: number; // 0-100
    tyres: number; // 0-100
    overallScore: number; // 0-100
    grade: string; // e.g. "Excellent Vehicle"
  };
}

export interface SellerDashboardStats {
  posted_cars_count: number;
  views_count: number;
  favorites_count: number;
  messages_count: number;
  lead_count: number;
  recent_leads: Array<{
    id: number;
    car_id: number;
    car_title: string;
    buyer_name: string;
    buyer_phone: string;
    message: string;
    created_at: string;
  }>;
}

export interface AdminDashboardStats {
  total_cars: number;
  average_price: number;
  active_listings: number;
  most_popular_brand: string;
  most_popular_city: string;
  brand_distribution: Array<{ name: string; value: number }>;
  body_type_distribution: Array<{ name: string; value: number }>;
  year_distribution: Array<{ name: string; value: number }>;
  city_distribution: Array<{ name: string; value: number }>;
  price_distribution: Array<{ name: string; value: number }>;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedPrompts?: string[];
  results?: Car[];
}

export interface ChatHistoryTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface AIChatResponse {
  reply: string;
  suggestedPrompts: string[];
  results?: Car[];
  includeListings?: boolean;
}
