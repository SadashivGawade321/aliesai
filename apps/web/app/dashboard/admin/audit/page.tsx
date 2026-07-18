'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { FileText, Search, Shield, User, Package, Lock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const actionIcons: Record<string, any> = {
  login: User,
  logout: User,
  order: Package,
  escrow: Lock,
  fraud: AlertTriangle,
  user: User,
  default: FileText,
};

const actionColors: Record<string, string> = {
  login: 'text-green-400 bg-green-400/10',
  logout: 'text-gray-400 bg-gray-400/10',
  order_created: 'text-blue-400 bg-blue-400/10',
  fraud_flagged: 'text-red-400 bg-red-400/10',
  escrow_settled: 'text-green-400 bg-green-400/10',
  user_activated: 'text-cyan-400 bg-cyan-400/10',
  dispute_resolved: 'text-purple-400 bg-purple-400/10',
  default: 'text-gray-400 bg-gray-400/10',
};

const mockLogs = [
  { _id: '1', action: 'login', actor: 'admin@aegispay.ai', role: 'super_admin', details: 'Admin login from 192.168.1.1', ipAddress: '192.168.1.1', createdAt: new Date(Date.now() - 2 * 60000).toISOString() },
  { _id: '2', action: 'fraud_flagged', actor: 'system', role: 'system', details: 'Fraud detected on Order AGP-2024-0041 — score 94', ipAddress: 'internal', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
  { _id: '3', action: 'escrow_settled', actor: 'system', role: 'system', details: 'Escrow ESC-A3F9B2 settled — ₹2,340 released to merchant', ipAddress: 'internal', createdAt: new Date(Date.now() - 12 * 60000).toISOString() },
  { _id: '4', action: 'order_created', actor: 'customer@aegispay.ai', role: 'customer', details: 'Order AGP-2024-0041 created — ₹840', ipAddress: '10.0.0.2', createdAt: new Date(Date.now() - 18 * 60000).toISOString() },
  { _id: '5', action: 'dispute_resolved', actor: 'ai-engine', role: 'system', details: 'AI resolved dispute DR-2024-019 — Refund Approved (94% confidence)', ipAddress: 'internal', createdAt: new Date(Date.now() - 24 * 60000).toISOString() },
  { _id: '6', action: 'user_activated', actor: 'admin@aegispay.ai', role: 'super_admin', details: 'User driver@aegispay.ai status set to active', ipAddress: '192.168.1.1', createdAt: new Date(Date.now() - 60 * 60000).toISOString() },
  { _id: '7', action: 'login', actor: 'merchant@aegispay.ai', role: 'merchant', details: 'Merchant login from 10.0.0.5', ipAddress: '10.0.0.5', createdAt: new Date(Date.now() - 2 * 60 * 60000).toISOString() },
  { _id: '8', action: 'order_created', actor: 'customer@aegispay.ai', role: 'customer', details: 'Order AGP-2024-0039 created — ₹1,260', ipAddress: '10.0.0.2', createdAt: new Date(Date.now() - 3 * 60 * 60000).toISOString() },
];

export default function AdminAuditPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => api.get('/admin/audit-logs?limit=50').then(r => r.data).catch(() => ({ data: mockLogs })),
    staleTime: 15000,
    refetchInterval: 30000,
  });

  const logs: any[] = data?.data ?? mockLogs;
  const filtered = search
    ? logs.filter((l: any) => `${l.action} ${l.actor} ${l.details}`.toLowerCase().includes(search.toLowerCase()))
    : logs;

  const getActionIcon = (action: string) => {
    const key = Object.keys(actionIcons).find(k => action?.includes(k)) ?? 'default';
    return actionIcons[key];
  };

  const getActionColor = (action: string) => {
    return actionColors[action] ?? actionColors.default;
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <FileText className="w-6 h-6 text-amber-400" /> Audit Logs
        </h1>
        <p className="text-gray-500 text-sm mt-1">Immutable trail of all platform events</p>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Events Today', value: logs.length, color: 'bg-blue-600/20' },
          { label: 'Admin Actions', value: logs.filter(l => l.role?.includes('admin')).length, color: 'bg-purple-600/20' },
          { label: 'System Events', value: logs.filter(l => l.role === 'system').length, color: 'bg-amber-600/20' },
          { label: 'Fraud Events', value: logs.filter(l => l.action?.includes('fraud')).length, color: 'bg-red-600/20' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`stat-card ${s.color}`}>
            <div className="text-2xl font-black text-white">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="glass-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events, actions, actors..."
            className="w-full bg-white/5 border border-white/8 rounded-xl py-2.5 pl-9 pr-4 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/40"
          />
        </div>
      </div>

      {/* Log Feed */}
      <div className="glass-card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <h3 className="text-white font-semibold">Live Event Stream</h3>
          <span className="text-xs text-gray-500 ml-auto">{filtered.length} events</span>
        </div>
        <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/5 rounded w-48" />
                  <div className="h-3 bg-white/5 rounded w-72" />
                </div>
              </div>
            ))
          ) : filtered.map((log: any, i: number) => {
            const ActionIcon = getActionIcon(log.action);
            const colorClass = getActionColor(log.action);
            return (
              <motion.div
                key={log._id ?? i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="px-5 py-4 flex items-start gap-4 hover:bg-white/2 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <ActionIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono font-semibold text-white uppercase tracking-wide">{log.action?.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-gray-600">•</span>
                    <span className="text-xs text-gray-500">{log.actor}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{log.details}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-600">{log.ipAddress}</span>
                    <span className="text-xs text-gray-600">
                      {log.createdAt ? format(new Date(log.createdAt), 'MMM d, HH:mm:ss') : '—'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
