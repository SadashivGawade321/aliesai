'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Shield, Zap, Lock, BarChart3, TrendingUp, CheckCircle,
  ArrowRight, Globe, Users, CreditCard, Brain,
} from 'lucide-react';

const features = [
  { icon: Lock, title: 'Programmable Escrow', desc: 'Hold funds securely until real-world conditions are met', color: 'text-blue-400', glow: 'glow-blue' },
  { icon: Brain, title: 'AI Fraud Detection', desc: 'XGBoost models detect fake deliveries, GPS mismatch, velocity attacks', color: 'text-purple-400', glow: 'glow-purple' },
  { icon: Zap, title: 'Instant Settlement', desc: 'OTP-verified delivery triggers automatic fund release in milliseconds', color: 'text-cyan-400', glow: 'glow-blue' },
  { icon: Shield, title: 'Trust Score Engine', desc: 'Every entity earns a 0-100 trust score updated in real-time', color: 'text-green-400', glow: 'glow-green' },
  { icon: BarChart3, title: 'AI Dispute Resolution', desc: 'Explainable AI decisions for every dispute with audit trail', color: 'text-amber-400', glow: 'glow-amber' },
  { icon: CreditCard, title: 'Micro Insurance Pool', desc: '0.5% risk contribution protects every transaction automatically', color: 'text-pink-400', glow: 'glow-purple' },
];

const stats = [
  { label: 'Transactions Protected', value: '₹2.4B+' },
  { label: 'Fraud Prevented', value: '₹120M+' },
  { label: 'Disputes Resolved (AI)', value: '98.2%' },
  { label: 'Avg Settlement Time', value: '<2s' },
];

const escrowStates = [
  { state: 'PAYMENT_CREATED', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
  { state: 'PAYMENT_LOCKED', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { state: 'IN_TRANSIT', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { state: 'OTP_PENDING', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { state: 'VERIFIED', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { state: 'SETTLED', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#030712] overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-cyan-600/08 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/5">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-glow-pulse">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">AegisPay AI</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <Link href="/auth/login" className="btn-ghost text-sm">Sign In</Link>
          <Link href="/auth/register" className="btn-primary text-sm">Get Started</Link>
        </motion.div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-8 pt-24 pb-20 text-center max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 text-sm text-blue-400 font-medium mb-8">
            <Zap className="w-4 h-4" />
            AI-Powered Escrow & Settlement Infrastructure
          </div>

          <h1 className="text-6xl md:text-8xl font-black leading-none mb-6">
            <span className="text-white">Programmable</span>
            <br />
            <span className="gradient-text">Trust</span>
            <span className="text-white"> for Every</span>
            <br />
            <span className="text-white">Transaction</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            AegisPay AI holds funds in escrow and automatically releases, splits, refunds or
            settles payments based on verified real-world events, fraud scores, and AI decisions.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/auth/register" className="btn-primary text-base flex items-center gap-2">
              Start Building <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/auth/login" className="btn-ghost border border-white/10 text-base flex items-center gap-2">
              Live Demo <Globe className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Escrow State Flow */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-20 glass rounded-3xl p-8 border-gradient"
        >
          <p className="text-sm text-gray-500 uppercase tracking-widest mb-6 font-medium">Escrow State Machine</p>
          <div className="flex items-center justify-center flex-wrap gap-3">
            {escrowStates.map((s, i) => (
              <motion.div
                key={s.state}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className={`escrow-state border ${s.color}`}
              >
                {s.state}
              </motion.div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mt-4 text-gray-600 text-sm">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
            <span>Automatic progression via AI + OTP</span>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 px-8 py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="stat-card text-center"
            >
              <div className="text-3xl font-black gradient-text mb-2">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Enterprise-Grade <span className="gradient-text">AI Infrastructure</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Built for food delivery, logistics, gig economy, and marketplace transactions
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass-card group cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${feature.glow}`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-white font-semibold mb-2 text-lg">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-8 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto glass rounded-3xl p-16 text-center border-gradient"
        >
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-8 animate-float">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-5xl font-black text-white mb-4">
            Ready to <span className="gradient-text">Secure</span> Your Transactions?
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Join the platform that gives every transaction programmable trust, AI-backed fraud detection, and instant settlement.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/auth/register" className="btn-primary text-lg px-8 py-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Get Started Free
            </Link>
          </div>
          <p className="text-gray-600 text-sm mt-6">
            Default admin: admin@aegispay.ai / Admin@123456
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-8 py-8 text-center text-gray-600 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-4 h-4" />
          <span className="font-semibold text-gray-400">AegisPay AI</span>
        </div>
        <p>"Programmable Trust for Every Transaction"</p>
      </footer>
    </div>
  );
}
