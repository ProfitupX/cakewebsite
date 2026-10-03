import { supabase } from './supabase';
import { calculateCakeRequirementsWithAI } from './gemini';
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

// Auto-deduct ingredients using AI calculation when order is placed
export async function deductInventoryForOrder(
  items: Array<{ product_id?: string; customization?: CakeCustomization; quantity: number; is_custom: boolean }>
) {
  try {
    const { data: inventory, error: invError } = await supabase.from('inventory').select('*');
    if (invError || !inventory || inventory.length === 0) {
      console.warn('Inventory fetch error or empty, skipping live deduction:', invError);
      return;
    }

    // Cumulative deduction map for all items in the order
    const totalDeductions: Record<string, number> = {};

    for (const item of items) {
      let cakeName = 'Custom Cake';
      let weightKg = 1;
      let flavor = 'Vanilla';
      let tiers = 1;
      let frosting = 'Buttercream';
      let topping = 'None';
      let notes = '';

      if (item.is_custom && item.customization) {
        flavor = item.customization.flavor;
        tiers = item.customization.tiers;
        frosting = item.customization.frosting;
        topping = item.customization.topping;
        notes = item.customization.message || '';
        const sizeMap: Record<string, number> = {
          'Small (0.5kg)': 0.5,
          'Medium (1kg)': 1,
          'Large (2kg)': 2,
          'XLarge (3kg)': 3,
        };
        weightKg = sizeMap[item.customization.size] || 1;
        cakeName = `${flavor} Cake (${item.customization.size})`;
      } else if (item.product_id) {
        // Query or match catalog product name
        const { data: prod } = await supabase.from('products').select('*').eq('id', item.product_id).single();
        if (prod) {
          cakeName = prod.name;
          weightKg = prod.weight_kg || 1;
          flavor = prod.name.includes('Chocolate') ? 'Chocolate' : (prod.name.includes('Velvet') ? 'RedVelvet' : (prod.name.includes('Mango') ? 'Mango' : (prod.name.includes('Lemon') ? 'Lemon' : (prod.name.includes('Strawberry') ? 'Strawberry' : 'Vanilla'))));
        }
      }

      // Calculate AI requirements for this cake
      const calculation = await calculateCakeRequirementsWithAI({
        cake_name: cakeName,
        weight_kg: weightKg * item.quantity,
        tiers,
        flavor,
        frosting,
        topping,
        notes,
      });

      // Aggregate required amounts to database inventory items
      calculation.ingredients.forEach(ing => {
        const matchName = ing.inventory_match || ing.name;
        totalDeductions[matchName] = (totalDeductions[matchName] || 0) + ing.amount;
      });
    }

    // Apply exact deductions to Supabase inventory table
    for (const invItem of inventory) {
      let amountToDeduct = 0;

      // Exact match or fuzzy match
      if (totalDeductions[invItem.name]) {
        amountToDeduct = totalDeductions[invItem.name];
      } else {
        // Keyword fallback
        const lower = invItem.name.toLowerCase();
        if (lower.includes('flour') && totalDeductions['All-Purpose Flour']) amountToDeduct = totalDeductions['All-Purpose Flour'];
        else if (lower.includes('sugar') && totalDeductions['Granulated Sugar']) amountToDeduct = totalDeductions['Granulated Sugar'];
        else if (lower.includes('butter') && totalDeductions['Unsalted Butter']) amountToDeduct = totalDeductions['Unsalted Butter'];
        else if (lower.includes('egg') && totalDeductions['Fresh Eggs']) amountToDeduct = totalDeductions['Fresh Eggs'];
        else if (lower.includes('milk') && totalDeductions['Fresh Milk']) amountToDeduct = totalDeductions['Fresh Milk'];
        else if (lower.includes('cocoa') && totalDeductions['Cocoa Powder']) amountToDeduct = totalDeductions['Cocoa Powder'];
        else if (lower.includes('vanilla') && totalDeductions['Vanilla Extract']) amountToDeduct = totalDeductions['Vanilla Extract'];
        else if (lower.includes('baking powder') && totalDeductions['Baking Powder']) amountToDeduct = totalDeductions['Baking Powder'] / 1000; // grams to kg if needed
      }

      if (amountToDeduct > 0) {
        const newStock = Number(Math.max(0, invItem.current_stock - amountToDeduct).toFixed(2));
        await supabase
          .from('inventory')
          .update({ current_stock: newStock, updated_at: new Date().toISOString() })
          .eq('id', invItem.id);
      }
    }
  } catch (err) {
    console.error('Error during AI inventory deduction:', err);
  }
}

export async function getLowStockItems(): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .filter('current_stock', 'lte', 'min_threshold');
  if (error) {
    console.error('Error fetching low stock items:', error);
    return [];
  }
  return (data || []) as InventoryItem[];
}

export async function restockIngredient(id: string, amount: number) {
  const { data: item } = await supabase.from('inventory').select('*').eq('id', id).single();
  if (!item) return;
  const newStock = Number(Math.min(item.current_stock + amount, item.max_capacity).toFixed(2));
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
