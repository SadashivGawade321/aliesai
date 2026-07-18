'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Shield, TrendingUp, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const claimHistory = [
  { id: 'CLM-001', order: 'AGP-2024-0028', amount: 950, reason: 'Not Delivered', status: 'approved', date: '2024-01-14' },
  { id: 'CLM-002', order: 'AGP-2024-0022', amount: 540, reason: 'Wrong Item', status: 'approved', date: '2024-01-12' },
  { id: 'CLM-003', order: 'AGP-2024-0018', amount: 1200, reason: 'Late Delivery', status: 'rejected', date: '2024-01-10' },
  { id: 'CLM-004', order: 'AGP-2024-0011', amount: 780, reason: 'Quality Issue', status: 'approved', date: '2024-01-07' },
  { id: 'CLM-005', order: 'AGP-2024-0006', amount: 320, reason: 'Not Delivered', status: 'pending', date: '2024-01-05' },
];

const poolDistribution = [
  { name: 'Available', value: 15420, color: '#22c55e' },
  { name: 'Reserved for Claims', value: 3200, color: '#f59e0b' },
  { name: 'Paid Out', value: 6579, color: '#ef4444' },
];

export default function AdminInsurancePage() {
  const { data: pool } = useQuery({
    queryKey: ['insurance-pool'],
    queryFn: () => api.get('/insurance/pool').then(r => r.data).catch(() => null),
    staleTime: 30000,
  });

  const poolBalance = pool?.totalBalance ?? 15420.50;
  const totalContributions = pool?.totalContributions ?? 22000;
  const totalClaims = pool?.totalClaims ?? 12;
  const lossRatio = pool?.lossRatio ?? 0.299;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Shield className="w-6 h-6 text-green-400" /> Insurance Pool
        </h1>
        <p className="text-gray-500 text-sm mt-1">Micro-insurance pool funded by 0.5% transaction contributions</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'Pool Balance', value: `₹${poolBalance.toLocaleString()}`, color: 'bg-green-600/20 glow-green' },
          { icon: TrendingUp, label: 'Total Contributions', value: `₹${totalContributions.toLocaleString()}`, color: 'bg-blue-600/20 glow-blue' },
          { icon: CheckCircle, label: 'Claims Paid', value: totalClaims, color: 'bg-purple-600/20 glow-purple' },
          { icon: AlertCircle, label: 'Loss Ratio', value: `${(lossRatio * 100).toFixed(1)}%`, color: 'bg-amber-600/20 glow-amber' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`stat-card ${s.color}`}>
            <s.icon className="w-5 h-5 text-white mb-2 opacity-70" />
            <div className="text-xl font-black text-white">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pool Chart */}
        <div className="chart-card">
          <h3 className="text-white font-semibold mb-4">Pool Distribution</h3>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={poolDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {poolDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {poolDistribution.map(d => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-sm text-gray-400">{d.name}</span>
                  </div>
                  <span className="text-white font-semibold text-sm">₹{d.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contribution Rate */}
        <div className="glass-card">
          <h3 className="text-white font-semibold mb-4">Pool Health</h3>
          <div className="space-y-4">
            {[
              { label: 'Solvency Ratio', value: 85, color: '#22c55e', status: 'Healthy' },
              { label: 'Claim Acceptance', value: 78, color: '#3b82f6', status: 'Normal' },
              { label: 'Reserve Coverage', value: 92, color: '#a855f7', status: 'Strong' },
            ].map(metric => (
              <div key={metric.label}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-400">{metric.label}</span>
                  <span className="text-white font-medium">{metric.value}% — <span style={{ color: metric.color }}>{metric.status}</span></span>
                </div>
                <div className="bg-white/5 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.value}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="h-full rounded-full"
                    style={{ background: metric.color }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-white/5">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Pool is actively growing at 0.5% per transaction
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Claims Table */}
      <div className="glass-card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-white font-semibold">Claim History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Claim ID', 'Order', 'Amount', 'Reason', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {claimHistory.map((c, i) => (
                <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-white/2">
                  <td className="px-5 py-4 font-mono text-xs text-blue-400">{c.id}</td>
                  <td className="px-5 py-4 font-mono text-xs text-gray-400">{c.order}</td>
                  <td className="px-5 py-4 text-white font-semibold">₹{c.amount}</td>
                  <td className="px-5 py-4 text-gray-400 text-xs">{c.reason}</td>
                  <td className="px-5 py-4">
                    <span className={c.status === 'approved' ? 'badge-success' : c.status === 'rejected' ? 'badge-danger' : 'badge-warning'}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{c.date}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
