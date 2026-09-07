import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { InventoryAlert, InventoryItem } from '../types';

interface AlertContextType {
  alerts: InventoryAlert[];
  unreadCount: number;
  addAlert: (ingredient: InventoryItem) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAlerts: () => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);

  const addAlert = useCallback((ingredient: InventoryItem) => {
    const type = ingredient.current_stock === 0 ? 'out_of_stock' : 'low_stock';
    const existing = alerts.find(a => a.ingredient.id === ingredient.id && a.type === type && !a.is_read);
    if (existing) return;

    const newAlert: InventoryAlert = {
      id: `${ingredient.id}-${Date.now()}`,
      ingredient,
      type,
      message: type === 'out_of_stock'
        ? `⚠️ ${ingredient.name} is OUT OF STOCK! Immediate restocking required.`
        : `🔔 ${ingredient.name} is running low (${ingredient.current_stock} ${ingredient.unit} remaining).`,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 50));
  }, [alerts]);

  const markRead = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
  }, []);

  const markAllRead = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
  }, []);

  const clearAlerts = useCallback(() => setAlerts([]), []);

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <AlertContext.Provider value={{ alerts, unreadCount, addAlert, markRead, markAllRead, clearAlerts }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlerts must be used within AlertProvider');
  return ctx;
}
