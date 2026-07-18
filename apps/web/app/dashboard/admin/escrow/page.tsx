'use client';

import { motion } from 'framer-motion';
import { Lock, CheckCircle, Clock, AlertCircle, DollarSign, RefreshCw, ArrowRight } from 'lucide-react';

const mockEscrows = [
  { id: 'ESC-A3F9B2', order: 'AGP-2024-0041', amount: 2340, status: 'locked', merchant: 'Priya Merchants', created: '2024-01-15' },
  { id: 'ESC-B7D3C1', order: 'AGP-2024-0039', amount: 1260, status: 'otp_pending', merchant: 'Priya Merchants', created: '2024-01-15' },
  { id: 'ESC-C9E5A4', order: 'AGP-2024-0037', amount: 850, status: 'settled', merchant: 'Priya Merchants', created: '2024-01-14' },
  { id: 'ESC-D2F8B6', order: 'AGP-2024-0036', amount: 3200, status: 'disputed', merchant: 'Priya Merchants', created: '2024-01-14' },
  { id: 'ESC-E4A1C8', order: 'AGP-2024-0034', amount: 1890, status: 'refunded', merchant: 'Priya Merchants', created: '2024-01-13' },
  { id: 'ESC-F6D0E2', order: 'AGP-2024-0033', amount: 720, status: 'settled', merchant: 'Priya Merchants', created: '2024-01-13' },
  { id: 'ESC-G8B2F4', order: 'AGP-2024-0030', amount: 4100, status: 'locked', merchant: 'Priya Merchants', created: '2024-01-12' },
];

const statusConfig: Record<string, { label: string; class: string; icon: any }> = {
  locked:      { label: 'Locked',      class: 'badge-info',    icon: Lock },
  otp_pending: { label: 'OTP Pending', class: 'badge-purple',  icon: Clock },
  settled:     { label: 'Settled',     class: 'badge-success', icon: CheckCircle },
  disputed:    { label: 'Disputed',    class: 'badge-danger',  icon: AlertCircle },
  refunded:    { label: 'Refunded',    class: 'badge-warning', icon: RefreshCw },
};

const stateFlow = ['PAYMENT_CREATED', 'PAYMENT_LOCKED', 'IN_TRANSIT', 'OTP_PENDING', 'VERIFIED', 'SETTLED'];

export default function AdminEscrowPage() {
  const totalLocked = mockEscrows.filter(e => e.status === 'locked' || e.status === 'otp_pending').reduce((s, e) => s + e.amount, 0);
  const totalSettled = mockEscrows.filter(e => e.status === 'settled').reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Escrow Management</h1>
        <p className="text-gray-500 text-sm mt-1">Monitor locked funds, OTP status, and settlement pipeline</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Locked', value: `₹${totalLocked.toLocaleString()}`, icon: Lock, color: 'bg-blue-600/20 glow-blue' },
          { label: 'OTP Pending', value: mockEscrows.filter(e => e.status === 'otp_pending').length, icon: Clock, color: 'bg-purple-600/20 glow-purple' },
          { label: 'Settled Today', value: `₹${totalSettled.toLocaleString()}`, icon: CheckCircle, color: 'bg-green-600/20 glow-green' },
          { label: 'Disputed', value: mockEscrows.filter(e => e.status === 'disputed').length, icon: AlertCircle, color: 'bg-red-600/20' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`stat-card ${s.color}`}>
            <s.icon className="w-5 h-5 text-white mb-2 opacity-70" />
            <div className="text-xl font-black text-white">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* State Machine */}
      <div className="glass-card">
        <h3 className="text-white font-semibold mb-4">Escrow State Machine</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {stateFlow.map((state, i) => (
            <div key={state} className="flex items-center gap-2">
              <span className="text-xs px-3 py-1.5 rounded-lg border font-mono"
                style={{ background: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                {state}
              </span>
              {i < stateFlow.length - 1 && <ArrowRight className="w-3 h-3 text-gray-600" />}
            </div>
          ))}
        </div>
      </div>

      {/* Escrow Table */}
      <div className="glass-card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-white font-semibold">Active Escrow Accounts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-4">Escrow ID</th>
                <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-4">Order</th>
                <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-4">Amount</th>
                <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-4">Status</th>
                <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockEscrows.map((e, i) => {
                const cfg = statusConfig[e.status];
                return (
                  <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-white/2">
                    <td className="px-5 py-4 font-mono text-blue-400 text-xs">{e.id}</td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-400">{e.order}</td>
                    <td className="px-5 py-4 text-white font-semibold">₹{e.amount.toLocaleString()}</td>
                    <td className="px-5 py-4"><span className={cfg?.class}>{cfg?.label}</span></td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{e.created}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
