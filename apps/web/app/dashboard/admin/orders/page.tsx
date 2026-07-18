'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Package, Search, Filter, RefreshCw, Eye, CheckCircle, Clock, XCircle, Truck } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; class: string }> = {
  delivered:   { label: 'Delivered',   class: 'badge-success' },
  in_transit:  { label: 'In Transit',  class: 'badge-info' },
  pending:     { label: 'Pending',     class: 'badge-warning' },
  confirmed:   { label: 'Confirmed',   class: 'badge-purple' },
  cancelled:   { label: 'Cancelled',   class: 'badge-danger' },
  preparing:   { label: 'Preparing',   class: 'badge-warning' },
};

export default function AdminOrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', page, statusFilter],
    queryFn: () => api.get(`/orders/all?page=${page}&limit=15${statusFilter ? `&status=${statusFilter}` : ''}`).then(r => r.data),
    staleTime: 10000,
  });

  const orders = data?.data ?? [];
  const total = data?.total ?? 0;

  const filtered = search
    ? orders.filter((o: any) => o.orderNumber?.toLowerCase().includes(search.toLowerCase()))
    : orders;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <p className="text-gray-500 text-sm mt-1">Manage and monitor all platform orders</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Package, label: 'Total', value: total || orders.length, color: 'bg-blue-600/20 glow-blue' },
          { icon: Truck, label: 'In Transit', value: orders.filter((o: any) => o.status === 'in_transit').length, color: 'bg-amber-600/20 glow-amber' },
          { icon: CheckCircle, label: 'Delivered', value: orders.filter((o: any) => o.status === 'delivered').length, color: 'bg-green-600/20 glow-green' },
          { icon: XCircle, label: 'Cancelled', value: orders.filter((o: any) => o.status === 'cancelled').length, color: 'bg-red-600/20' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`stat-card ${s.color}`}>
            <s.icon className="w-5 h-5 text-white mb-2 opacity-70" />
            <div className="text-2xl font-black text-white">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order number..."
            className="w-full bg-white/5 border border-white/8 rounded-xl py-2.5 pl-9 pr-4 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/40"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/8 rounded-xl py-2.5 px-4 text-sm text-gray-300 focus:outline-none focus:border-blue-500/40"
        >
          <option value="">All Statuses</option>
          {Object.keys(statusConfig).map(s => <option key={s} value={s}>{statusConfig[s].label}</option>)}
        </select>
        <button onClick={() => refetch()} className="btn-ghost flex items-center gap-2 text-sm px-4 py-2.5">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-4">Order</th>
                <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-4">Customer</th>
                <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-4">Amount</th>
                <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-4">Status</th>
                <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-4">Date</th>
                <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-white/5 rounded w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((order: any, i: number) => (
                  <motion.tr
                    key={order._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-white/2 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="font-mono text-blue-400 text-xs">{order.orderNumber}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{order.items?.length} items</div>
                    </td>
                    <td className="px-5 py-4 text-gray-300 text-xs">
                      {order.customerId?.firstName || 'Customer'} {order.customerId?.lastName || ''}
                    </td>
                    <td className="px-5 py-4 text-white font-semibold">₹{order.totalAmount?.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className={statusConfig[order.status]?.class || 'badge-info'}>
                        {statusConfig[order.status]?.label || order.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {order.createdAt ? format(new Date(order.createdAt), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <button className="text-gray-500 hover:text-blue-400 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-gray-600">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No orders found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {total > 15 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-white/5">
            <p className="text-xs text-gray-500">Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, total)} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 15 >= total} className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
