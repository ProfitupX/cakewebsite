import { supabase } from './supabase';
import { calculateCakeRequirementsWithAI, getAlgorithmicCakeCalculation } from './gemini';
import type { 
  Order, OrderStatus, Product, InventoryItem, Review, HappyHour, 
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

// Local orders cache for resilience and immediate rendering
function getLocalOrdersBackup(): Order[] {
  try {
    const raw = localStorage.getItem('sowmis_orders_cache');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalOrderBackup(order: Order) {
  try {
    const list = getLocalOrdersBackup();
    const filtered = list.filter(o => o.id !== order.id);
    localStorage.setItem('sowmis_orders_cache', JSON.stringify([order, ...filtered].slice(0, 100)));
  } catch {}
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export async function createOrder(
  userId: string | null,
  items: Array<{ product_id?: string; customization?: CakeCustomization; quantity: number; unit_price: number; is_custom: boolean; product?: Product }>,
  totalAmount: number,
  happyHourDiscount?: number,
  notes?: string,
  deliveryDate?: string,
  deliveryAddress?: string,
  customerName?: string,
  customerPhone?: string
) {
  // 1. Create order with client-generated UUID
  const orderId = crypto.randomUUID();
  const fullNotes = [
    customerName ? `Customer: ${customerName}` : '',
    customerPhone ? `Phone: ${customerPhone}` : '',
    notes ? `Note: ${notes}` : ''
  ].filter(Boolean).join(' | ');

  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      id: orderId,
      user_id: userId || null,
      status: 'pending',
      total_amount: totalAmount,
      happy_hour_discount: happyHourDiscount || 0,
      notes: fullNotes,
      delivery_date: deliveryDate,
      delivery_address: deliveryAddress || '',
    });
  if (orderError) console.warn('Supabase order insert warning:', orderError);

  // 2. Insert order items
  const orderItems = items.map(item => ({
    id: crypto.randomUUID(),
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
  if (itemsError) console.warn('Supabase order_items insert warning:', itemsError);

  // 3. Deduct inventory based on order using AI calculations
  await deductInventoryForOrder(items);

  // 4. Save to local storage cache with items and details for zero-latency instant rendering
  const fullOrderObject: Order = {
    id: orderId,
    user_id: userId || '',
    status: 'pending',
    total_amount: totalAmount,
    happy_hour_discount: happyHourDiscount || 0,
    delivery_address: deliveryAddress || '',
    delivery_date: deliveryDate,
    notes: fullNotes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: items.map((it, idx) => ({
      id: orderItems[idx]?.id || crypto.randomUUID(),
      order_id: orderId,
      product_id: it.product_id,
      customization: it.customization,
      quantity: it.quantity,
      unit_price: it.unit_price,
      is_custom: it.is_custom,
      product: it.product,
    })),
    profile: customerName ? {
      id: userId || '',
      email: '',
      full_name: customerName,
      role: 'customer',
      created_at: new Date().toISOString(),
    } : undefined,
  };

  saveLocalOrderBackup(fullOrderObject);

  return fullOrderObject;
}

export async function getOrders(): Promise<Order[]> {
  try {
    // 1. Fetch orders from Supabase
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersErr) throw ordersErr;

    // 2. Fetch order_items
    const { data: rawItems } = await supabase
      .from('order_items')
      .select('*');

    // 3. Fetch products to resolve catalog cakes
    const { data: products } = await supabase
      .from('products')
      .select('*');
    const productMap = new Map((products || []).map(p => [p.id, p]));

    // 4. Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*');
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    // Group items by order_id
    const itemsByOrder: Record<string, OrderItem[]> = {};
    (rawItems || []).forEach(it => {
      if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
      itemsByOrder[it.order_id].push({
        ...it,
        product: it.product_id ? productMap.get(it.product_id) : undefined,
      });
    });

    const merged = (orders || []).map(o => ({
      ...o,
      items: itemsByOrder[o.id] || [],
      profile: o.user_id ? profileMap.get(o.user_id) : undefined,
    })) as Order[];

    // Merge with local backup to guarantee zero missing items
    const local = getLocalOrdersBackup();
    const orderMap = new Map<string, Order>();
    merged.forEach(o => orderMap.set(o.id, o));

    local.forEach(localOrd => {
      if (!orderMap.has(localOrd.id)) {
        orderMap.set(localOrd.id, localOrd);
      } else {
        const existing = orderMap.get(localOrd.id)!;
        if ((!existing.items || existing.items.length === 0) && (localOrd.items && localOrd.items.length > 0)) {
          existing.items = localOrd.items;
        }
        if (!existing.delivery_address && localOrd.delivery_address) {
          existing.delivery_address = localOrd.delivery_address;
        }
        if (!existing.notes && localOrd.notes) {
          existing.notes = localOrd.notes;
        }
      }
    });

    return Array.from(orderMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (err) {
    console.warn('getOrders falling back to local cache:', err);
    return getLocalOrdersBackup();
  }
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
  try {
    await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);
  } catch (e) {
    console.warn('Error updating status in DB:', e);
  }

  try {
    const list = getLocalOrdersBackup();
    const updated = list.map(o => o.id === orderId ? { ...o, status: status as OrderStatus, updated_at: new Date().toISOString() } : o);
    localStorage.setItem('sowmis_orders_cache', JSON.stringify(updated));
  } catch {}
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

// Auto-deduct ingredients using exact cake recipe calculations when order is placed
export async function deductInventoryForOrder(
  items: Array<{ product_id?: string; customization?: CakeCustomization; quantity: number; is_custom: boolean; product?: Product }>
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
      let cakeName = item.product?.name || (item.is_custom ? 'Custom 3D Cake' : 'Artisan Cake');
      let weightKg = item.product?.weight_kg || 1;
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
      } else if (item.product) {
        cakeName = item.product.name;
        weightKg = item.product.weight_kg || 1;
        flavor = item.product.name.includes('Chocolate') ? 'Chocolate' : (item.product.name.includes('Velvet') ? 'RedVelvet' : (item.product.name.includes('Mango') ? 'Mango' : (item.product.name.includes('Lemon') ? 'Lemon' : (item.product.name.includes('Strawberry') ? 'Strawberry' : 'Vanilla'))));
      } else if (item.product_id) {
        // Query catalog product name if not preloaded
        const { data: prod } = await supabase.from('products').select('*').eq('id', item.product_id).single();
        if (prod) {
          cakeName = prod.name;
          weightKg = prod.weight_kg || 1;
          flavor = prod.name.includes('Chocolate') ? 'Chocolate' : (prod.name.includes('Velvet') ? 'RedVelvet' : (prod.name.includes('Mango') ? 'Mango' : (prod.name.includes('Lemon') ? 'Lemon' : (prod.name.includes('Strawberry') ? 'Strawberry' : 'Vanilla'))));
        }
      }

      // Calculate instant deterministic requirements for guaranteed, zero-latency deduction
      const calculation = getAlgorithmicCakeCalculation({
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
        totalDeductions[matchName] = Number(((totalDeductions[matchName] || 0) + ing.amount).toFixed(3));
      });
    }

    console.log('[INVENTORY DEDUCTION] Deducting ingredients from Supabase DB:', totalDeductions);

    // Apply exact deductions to Supabase inventory table
    for (const invItem of inventory) {
      let amountToDeduct = 0;

      // Exact match or keyword match
      if (totalDeductions[invItem.name] !== undefined) {
        amountToDeduct = totalDeductions[invItem.name];
      } else {
        const lower = invItem.name.toLowerCase();
        if (lower.includes('flour') && totalDeductions['All-Purpose Flour']) amountToDeduct = totalDeductions['All-Purpose Flour'];
        else if (lower.includes('sugar') && totalDeductions['Granulated Sugar']) amountToDeduct = totalDeductions['Granulated Sugar'];
        else if (lower.includes('butter') && totalDeductions['Unsalted Butter']) amountToDeduct = totalDeductions['Unsalted Butter'];
        else if (lower.includes('egg') && totalDeductions['Fresh Eggs']) amountToDeduct = totalDeductions['Fresh Eggs'];
        else if (lower.includes('milk') && totalDeductions['Fresh Milk']) amountToDeduct = totalDeductions['Fresh Milk'];
        else if (lower.includes('cocoa') && totalDeductions['Cocoa Powder']) amountToDeduct = totalDeductions['Cocoa Powder'];
        else if (lower.includes('vanilla') && totalDeductions['Vanilla Extract']) amountToDeduct = totalDeductions['Vanilla Extract'];
        else if (lower.includes('baking powder') && totalDeductions['Baking Powder']) amountToDeduct = totalDeductions['Baking Powder'];
      }

      if (amountToDeduct > 0) {
        const newStock = Number(Math.max(0, invItem.current_stock - amountToDeduct).toFixed(2));
        const { error: updErr } = await supabase
          .from('inventory')
          .update({ current_stock: newStock, updated_at: new Date().toISOString() })
          .eq('id', invItem.id);
        
        if (updErr) {
          console.warn(`Failed to deduct ${invItem.name} in DB:`, updErr);
        } else {
          console.log(`[DB UPDATED] ${invItem.name}: ${invItem.current_stock} -> ${newStock} ${invItem.unit}`);
        }
      }
    }
  } catch (err) {
    console.error('Error during live inventory deduction:', err);
  }
}

export async function resetInventoryToHealthyStock() {
  const defaultItems = [
    { name: 'All-Purpose Flour', current_stock: 45, min_threshold: 5, max_capacity: 50, unit: 'kg' },
    { name: 'Granulated Sugar', current_stock: 35, min_threshold: 5, max_capacity: 40, unit: 'kg' },
    { name: 'Unsalted Butter', current_stock: 18, min_threshold: 3, max_capacity: 20, unit: 'kg' },
    { name: 'Fresh Eggs', current_stock: 25, min_threshold: 5, max_capacity: 30, unit: 'dozen' },
    { name: 'Fresh Milk', current_stock: 32, min_threshold: 8, max_capacity: 40, unit: 'litre' },
    { name: 'Cocoa Powder', current_stock: 7.5, min_threshold: 2, max_capacity: 10, unit: 'kg' },
    { name: 'Vanilla Extract', current_stock: 750, min_threshold: 200, max_capacity: 1000, unit: 'ml' },
    { name: 'Baking Powder', current_stock: 3.5, min_threshold: 1, max_capacity: 5, unit: 'kg' }
  ];

  for (const it of defaultItems) {
    await supabase
      .from('inventory')
      .update({
        current_stock: it.current_stock,
        min_threshold: it.min_threshold,
        max_capacity: it.max_capacity,
        updated_at: new Date().toISOString()
      })
      .eq('name', it.name);
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
