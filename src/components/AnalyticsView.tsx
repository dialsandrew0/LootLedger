import React, { useMemo } from 'react';
import { InventoryItem } from '../types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, PieChart, DollarSign, Package } from 'lucide-react';

interface AnalyticsViewProps {
  inventory: InventoryItem[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ inventory }) => {
  // Data Processing for Line Graph (Net Profit over Time)
  const profitData = useMemo(() => {
    const grouped = inventory.reduce((acc, item) => {
      const dateObj = new Date(item.createdAt);
      // Fallback for invalid dates
      if (isNaN(dateObj.getTime())) return acc;
      
      const date = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!acc[date]) acc[date] = { date, profit: 0, sortValue: dateObj.getTime() };
      acc[date].profit += item.expectedNetProfit || 0;
      return acc;
    }, {} as Record<string, { date: string; profit: number; sortValue: number }>);
    
    return Object.values(grouped).sort((a: any, b: any) => a.sortValue - b.sortValue);
  }, [inventory]);

  // Data Processing for Bar Chart (Sales by Category)
  const categoryData = useMemo(() => {
    const grouped = inventory.reduce((acc, item) => {
      const cat = item.category || 'Uncategorized';
      if (!acc[cat]) acc[cat] = { category: cat, sales: 0, profit: 0 };
      acc[cat].sales += item.expectedEstimate || 0;
      acc[cat].profit += item.expectedNetProfit || 0;
      return acc;
    }, {} as Record<string, { category: string; sales: number; profit: number }>);
    
    return Object.values(grouped).sort((a: any, b: any) => b.sales - a.sales);
  }, [inventory]);

  // Top level stats
  const totalProfit = useMemo(() => inventory.reduce((sum, item) => sum + (item.expectedNetProfit || 0), 0), [inventory]);
  const totalSales = useMemo(() => inventory.reduce((sum, item) => sum + (item.expectedEstimate || 0), 0), [inventory]);
  const totalItems = inventory.length;

  if (!inventory.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-secondary text-center">
        <h3 className="text-xl font-bold text-primary mb-2">Not enough data</h3>
        <p>Scan and save some items to your inventory to see analytics.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-indigo-950/40 border border-indigo-900/50 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-black tracking-tight text-primary tracking-tight">Analytics Dashboard</h2>
          <p className="text-sm text-secondary font-medium">Track your sourcing profitability</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-3d p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-950/40 border border-emerald-900/50 rounded-md flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Expected Profit</p>
            <p className="font-mono text-2xl font-display font-black tracking-tight text-primary">${totalProfit.toFixed(2)}</p>
          </div>
        </div>
        <div className="card-3d p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-950/40 border border-blue-900/50 rounded-md flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Expected Revenue</p>
            <p className="font-mono text-2xl font-display font-black tracking-tight text-primary">${totalSales.toFixed(2)}</p>
          </div>
        </div>
        <div className="card-3d p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-950/40 border border-purple-900/50 rounded-md flex items-center justify-center shrink-0">
            <Package className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Items Sourced</p>
            <p className="font-mono text-2xl font-display font-black tracking-tight text-primary">{totalItems}</p>
          </div>
        </div>
      </div>

      <div className="card-3d p-6">
        <h3 className="text-lg font-display font-black tracking-tight text-primary mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          Expected Net Profit Over Time
        </h3>
        <div className="h-[300px] w-full">
          {profitData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10} 
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `$${val}`}
                  dx={-10} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  itemStyle={{ fontWeight: 700 }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Net Profit']}
                  labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 600 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="var(--color-accent)" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: 'var(--color-accent)', strokeWidth: 2, stroke: 'var(--color-surface)' }} 
                  activeDot={{ r: 8, fill: 'var(--color-accent)', stroke: 'var(--color-surface)', strokeWidth: 2 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted text-sm font-medium">
              Not enough chronological data
            </div>
          )}
        </div>
      </div>

      <div className="card-3d p-6">
        <h3 className="text-lg font-display font-black tracking-tight text-primary mb-6 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-indigo-400" />
          Value by Category
        </h3>
        <div className="h-[350px] w-full">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="category" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                  tick={{ fill: '#64748b' }}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `$${val}`}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  itemStyle={{ fontWeight: 700 }}
                  formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name === 'sales' ? 'Expected Sales' : 'Expected Profit']}
                  labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 600 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px', fontWeight: 600 }} />
                <Bar dataKey="sales" name="Expected Sales" fill="#3E3B38" radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Bar dataKey="profit" name="Expected Profit" fill="var(--color-accent)" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="w-full h-full flex items-center justify-center text-muted text-sm font-medium">
              No categories found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
