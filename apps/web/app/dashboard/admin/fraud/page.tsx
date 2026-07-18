'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { AlertTriangle, Shield, Eye, CheckCircle, XCircle, Brain } from 'lucide-react';

const mockFraudCases = [
  { id: 'FC-2024-001', order: 'AGP-2024-0041', risk: 'CRITICAL', score: 94, reason: 'GPS mismatch + velocity attack', status: 'open', time: '2m ago', amount: 2340 },
  { id: 'FC-2024-002', order: 'AGP-2024-0038', risk: 'HIGH', score: 78, reason: 'Fake delivery OTP pattern', status: 'investigating', time: '18m ago', amount: 1860 },
  { id: 'FC-2024-003', order: 'AGP-2024-0035', risk: 'HIGH', score: 72, reason: 'Abnormal refund frequency', status: 'open', time: '1h ago', amount: 950 },
  { id: 'FC-2024-004', order: 'AGP-2024-0029', risk: 'MEDIUM', score: 58, reason: 'Unusual order timing pattern', status: 'resolved', time: '3h ago', amount: 720 },
  { id: 'FC-2024-005', order: 'AGP-2024-0024', risk: 'MEDIUM', score: 52, reason: 'Multiple account fingerprint', status: 'resolved', time: '5h ago', amount: 1100 },
  { id: 'FC-2024-006', order: 'AGP-2024-0019', risk: 'LOW', score: 31, reason: 'Slightly elevated risk score', status: 'dismissed', time: '8h ago', amount: 340 },
];

const riskConfig: Record<string, { label: string; class: string; color: string }> = {
  CRITICAL: { label: 'CRITICAL', class: 'badge-danger', color: 'text-red-400' },
  HIGH:     { label: 'HIGH',     class: 'badge-danger', color: 'text-orange-400' },
  MEDIUM:   { label: 'MEDIUM',  class: 'badge-warning', color: 'text-amber-400' },
  LOW:      { label: 'LOW',     class: 'badge-success', color: 'text-green-400' },
};

const statusCfg: Record<string, { label: string; class: string }> = {
  open:          { label: 'Open',          class: 'badge-danger' },
  investigating: { label: 'Investigating', class: 'badge-warning' },
  resolved:      { label: 'Resolved',      class: 'badge-success' },
  dismissed:     { label: 'Dismissed',     class: 'badge-info' },
};

export default function AdminFraudPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const openCases = mockFraudCases.filter(f => f.status === 'open' || f.status === 'investigating');

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400" /> Fraud Cases
        </h1>
        <p className="text-gray-500 text-sm mt-1">AI-detected fraud cases requiring review</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open Cases', value: openCases.length, color: 'bg-red-600/20', textColor: 'text-red-400' },
          { label: 'Critical', value: mockFraudCases.filter(f => f.risk === 'CRITICAL').length, color: 'bg-red-600/20', textColor: 'text-red-400' },
          { label: 'High Risk', value: mockFraudCases.filter(f => f.risk === 'HIGH').length, color: 'bg-orange-600/20', textColor: 'text-orange-400' },
          { label: 'Resolved', value: mockFraudCases.filter(f => f.status === 'resolved').length, color: 'bg-green-600/20', textColor: 'text-green-400' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`stat-card ${s.color}`}>
            <div className={`text-3xl font-black mb-1 ${s.textColor}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="xl:col-span-2 glass-card overflow-hidden p-0">
          <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
            <Brain className="w-4 h-4 text-purple-400" />
            <h3 className="text-white font-semibold">Fraud Case Queue</h3>
          </div>
          <div className="divide-y divide-white/5">
            {mockFraudCases.map((fc, i) => (
              <motion.div
                key={fc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(selected === fc.id ? null : fc.id)}
                className={`px-5 py-4 cursor-pointer transition-all hover:bg-white/2 ${selected === fc.id ? 'bg-white/3' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${fc.risk === 'CRITICAL' || fc.risk === 'HIGH' ? 'bg-red-500 animate-pulse' : fc.risk === 'MEDIUM' ? 'bg-amber-500' : 'bg-green-500'}`} />
                    <div>
                      <div className="text-sm font-mono text-white">{fc.id}</div>
                      <div className="text-xs text-gray-500">{fc.order} • {fc.time}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={riskConfig[fc.risk]?.class}>{fc.risk}</span>
                    <span className={statusCfg[fc.status]?.class}>{statusCfg[fc.status]?.label}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 ml-5">{fc.reason}</p>
                {selected === fc.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 ml-5 flex gap-2">
                    <button className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Resolve
                    </button>
                    <button className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Investigate
                    </button>
                    <button className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1 text-gray-500">
                      <XCircle className="w-3 h-3" /> Dismiss
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI Score Legend */}
        <div className="space-y-4">
          <div className="glass-card">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" /> AI Fraud Score
            </h3>
            <div className="space-y-3">
              {mockFraudCases.slice(0, 4).map(fc => (
                <div key={fc.id} className="flex items-center gap-3">
                  <div className="text-xs font-mono text-gray-500 w-16">{fc.id.slice(-3)}</div>
                  <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${fc.score}%`,
                        background: fc.score > 80 ? '#ef4444' : fc.score > 60 ? '#f59e0b' : '#22c55e',
                      }}
                    />
                  </div>
                  <div className={`text-xs font-bold w-8 ${riskConfig[fc.risk]?.color}`}>{fc.score}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card">
            <h3 className="text-white font-semibold mb-3">Risk Thresholds</h3>
            <div className="space-y-2 text-xs">
              {[
                { range: '80–100', label: 'CRITICAL — Auto Block', color: 'text-red-400' },
                { range: '60–79', label: 'HIGH — Manual Review', color: 'text-orange-400' },
                { range: '40–59', label: 'MEDIUM — Flag & Monitor', color: 'text-amber-400' },
                { range: '0–39', label: 'LOW — Pass', color: 'text-green-400' },
              ].map(t => (
                <div key={t.range} className="flex items-center gap-3">
                  <span className="font-mono text-gray-600 w-14">{t.range}</span>
                  <span className={t.color}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
