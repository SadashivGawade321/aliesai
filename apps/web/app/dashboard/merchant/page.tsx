'use client';

import { motion } from 'framer-motion';
import { Shield, Package, DollarSign, TrendingUp, CheckCircle, Clock, AlertCircle, Star, Bell, LogOut, BarChart3, Settings, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth.store';
import { useRouter } from 'next/navigation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const revenueData = Array.from({ length: 14 }, (_, i) => ({
  day: `Day ${i + 1}`,
  revenue: Math.floor(8000 + Math.random() * 12000),
  orders: Math.floor(15 + Math.random() * 25),
}));

export default function MerchantDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const { data: orders } = useQuery({
    queryKey: ['merchant-orders'],
    queryFn: () => api.get('/orders?limit=5').then(r => r.data),
  });

  return (
    <div className="min-h-screen bg-[#030712]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/08 rounded-full blur-3xl" />
      </div>

      <header className="relative z-10 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold gradient-text">AegisPay AI</span>
            <span className="text-xs text-gray-600 ml-2">Merchant Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-gray-500 hover:text-white"><Bell className="w-5 h-5" /></button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">{user?.firstName?.[0]}</div>
          <button onClick={() => { logout(); router.push('/auth/login'); }} className="text-gray-600 hover:text-red-400 transition-colors"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white">Merchant Dashboard</h1>
          <p className="text-gray-500 text-sm">{user?.firstName} {user?.lastName} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </motion.div>

        {/* KPIs */}
        <div className="dashboard-grid">
          {[
            { icon: Package, label: 'Today\'s Orders', value: '24', change: '+8', color: 'bg-blue-600/20', glow: 'glow-blue' },
            { icon: DollarSign, label: 'Revenue (Today)', value: '₹18,240', change: '+12%', color: 'bg-green-600/20', glow: 'glow-green' },
            { icon: Clock, label: 'Pending', value: '3', change: '0', color: 'bg-amber-600/20', glow: 'glow-amber' },
            { icon: Star, label: 'Trust Score', value: '94', change: '+2', color: 'bg-purple-600/20', glow: 'glow-purple' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`stat-card ${s.glow}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}><s.icon className="w-5 h-5 text-white" /></div>
                <span className="text-xs text-green-400 font-medium">{s.change}</span>
              </div>
              <div className="text-2xl font-black text-white mb-1">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="chart-card">
          <h3 className="text-white font-semibold mb-4">Revenue (14 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="mrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} fill="url(#mrGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Settlement Status Banner */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-5 border border-green-500/20 bg-green-500/5">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-green-400 font-semibold">Escrow Protection Active</p>
              <p className="text-gray-400 text-sm">All your orders are covered by AegisPay AI's programmable escrow. Funds are released automatically upon OTP verification.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
