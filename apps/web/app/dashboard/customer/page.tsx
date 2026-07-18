'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Shield, Package, Lock, TrendingUp, Star, Bell, Clock,
  CheckCircle, AlertCircle, ArrowRight, DollarSign, LogOut, Home,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth.store';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  delivered: 'badge-success',
  in_transit: 'badge-info',
  pending: 'badge-warning',
  cancelled: 'badge-danger',
  confirmed: 'badge-purple',
  preparing: 'badge-warning',
};

export default function CustomerDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const { data: orders } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders?limit=5').then(r => r.data),
  });

  const { data: trust } = useQuery({
    queryKey: ['my-trust'],
    queryFn: () => api.get(`/trust/user/${user?._id}`).then(r => r.data),
    enabled: !!user?._id,
  });

  const handleLogout = () => { logout(); router.push('/auth/login'); };

  const trustScore = trust?.score ?? 88;
  const trustGrade = trustScore >= 90 ? 'A+' : trustScore >= 80 ? 'A' : trustScore >= 70 ? 'B' : 'C';
  const trustColor = trustScore >= 80 ? 'text-green-400' : trustScore >= 60 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="min-h-screen bg-[#030712]">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/08 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-purple-600/06 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 glass border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold gradient-text">AegisPay AI</span>
        </div>

        <nav className="ml-8 hidden md:flex items-center gap-2">
          {[{ icon: Home, label: 'Home', href: '/dashboard/customer' }, { icon: Package, label: 'Orders', href: '/dashboard/customer/orders' }, { icon: Lock, label: 'Escrow', href: '/dashboard/customer/escrow' }].map(item => (
            <Link key={item.href} href={item.href} className="sidebar-item text-sm px-3 py-2">
              <item.icon className="w-4 h-4" /> {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <button className="text-gray-500 hover:text-white transition-colors"><Bell className="w-5 h-5" /></button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
            {user?.firstName?.[0]}
          </div>
          <button onClick={handleLogout} className="text-gray-600 hover:text-red-400 transition-colors"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto p-6 space-y-6">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white">Hello, <span className="gradient-text">{user?.firstName}</span> 👋</h1>
          <p className="text-gray-500 text-sm">Track your orders, escrow, and trust score</p>
        </motion.div>

        {/* Trust Score Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="stat-card glow-blue"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">Your Trust Score</p>
              <div className={`text-6xl font-black ${trustColor}`}>{trustScore}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="badge-info">Grade {trustGrade}</span>
                <span className="text-xs text-gray-500">• Trusted Customer</span>
              </div>
            </div>
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={trustScore >= 80 ? '#22c55e' : trustScore >= 60 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="10"
                  strokeDasharray={`${(trustScore / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Star className={`w-8 h-8 ${trustColor}`} />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-4 text-center">
            <div><div className="text-white font-bold">{trust?.totalOrders ?? 34}</div><div className="text-xs text-gray-600">Total Orders</div></div>
            <div><div className="text-white font-bold">{trust?.successfulOrders ?? 32}</div><div className="text-xs text-gray-600">Completed</div></div>
            <div><div className="text-white font-bold">{trust?.disputes ?? 1}</div><div className="text-xs text-gray-600">Disputes</div></div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Package, label: 'Active Orders', value: '2', color: 'bg-blue-600/20', glow: 'glow-blue' },
            { icon: Lock, label: 'Escrow Protected', value: '₹1,240', color: 'bg-purple-600/20', glow: 'glow-purple' },
            { icon: CheckCircle, label: 'Successful', value: '32', color: 'bg-green-600/20', glow: 'glow-green' },
            { icon: DollarSign, label: 'Total Spent', value: '₹12.4K', color: 'bg-amber-600/20', glow: 'glow-amber' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className={`stat-card ${stat.glow}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}><stat.icon className="w-4 h-4 text-white" /></div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Recent Orders */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">Recent Orders</h3>
            <Link href="/dashboard/customer/orders" className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {orders?.data?.length ? (
            <div className="space-y-3">
              {orders.data.slice(0, 5).map((order: any) => (
                <div key={order._id} className="flex items-center gap-4 p-3 glass rounded-xl hover:bg-white/3 transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{order.items?.length} items • ₹{order.totalAmount}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={statusColors[order.status] || 'badge-info'}>{order.status}</span>
                    <span className="text-xs text-gray-600">{order.createdAt ? format(new Date(order.createdAt), 'MMM d') : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No orders yet. Start shopping!</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
