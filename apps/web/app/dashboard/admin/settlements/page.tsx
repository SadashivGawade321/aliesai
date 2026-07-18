'use client';

import { motion } from 'framer-motion';
import { DollarSign, CheckCircle, Clock, TrendingUp, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const settlements = [
  { id: 'SET-001', merchant: 'Priya Merchants', amount: 18240, orders: 24, status: 'completed', date: '2024-01-15' },
  { id: 'SET-002', merchant: 'Priya Merchants', amount: 12560, orders: 18, status: 'pending', date: '2024-01-14' },
  { id: 'SET-003', merchant: 'Priya Merchants', amount: 22100, orders: 31, status: 'completed', date: '2024-01-13' },
  { id: 'SET-004', merchant: 'Priya Merchants', amount: 9870, orders: 14, status: 'processing', date: '2024-01-12' },
  { id: 'SET-005', merchant: 'Priya Merchants', amount: 31400, orders: 42, status: 'completed', date: '2024-01-11' },
];

const weeklyData = [
  { day: 'Mon', amount: 18240 },
  { day: 'Tue', amount: 22100 },
  { day: 'Wed', amount: 15800 },
  { day: 'Thu', amount: 28900 },
  { day: 'Fri', amount: 31400 },
  { day: 'Sat', amount: 24700 },
  { day: 'Sun', amount: 12300 },
];

const statusConfig: Record<string, { label: string; class: string }> = {
  completed:  { label: 'Completed',  class: 'badge-success' },
  pending:    { label: 'Pending',    class: 'badge-warning' },
  processing: { label: 'Processing', class: 'badge-info' },
  failed:     { label: 'Failed',     class: 'badge-danger' },
};

export default function AdminSettlementsPage() {
  const totalSettled = settlements.filter(s => s.status === 'completed').reduce((t, s) => t + s.amount, 0);
  const pendingAmt = settlements.filter(s => s.status !== 'completed').reduce((t, s) => t + s.amount, 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Settlements</h1>
        <p className="text-gray-500 text-sm mt-1">Manage merchant payouts and settlement rules</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'Total Settled', value: `₹${(totalSettled / 1000).toFixed(1)}K`, color: 'bg-green-600/20 glow-green' },
          { icon: Clock, label: 'Pending', value: `₹${(pendingAmt / 1000).toFixed(1)}K`, color: 'bg-amber-600/20 glow-amber' },
          { icon: CheckCircle, label: 'Completed', value: settlements.filter(s => s.status === 'completed').length, color: 'bg-blue-600/20 glow-blue' },
          { icon: TrendingUp, label: 'Avg. Per Day', value: '₹21.9K', color: 'bg-purple-600/20 glow-purple' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`stat-card ${s.color}`}>
            <s.icon className="w-5 h-5 text-white mb-2 opacity-70" />
            <div className="text-xl font-black text-white">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="chart-card">
        <h3 className="text-white font-semibold mb-4">Weekly Settlement Volume</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#94a3b8' }} />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="#22c55e" fillOpacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-white font-semibold">Settlement History</h3>
          <button className="btn-ghost text-xs flex items-center gap-2 px-3 py-1.5">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Settlement ID', 'Merchant', 'Amount', 'Orders', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {settlements.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-white/2">
                  <td className="px-5 py-4 font-mono text-blue-400 text-xs">{s.id}</td>
                  <td className="px-5 py-4 text-gray-300 text-xs">{s.merchant}</td>
                  <td className="px-5 py-4 text-white font-semibold">₹{s.amount.toLocaleString()}</td>
                  <td className="px-5 py-4 text-gray-400">{s.orders}</td>
                  <td className="px-5 py-4"><span className={statusConfig[s.status]?.class}>{statusConfig[s.status]?.label}</span></td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{s.date}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
