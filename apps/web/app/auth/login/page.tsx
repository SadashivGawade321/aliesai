'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, Lock, Mail, ArrowRight, Zap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api/client';

const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const demoAccounts = [
  { label: 'Super Admin', email: 'admin@aegispay.ai', role: 'admin' },
  { label: 'Customer', email: 'customer@aegispay.ai', role: 'customer' },
  { label: 'Merchant', email: 'merchant@aegispay.ai', role: 'merchant' },
  { label: 'Driver', email: 'driver@aegispay.ai', role: 'driver' },
];

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const fillDemo = (email: string) => {
    setValue('email', email);
    setValue('password', 'Admin@123456');
    setError('');
  };

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', data);
      setAuth(res.data.accessToken, res.data.user);
      const role = res.data.user.role;
      const roleRouteMap: Record<string, string> = {
        super_admin: '/dashboard/admin',
        admin: '/dashboard/admin',
        customer: '/dashboard/customer',
        merchant: '/dashboard/merchant',
        delivery_partner: '/dashboard/driver',
      };
      const dest = roleRouteMap[role] || '/dashboard/customer';
      router.push(dest);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #07070f 0%, #0d1117 40%, #0a0f1a 100%)' }}>
      {/* Ambient glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-[0.05]" style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ background: 'linear-gradient(135deg, #3b82f6, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                AegisPay AI
              </h1>
            </div>
          </motion.div>
          <p className="text-sm" style={{ color: '#64748b' }}>Programmable Trust for Every Transaction</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border p-8" style={{
          background: 'rgba(255,255,255,0.02)',
          borderColor: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
            <p className="text-sm" style={{ color: '#64748b' }}>Sign in to your account</p>
          </div>

          {/* Quick Demo */}
          <div className="mb-6">
            <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: '#475569' }}>Quick Demo Access</p>
            <div className="flex gap-2 flex-wrap">
              {demoAccounts.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => fillDemo(d.email)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200"
                  style={{
                    background: 'rgba(59,130,246,0.08)',
                    border: '1px solid rgba(59,130,246,0.15)',
                    color: '#60a5fa',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.15)';
                    e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(59,130,246,0.15)';
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#475569' }} />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(59,130,246,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              {errors.email && <p className="text-xs mt-1.5" style={{ color: '#f87171' }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#475569' }} />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(59,130,246,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors"
                  style={{ color: '#475569' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1.5" style={{ color: '#f87171' }}>{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                boxShadow: '0 4px 20px rgba(59,130,246,0.25)',
              }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </motion.button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#64748b' }}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="font-medium" style={{ color: '#60a5fa' }}>Create one</Link>
          </p>
        </div>

        {/* Demo hint */}
        <div className="text-center mt-4 flex items-center justify-center gap-2 text-xs" style={{ color: '#475569' }}>
          <Zap className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
          All passwords for demo: <span className="font-mono" style={{ color: '#64748b' }}>Admin@123456</span>
        </div>
      </motion.div>
    </div>
  );
}
