import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { InventoryItem } from '../../types';
import { getInventoryStatus } from '../../utils/analyticsUtils';

export default function InventoryChart({ items }: { items: InventoryItem[] }) {
  const data = items.slice(0, 6).map(item => {
    const { color, pct } = getInventoryStatus(item.current_stock, item.min_threshold, item.max_capacity);
    return { name: item.name, value: Math.round(pct), fill: color };
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={data} startAngle={90} endAngle={-270}>
        <RadialBar dataKey="value" cornerRadius={6} label={{ position: 'insideStart', fill: 'white', fontSize: 10, fontWeight: 700 }} />
        <Tooltip formatter={(v: any) => [`${v}%`, 'Stock Level']} />
        <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '0.8rem' }} />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}
