import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { InventoryAlert, InventoryItem } from '../types';
import { supabase } from '../lib/supabase';
import { getLowStockItems, restockIngredient } from '../lib/database';

interface AlertContextType {
  alerts: InventoryAlert[];
  unreadCount: number;
  lowStockItems: InventoryItem[];
  addAlert: (ingredient: InventoryItem) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAlerts: () => void;
  quickRestock: (id: string, amount?: number) => Promise<void>;
  refreshAlerts: () => Promise<void>;
}

const AlertContext = createContext<AlertContextType | null>(null);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);

  const addAlert = useCallback((ingredient: InventoryItem) => {
    const type = ingredient.current_stock === 0 ? 'out_of_stock' : 'low_stock';
    setAlerts(prev => {
      const existing = prev.find(a => a.ingredient.id === ingredient.id && !a.is_read);
      if (existing) {
        // Update existing alert with new stock
        return prev.map(a => a.id === existing.id ? {
          ...a,
          ingredient,
          type,
          message: type === 'out_of_stock'
            ? `🚨 URGENT: ${ingredient.name} is OUT OF STOCK (0 ${ingredient.unit})!`
            : `⚠️ LOW STOCK ALERT: ${ingredient.name} has only ${ingredient.current_stock} ${ingredient.unit} remaining (Min: ${ingredient.min_threshold} ${ingredient.unit}).`,
          created_at: new Date().toISOString(),
        } : a);
      }

      const newAlert: InventoryAlert = {
        id: `${ingredient.id}-${Date.now()}`,
        ingredient,
        type,
        message: type === 'out_of_stock'
          ? `🚨 URGENT: ${ingredient.name} is OUT OF STOCK (0 ${ingredient.unit})!`
          : `⚠️ LOW STOCK ALERT: ${ingredient.name} has only ${ingredient.current_stock} ${ingredient.unit} remaining (Min: ${ingredient.min_threshold} ${ingredient.unit}).`,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      return [newAlert, ...prev].slice(0, 50);
    });
  }, []);

  const refreshAlerts = useCallback(async () => {
    try {
      const low = await getLowStockItems();
      setLowStockItems(low);
      low.forEach(item => {
        addAlert(item);
      });
    } catch (err) {
      console.warn('Error loading initial stock alerts:', err);
    }
  }, [addAlert]);

  useEffect(() => {
    refreshAlerts();

    // Realtime Supabase listener on inventory table
    const sub = supabase.channel('realtime_inventory_alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, payload => {
        const item = payload.new as InventoryItem;
        if (item && item.current_stock !== undefined) {
          if (item.current_stock <= item.min_threshold) {
            addAlert(item);
            setLowStockItems(prev => {
              const filtered = prev.filter(i => i.id !== item.id);
              return [...filtered, item];
            });
          } else {
            // Remove from low stock list if restocked above threshold
            setLowStockItems(prev => prev.filter(i => i.id !== item.id));
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [addAlert, refreshAlerts]);

  const quickRestock = useCallback(async (id: string, amount: number = 10) => {
    try {
      await restockIngredient(id, amount);
      // Mark matching alerts as read
      setAlerts(prev => prev.map(a => a.ingredient.id === id ? { ...a, is_read: true } : a));
      await refreshAlerts();
    } catch (err) {
      console.error('Quick restock failed:', err);
    }
  }, [refreshAlerts]);

  const markRead = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
  }, []);

  const markAllRead = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
  }, []);

  const clearAlerts = useCallback(() => setAlerts([]), []);

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <AlertContext.Provider value={{
      alerts,
      unreadCount,
      lowStockItems,
      addAlert,
      markRead,
      markAllRead,
      clearAlerts,
      quickRestock,
      refreshAlerts
    }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlerts must be used within AlertProvider');
  return ctx;
}
