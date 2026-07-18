'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import {
  Shield, TrendingUp, TrendingDown, Package, Lock,
  AlertTriangle, Activity,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth.store';
import { format } from 'date-fns';

const orderTrend = Array.from({ length: 30 }, (_, i) => ({
  date: format(new Date(Date.now() - (29 - i) * 86400000), 'MMM d'),
  orders: Math.floor(40 + Math.random() * 80),
  revenue: Math.floor(15000 + Math.random() * 35000),
}));

const escrowDist = [
  { name: 'Settled', value: 62, color: '#22c55e' },
  { name: 'In Transit', value: 18, color: '#f59e0b' },
  { name: 'OTP Pending', value: 8, color: '#a855f7' },
  { name: 'Disputed', value: 5, color: '#ef4444' },
  { name: 'Refunded', value: 7, color: '#3b82f6' },
];

const fraudData = [
  { level: 'LOW', count: 180, fill: '#22c55e' },
  { level: 'MEDIUM', count: 45, fill: '#f59e0b' },
  { level: 'HIGH', count: 18, fill: '#ef4444' },
  { level: 'CRITICAL', count: 4, fill: '#dc2626' },
];

const TOOLTIP_STYLE = {
  contentStyle: { background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#94a3b8' },
  labelStyle: { color: '#e2e8f0', fontWeight: 600 },
};

const alerts = [
  { type: 'critical', msg: 'CRITICAL fraud detected — Order AGP-2024-0041', time: '2m ago' },
  { type: 'warning', msg: 'High refund rate for merchant Priya Merchants', time: '8m ago' },
  { type: 'success', msg: 'Escrow ESC-A3F9B2 settled — ₹2,340.00 released', time: '12m ago' },
  { type: 'info', msg: 'New dispute filed — Order AGP-2024-0038', time: '18m ago' },
  { type: 'success', msg: 'AI resolved dispute #DR-2024-019 in 1.2s', time: '24m ago' },
];

const alertColors: Record<string, string> = {
  critical: 'border-l-red-500 bg-red-500/5',
  warning: 'border-l-amber-500 bg-amber-500/5',
  success: 'border-l-green-500 bg-green-500/5',
  info: 'border-l-blue-500 bg-blue-500/5',
};

function KpiCard({ title, value, change, icon: Icon, color, glow, prefix = '', suffix = '' }: any) {
  const isPositive = change >= 0;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`stat-card ${glow}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(change)}%
        </div>
      </div>
      <div className="text-2xl font-black text-white mb-1">{prefix}{value}{suffix}</div>
      <div className="text-xs text-gray-500 font-medium">{title}</div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/analytics/dashboard').then(r => r.data),
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-white">
          Good {greeting}, <span className="gradient-text">{user?.firstName}</span> 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening across your platform today.</p>
      </motion.div>

      <div className="dashboard-grid">
        <KpiCard title="Total Orders" value={stats?.orders?.total ?? 1284} change={12.5} icon={Package} color="bg-blue-600/20" glow="glow-blue" />
        <KpiCard title="Escrow Locked" value="₹4.2L" change={8.3} icon={Lock} color="bg-purple-600/20" glow="glow-purple" />
        <KpiCard title="Fraud Alerts" value={stats?.fraud?.alerts ?? 24} change={-5.2} icon={AlertTriangle} color="bg-amber-600/20" glow="glow-amber" />
        <KpiCard title="Insurance Pool" value="₹15,420" change={3.1} icon={Shield} color="bg-green-600/20" glow="glow-green" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 chart-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-semibold">Order &amp; Revenue Trend</h3>
              <p className="text-gray-500 text-xs mt-0.5">Last 30 days</p>
            </div>
            <div className="flex gap-3 text-xs text-gray-400">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" />Orders</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-purple-500" />Revenue</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={orderTrend}>
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} fill="url(#colorOrders)" />
              <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="text-white font-semibold mb-1">Escrow Distribution</h3>
          <p className="text-gray-500 text-xs mb-4">By current state</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={escrowDist} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {escrowDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2">
            {escrowDist.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-gray-400">{d.name}</span>
                </div>
                <span className="text-white font-medium">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="chart-card">
          <h3 className="text-white font-semibold mb-1">Fraud Risk Distribution</h3>
          <p className="text-gray-500 text-xs mb-4">Current period</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={fraudData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="level" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {fraudData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold">Live Alerts</h3>
              <p className="text-gray-500 text-xs">Real-time platform events</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-400">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />Live
            </div>
          </div>
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`border-l-2 rounded-r-xl px-3 py-2.5 ${alertColors[alert.type]}`}
              >
                <p className="text-xs text-gray-300 leading-relaxed">{alert.msg}</p>
                <p className="text-xs text-gray-600 mt-1">{alert.time}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
