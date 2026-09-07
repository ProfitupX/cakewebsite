import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import type { DemandForecast } from '../../types';

const TREND_COLORS: Record<string, string> = { up: '#22C55E', down: '#EF4444', stable: '#3B82F6' };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d: DemandForecast = payload[0]?.payload;
  return (
    <div style={{ background: 'white', border: '1px solid #F0DDD5', borderRadius: 12, padding: '0.75rem 1rem', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxWidth: 200 }}>
      <p style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1A0A00', fontSize: '0.85rem' }}>{label}</p>
      <p style={{ color: '#E8194B', fontSize: '0.82rem' }}>Current: {d?.current_demand} units</p>
      <p style={{ color: '#D4A017', fontSize: '0.82rem' }}>Predicted: {d?.predicted_demand} units</p>
      <p style={{ color: TREND_COLORS[d?.trend], fontSize: '0.82rem', fontWeight: 600 }}>
        Trend: {d?.trend === 'up' ? '📈 Rising' : d?.trend === 'down' ? '📉 Declining' : '➡️ Stable'}
      </p>
      <p style={{ color: '#7B6B5E', fontSize: '0.75rem' }}>Confidence: {d?.confidence}%</p>
    </div>
  );
};

export default function DemandChart({ data }: { data: DemandForecast[] }) {
  const chartData = data.map(d => ({
    ...d,
    name: d.product_name.length > 10 ? d.product_name.substring(0, 10) + '...' : d.product_name,
  }));
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0DDD5" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: '#7B6B5E', fontSize: 11 }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" />
        <YAxis tick={{ fill: '#7B6B5E', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '0.82rem' }} />
        <Bar dataKey="current_demand" name="Current Demand" fill="#E8194B" radius={[6, 6, 0, 0]} />
        <Bar dataKey="predicted_demand" name="Predicted Demand" radius={[6, 6, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={TREND_COLORS[entry.trend] || '#3B82F6'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
