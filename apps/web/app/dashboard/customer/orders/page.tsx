'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Package, Search, Filter, CheckCircle, Truck, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

const statusConfig: Record<string, { label: string; class: string; icon: any }> = {
  delivered:  { label: 'Delivered',  class: 'badge-success', icon: CheckCircle },
  in_transit: { label: 'In Transit', class: 'badge-info',    icon: Truck },
  pending:    { label: 'Pending',    class: 'badge-warning', icon: Clock },
  confirmed:  { label: 'Confirmed',  class: 'badge-purple',  icon: CheckCircle },
  cancelled:  { label: 'Cancelled', class: 'badge-danger',  icon: XCircle },
};

export default function CustomerOrdersPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders-full'],
    queryFn: () => api.get('/orders?limit=50').then(r => r.data),
    staleTime: 15000,
  });

  const orders: any[] = data?.data ?? [];
  const filtered = orders.filter(o => {
    const matchTab = tab === 'all' || o.status === tab || (tab === 'active' && ['pending', 'confirmed', 'in_transit'].includes(o.status));
    const matchSearch = !search || o.orderNumber?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#030712]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/08 rounded-full blur-3xl" />
      </div>

      <header className="relative z-10 glass border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard/customer" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold gradient-text">AegisPay AI</span>
        </Link>
        <nav className="ml-4 hidden md:flex items-center gap-2">
          {[
            { label: 'Home', href: '/dashboard/customer' },
            { label: 'Orders', href: '/dashboard/customer/orders' },
            { label: 'Escrow', href: '/dashboard/customer/escrow' },
          ].map(item => (
            <Link key={item.href} href={item.href} className={`sidebar-item text-sm px-3 py-2 ${item.href === '/dashboard/customer/orders' ? 'active' : ''}`}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white">My Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Track all your deliveries in one place</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'delivered', label: 'Delivered' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`text-sm px-4 py-2 rounded-xl font-medium transition-all ${tab === t.key ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-500 hover:text-white glass border border-white/5'}`}
            >
              {t.label}
            </button>
          ))}
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="bg-white/5 border border-white/8 rounded-xl py-2 pl-9 pr-4 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/40"
            />
          </div>
        </div>

        {/* Orders */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass-card animate-pulse h-24" />
            ))
          ) : filtered.length > 0 ? (
            filtered.map((order: any, i: number) => {
              const cfg = statusConfig[order.status] ?? statusConfig.pending;
              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-card hover:border-blue-500/20 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-white font-medium">{order.orderNumber}</span>
                        <span className={cfg.class}>{cfg.label}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {order.items?.length ?? 0} items • ₹{order.totalAmount?.toLocaleString()} •{' '}
                        {order.createdAt ? format(new Date(order.createdAt), 'MMM d, yyyy, hh:mm a') : ''}
                      </p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {order.items?.slice(0, 3).map((item: any, j: number) => (
                          <span key={j} className="text-xs px-2 py-0.5 bg-white/5 rounded-md text-gray-400">
                            {item.name} ×{item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-white font-bold">₹{order.totalAmount?.toLocaleString()}</div>
                      {order.status === 'in_transit' && (
                        <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                          Live tracking
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="glass-card text-center py-16 text-gray-600">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No orders found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
