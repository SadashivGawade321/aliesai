'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { BarChart3, TrendingUp, Users, Package, DollarSign, Shield } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import { format } from 'date-fns';

const volumeData = Array.from({ length: 30 }, (_, i) => ({
  date: format(new Date(Date.now() - (29 - i) * 86400000), 'MMM d'),
  orders: Math.floor(40 + Math.random() * 80),
  revenue: Math.floor(15000 + Math.random() * 35000),
  fraud: Math.floor(1 + Math.random() * 8),
}));

const roleDistribution = [
  { name: 'Customers', value: 4200, color: '#3b82f6' },
  { name: 'Merchants', value: 340, color: '#a855f7' },
  { name: 'Drivers', value: 820, color: '#22c55e' },
];

const topMerchants = [
  { name: 'Priya Merchants', orders: 156, revenue: 284000 },
  { name: 'SpiceGarden', orders: 142, revenue: 263000 },
  { name: 'QuickBite', orders: 128, revenue: 241000 },
  { name: 'FoodFirst', orders: 96, revenue: 188000 },
];

const TOOLTIP = {
  contentStyle: { background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#94a3b8' },
};

export default function AdminAnalyticsPage() {
  const { data: stats } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => api.get('/analytics/dashboard').then(r => r.data).catch(() => null),
    staleTime: 30000,
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-400" /> Analytics
        </h1>
        <p className="text-gray-500 text-sm mt-1">Platform-wide metrics and performance insights</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Package, label: 'Total Orders', value: stats?.orders?.total ?? '1,284', color: 'bg-blue-600/20 glow-blue' },
          { icon: DollarSign, label: 'GMV (Month)', value: '₹48.2L', color: 'bg-green-600/20 glow-green' },
          { icon: Users, label: 'Active Users', value: '5,360', color: 'bg-purple-600/20 glow-purple' },
          { icon: Shield, label: 'Fraud Prevented', value: '₹1.2L', color: 'bg-amber-600/20 glow-amber' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`stat-card ${s.color}`}>
            <s.icon className="w-5 h-5 text-white mb-2 opacity-70" />
            <div className="text-xl font-black text-white">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Main Chart */}
      <div className="chart-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white font-semibold">Order Volume &amp; Revenue</h3>
            <p className="text-gray-500 text-xs mt-0.5">Last 30 days</p>
          </div>
          <div className="flex gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" />Orders</span>
            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-purple-500" />Revenue</span>
            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" />Fraud</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={volumeData}>
            <defs>
              <linearGradient id="aOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="aRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={6} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP} />
            <Area type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} fill="url(#aOrders)" />
            <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} fill="url(#aRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* User Distribution */}
        <div className="chart-card">
          <h3 className="text-white font-semibold mb-4">User Distribution</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {roleDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip {...TOOLTIP} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {roleDistribution.map(d => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-sm text-gray-400">{d.name}</span>
                  </div>
                  <span className="text-white font-semibold">{d.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Merchants */}
        <div className="chart-card">
          <h3 className="text-white font-semibold mb-4">Top Merchants</h3>
          <div className="space-y-4">
            {topMerchants.map((m, i) => (
              <div key={m.name} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-purple-600/20 flex items-center justify-center text-xs font-bold text-purple-400">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white truncate">{m.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{m.orders} orders</span>
                  </div>
                  <div className="bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(m.revenue / 284000) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                    />
                  </div>
                </div>
                <span className="text-xs font-semibold text-white flex-shrink-0">₹{(m.revenue / 1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
