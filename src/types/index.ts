// ─── User & Auth ────────────────────────────────────────────────────────────
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'customer' | 'admin';
  avatar_url?: string;
  created_at: string;
}

// ─── Products ────────────────────────────────────────────────────────────────
export type ProductCategory = 'Classic' | 'Gourmet' | 'Designer' | 'Desserts' | 'Cookies';

export interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  category: ProductCategory;
  image_url: string;
  rating: number;
  review_count: number;
  is_bestseller: boolean;
  is_available: boolean;
  weight_kg: number; // base weight for ingredient calculation
  created_at: string;
}

// ─── Cake Customization ──────────────────────────────────────────────────────
export type CakeFlavor = 'Chocolate' | 'Vanilla' | 'RedVelvet' | 'Strawberry' | 'Lemon' | 'Mango';
export type CakeTier = 1 | 2 | 3;
export type CakeTopping = 'Berries' | 'Sprinkles' | 'Flowers' | 'Drizzle' | 'Macarons' | 'None';
export type CakeFrosting = 'Buttercream' | 'Whipped' | 'Fondant' | 'Naked';
export type CakeSize = 'Small (0.5kg)' | 'Medium (1kg)' | 'Large (2kg)' | 'XLarge (3kg)';

export interface CakeCustomization {
  flavor: CakeFlavor;
  tiers: CakeTier;
  topping: CakeTopping;
  frosting: CakeFrosting;
  size: CakeSize;
  message?: string;
  deliveryDate?: string;
}

// ─── Cart ────────────────────────────────────────────────────────────────────
export interface CartItem {
  id: string;
  product?: Product;
  customization?: CakeCustomization;
  quantity: number;
  unit_price: number;
  is_custom: boolean;
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export type OrderStatus = 'pending' | 'confirmed' | 'baking' | 'ready' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  happy_hour_discount?: number;
  delivery_address?: string;
  delivery_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  profile?: Profile;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  customization?: CakeCustomization;
  quantity: number;
  unit_price: number;
  is_custom: boolean;
  product?: Product;
}

// ─── Inventory ───────────────────────────────────────────────────────────────
export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_threshold: number;
  max_capacity: number;
  unit_cost: number;
  supplier?: string;
  last_restocked?: string;
  updated_at: string;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  user_id: string;
  product_id?: string;
  rating: number;
  comment: string;
  image_url?: string;
  is_approved: boolean;
  created_at: string;
  profile?: Profile;
  product?: Product;
}

// ─── Happy Hour ──────────────────────────────────────────────────────────────
export interface HappyHour {
  id: string;
  name: string;
  discount_percent: number;
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  days_of_week: number[]; // 0=Sun, 1=Mon, ...
  is_active: boolean;
  created_at: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
  avg_order_value: number;
}

export interface DemandForecast {
  product_name: string;
  current_demand: number;
  predicted_demand: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
}

export interface InventoryAlert {
  id: string;
  ingredient: InventoryItem;
  type: 'low_stock' | 'out_of_stock';
  message: string;
  is_read: boolean;
  created_at: string;
}

// ─── Dashboard KPIs ──────────────────────────────────────────────────────────
export interface DashboardKPIs {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  lowStockCount: number;
  revenueGrowth: number;
  ordersGrowth: number;
}
