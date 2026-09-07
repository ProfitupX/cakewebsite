import { supabase } from './supabase';
import type { 
  Order, Product, InventoryItem, Review, HappyHour, 
  OrderItem, Profile, CakeCustomization
} from '../types';

// ─── Products ────────────────────────────────────────────────────────────────
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_available', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Product[];
}

export async function getProductsByCategory(category: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .eq('is_available', true);
  if (error) throw error;
  return data as Product[];
}

export async function getBestsellers() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_bestseller', true)
    .eq('is_available', true)
    .limit(6);
  if (error) throw error;
  return data as Product[];
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export async function createOrder(
  userId: string | null,
  items: Array<{ product_id?: string; customization?: CakeCustomization; quantity: number; unit_price: number; is_custom: boolean }>,
  totalAmount: number,
  happyHourDiscount?: number,
  notes?: string,
  deliveryDate?: string
) {
  // 1. Create order with client-generated UUID
  const orderId = crypto.randomUUID();
  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      id: orderId,
      user_id: userId || null,
      status: 'pending',
      total_amount: totalAmount,
      happy_hour_discount: happyHourDiscount || 0,
      notes,
      delivery_date: deliveryDate,
    });
  if (orderError) throw orderError;

  // 2. Insert order items
  const orderItems = items.map(item => ({
    order_id: orderId,
    product_id: item.product_id || null,
    customization: item.customization || null,
    quantity: item.quantity,
    unit_price: item.unit_price,
    is_custom: item.is_custom,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);
  if (itemsError) throw itemsError;

  // 3. Deduct inventory based on order
  await deductInventoryForOrder(items);

  return { id: orderId } as Order;
}

export async function getOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching full orders, trying fallback:', error);
    const { data: fallback, error: fallbackErr } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (fallbackErr) {
      console.error('Fallback orders fetch error:', fallbackErr);
      throw fallbackErr;
    }
    return (fallback || []).map(o => ({ ...o, items: [] })) as Order[];
  }

  return (data || []).map(o => ({
    ...o,
    items: o.order_items || [],
  })) as Order[];
}

export async function getUserOrders(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`*, items:order_items(*, product:products(*))`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Order[];
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId);
  if (error) throw error;
}

// ─── Inventory ───────────────────────────────────────────────────────────────
export async function getInventory() {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .order('name');
  if (error) throw error;
  return data as InventoryItem[];
}

export async function updateInventoryStock(id: string, newStock: number) {
  const { error } = await supabase
    .from('inventory')
    .update({ current_stock: newStock, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// Auto-deduct ingredients when order is placed
async function deductInventoryForOrder(
  items: Array<{ product_id?: string; customization?: CakeCustomization; quantity: number; is_custom: boolean }>
) {
  const { data: inventory } = await supabase.from('inventory').select('*');
  if (!inventory) return;

  // Ingredient requirements per kg of cake
  const ingredientMap: Record<string, Record<string, number>> = {
    'flour': { base: 0.4 },       // 400g per kg
    'sugar': { base: 0.3 },       // 300g per kg
    'butter': { base: 0.2 },      // 200g per kg
    'eggs': { base: 3 },          // 3 eggs per kg
    'milk': { base: 0.2 },        // 200ml per kg
    'cocoa_powder': { base: 0.05 }, // 50g per kg for chocolate
  };

  for (const item of items) {
    let weightKg = 1; // default
    if (item.customization?.size) {
      const sizeMap: Record<string, number> = {
        'Small (0.5kg)': 0.5,
        'Medium (1kg)': 1,
        'Large (2kg)': 2,
        'XLarge (3kg)': 3,
      };
      weightKg = sizeMap[item.customization.size] || 1;
    }
    const totalWeight = weightKg * item.quantity;

    // Deduct flour, sugar, butter for every cake
    for (const invItem of inventory) {
      const slug = invItem.name.toLowerCase().replace(/\s+/g, '_');
      let deductAmount = 0;

      if (slug.includes('flour')) deductAmount = ingredientMap.flour.base * totalWeight;
      else if (slug.includes('sugar')) deductAmount = ingredientMap.sugar.base * totalWeight;
      else if (slug.includes('butter')) deductAmount = ingredientMap.butter.base * totalWeight;
      else if (slug.includes('egg')) deductAmount = ingredientMap.eggs.base * totalWeight;
      else if (slug.includes('milk')) deductAmount = ingredientMap.milk.base * totalWeight;
      else if (slug.includes('cocoa') && item.customization?.flavor === 'Chocolate') {
        deductAmount = ingredientMap.cocoa_powder.base * totalWeight;
      }

      if (deductAmount > 0) {
        const newStock = Math.max(0, invItem.current_stock - deductAmount);
        await supabase
          .from('inventory')
          .update({ current_stock: newStock, updated_at: new Date().toISOString() })
          .eq('id', invItem.id);
      }
    }
  }
}

export async function restockIngredient(id: string, amount: number) {
  const { data: item } = await supabase.from('inventory').select('*').eq('id', id).single();
  if (!item) return;
  const newStock = Math.min(item.current_stock + amount, item.max_capacity);
  await updateInventoryStock(id, newStock);
}

// ─── Reviews ─────────────────────────────────────────────────────────────────
export async function getApprovedReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select(`*, profile:profiles(full_name, avatar_url), product:products(name)`)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data as Review[];
}

export async function submitReview(
  userId: string,
  rating: number,
  comment: string,
  productId?: string,
  imageUrl?: string
) {
  const { error } = await supabase.from('reviews').insert({
    user_id: userId,
    product_id: productId || null,
    rating,
    comment,
    image_url: imageUrl || null,
    is_approved: false, // admin needs to approve
  });
  if (error) throw error;
}

export async function approveReview(id: string) {
  await supabase.from('reviews').update({ is_approved: true }).eq('id', id);
}

// ─── Happy Hours ─────────────────────────────────────────────────────────────
export async function getActiveHappyHours() {
  const { data, error } = await supabase
    .from('happy_hours')
    .select('*')
    .eq('is_active', true);
  if (error) throw error;
  return data as HappyHour[];
}

export async function getAllHappyHours() {
  const { data, error } = await supabase.from('happy_hours').select('*').order('start_time');
  if (error) throw error;
  return data as HappyHour[];
}

export async function upsertHappyHour(happyHour: Partial<HappyHour>) {
  if (happyHour.id) {
    const { error } = await supabase.from('happy_hours').update(happyHour).eq('id', happyHour.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('happy_hours').insert(happyHour);
    if (error) throw error;
  }
}

// ─── Profiles ────────────────────────────────────────────────────────────────
export async function getProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) return null;
  return data as Profile;
}

export async function upsertProfile(profile: Partial<Profile>) {
  const { error } = await supabase.from('profiles').upsert(profile);
  if (error) throw error;
}

// ─── Analytics (Sales Data) ───────────────────────────────────────────────────
export async function getSalesData(days = 30) {
  const from = new Date();
  from.setDate(from.getDate() - days);
  const { data, error } = await supabase
    .from('orders')
    .select('created_at, total_amount, status')
    .gte('created_at', from.toISOString())
    .neq('status', 'cancelled')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getDashboardKPIs() {
  const today = new Date();
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0).toISOString();

  const [currentOrders, lastMonthOrders, pendingOrders, lowStockItems] = await Promise.all([
    supabase.from('orders').select('total_amount').gte('created_at', thisMonthStart).neq('status', 'cancelled'),
    supabase.from('orders').select('total_amount').gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd).neq('status', 'cancelled'),
    supabase.from('orders').select('id').eq('status', 'pending'),
    supabase.from('inventory').select('id').filter('current_stock', 'lte', 'min_threshold'),
  ]);

  const currentRevenue = (currentOrders.data || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const lastRevenue = (lastMonthOrders.data || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const revenueGrowth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;
  const currentCount = currentOrders.data?.length || 0;
  const lastCount = lastMonthOrders.data?.length || 0;
  const ordersGrowth = lastCount > 0 ? ((currentCount - lastCount) / lastCount) * 100 : 0;

  return {
    totalRevenue: currentRevenue,
    totalOrders: currentCount,
    pendingOrders: pendingOrders.data?.length || 0,
    lowStockCount: lowStockItems.data?.length || 0,
    revenueGrowth,
    ordersGrowth,
  };
}
