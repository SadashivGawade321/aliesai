'use client';

import { motion } from 'framer-motion';
import { Brain, CheckCircle, Clock, AlertCircle, Zap, FileText } from 'lucide-react';

const disputes = [
  { id: 'DR-2024-021', order: 'AGP-2024-0038', type: 'Not Delivered', claimant: 'Arjun Sharma', amount: 1860, status: 'ai_resolved', decision: 'Refund Approved', confidence: 94, time: '1m ago' },
  { id: 'DR-2024-020', order: 'AGP-2024-0035', type: 'Wrong Item', claimant: 'Priya Patel', amount: 950, status: 'pending', decision: null, confidence: null, time: '15m ago' },
  { id: 'DR-2024-019', order: 'AGP-2024-0031', type: 'Late Delivery', claimant: 'Rohan Mehta', amount: 720, status: 'ai_resolved', decision: 'Partial Refund 50%', confidence: 87, time: '24m ago' },
  { id: 'DR-2024-018', order: 'AGP-2024-0028', type: 'Quality Issue', claimant: 'Sneha Gupta', amount: 540, status: 'escalated', decision: null, confidence: null, time: '2h ago' },
  { id: 'DR-2024-017', order: 'AGP-2024-0024', type: 'Not Delivered', claimant: 'Amit Kumar', amount: 1240, status: 'ai_resolved', decision: 'Merchant Favored', confidence: 91, time: '3h ago' },
];

const statusCfg: Record<string, { label: string; class: string; icon: any }> = {
  ai_resolved: { label: 'AI Resolved', class: 'badge-success', icon: Brain },
  pending:     { label: 'Pending',     class: 'badge-warning', icon: Clock },
  escalated:   { label: 'Escalated',  class: 'badge-danger',  icon: AlertCircle },
};

export default function AdminDisputesPage() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Brain className="w-6 h-6 text-purple-400" /> AI Dispute Resolution
        </h1>
        <p className="text-gray-500 text-sm mt-1">AI-powered dispute decisions with explainability</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'AI Resolved', value: '98.2%', color: 'bg-green-600/20 glow-green', sub: 'This month' },
          { label: 'Avg. Resolution', value: '1.4s', color: 'bg-blue-600/20 glow-blue', sub: 'AI processing time' },
          { label: 'Pending Review', value: disputes.filter(d => d.status === 'pending').length, color: 'bg-amber-600/20 glow-amber', sub: 'Awaiting AI' },
          { label: 'Escalated', value: disputes.filter(d => d.status === 'escalated').length, color: 'bg-red-600/20', sub: 'Human needed' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`stat-card ${s.color}`}>
            <div className="text-2xl font-black text-white mb-1">{s.value}</div>
            <div className="text-xs text-gray-400 font-medium">{s.label}</div>
            <div className="text-xs text-gray-600 mt-0.5">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* AI Explanation Banner */}
      <div className="glass rounded-2xl p-5 border border-purple-500/20 bg-purple-500/5">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <span className="text-purple-400 font-semibold text-sm">How AI Resolution Works</span>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">
          AegisPay AI analyzes GPS data, OTP logs, merchant history, customer trust score, and order evidence to
          make explainable decisions in under 2 seconds. Each decision includes a confidence score and reasoning trail.
        </p>
      </div>

      <div className="space-y-4">
        {disputes.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-sm text-blue-400">{d.id}</span>
                  <span className={statusCfg[d.status]?.class}>{statusCfg[d.status]?.label}</span>
                </div>
                <p className="text-white font-medium text-sm">{d.type} — {d.order}</p>
                <p className="text-gray-500 text-xs mt-1">Filed by {d.claimant} • ₹{d.amount.toLocaleString()} • {d.time}</p>
              </div>

              {d.status === 'ai_resolved' && d.decision && (
                <div className="flex-shrink-0">
                  <div className="glass rounded-xl px-4 py-3 border border-white/8 text-center">
                    <div className="flex items-center gap-2 text-green-400 text-xs font-medium mb-1">
                      <Zap className="w-3 h-3" /> AI Decision
                    </div>
                    <div className="text-white text-sm font-semibold">{d.decision}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{d.confidence}% confidence</div>
                    <div className="mt-2 bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${d.confidence}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {d.status === 'pending' && (
                <div className="flex-shrink-0">
                  <div className="glass rounded-xl px-4 py-3 border border-amber-500/20 text-center">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-medium mb-1">
                      <Clock className="w-3 h-3 animate-pulse" /> Processing
                    </div>
                    <div className="text-gray-400 text-xs">AI analyzing evidence...</div>
                    <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full w-1/2 animate-pulse" />
                    </div>
                  </div>
                </div>
              )}

              {d.status === 'escalated' && (
                <div className="flex-shrink-0">
                  <div className="glass rounded-xl px-4 py-3 border border-red-500/20 text-center">
                    <div className="flex items-center gap-2 text-red-400 text-xs font-medium mb-1">
                      <AlertCircle className="w-3 h-3" /> Escalated
                    </div>
                    <button className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 mx-auto mt-1">
                      <FileText className="w-3 h-3" /> Review
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
