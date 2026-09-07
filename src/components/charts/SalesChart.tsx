import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { SalesDataPoint } from '../../types';

interface SalesChartProps {
  actual: SalesDataPoint[];
  forecast?: SalesDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '1px solid #F0DDD5', borderRadius: 12, padding: '0.75rem 1rem', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
      <p style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1A0A00', fontSize: '0.85rem' }}>{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color, fontSize: '0.82rem', margin: '2px 0' }}>
          {entry.name === 'revenue' ? `₹${entry.value.toLocaleString()}` : `${entry.value} orders`}
        </p>
      ))}
    </div>
  );
};

export default function SalesChart({ actual, forecast = [] }: SalesChartProps) {
  const combined = [
    ...actual.map(d => ({ ...d, type: 'actual' })),
    ...forecast.map(d => ({ ...d, revenue_forecast: d.revenue, orders_forecast: d.orders, revenue: undefined, orders: undefined, type: 'forecast' })),
  ];

  const formatDate = (date: string) => {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={combined} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#E8194B" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#E8194B" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D4A017" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#D4A017" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0DDD5" />
        <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: '#7B6B5E', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fill: '#7B6B5E', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '0.82rem' }} />
        <Area type="monotone" dataKey="revenue" name="Revenue (Actual)" stroke="#E8194B" strokeWidth={2.5} fill="url(#colorRevenue)" dot={false} connectNulls={false} />
        <Area type="monotone" dataKey="revenue_forecast" name="Revenue (Forecast)" stroke="#D4A017" strokeWidth={2} strokeDasharray="6 3" fill="url(#colorForecast)" dot={false} connectNulls={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
