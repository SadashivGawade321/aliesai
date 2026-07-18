'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield, Package, Lock, DollarSign, AlertTriangle, Brain,
  Users, BarChart3, FileText, Settings, Home, LogOut, Bell, Activity,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';

const navItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard/admin' },
  { icon: Package, label: 'Orders', href: '/dashboard/admin/orders' },
  { icon: Lock, label: 'Escrow', href: '/dashboard/admin/escrow' },
  { icon: DollarSign, label: 'Settlements', href: '/dashboard/admin/settlements' },
  { icon: AlertTriangle, label: 'Fraud Cases', href: '/dashboard/admin/fraud', badge: '4' },
  { icon: Brain, label: 'AI Disputes', href: '/dashboard/admin/disputes' },
  { icon: Shield, label: 'Insurance Pool', href: '/dashboard/admin/insurance' },
  { icon: Users, label: 'Users', href: '/dashboard/admin/users' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/admin/analytics' },
  { icon: FileText, label: 'Audit Logs', href: '/dashboard/admin/audit' },
  { icon: Settings, label: 'Settings', href: '/dashboard/admin/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => { logout(); router.push('/auth/login'); };

  return (
    <div className="min-h-screen bg-[#030712] flex">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -264 }}
            animate={{ x: 0 }}
            exit={{ x: -264 }}
            className="sidebar fixed left-0 top-0 h-full z-20 w-64 flex flex-col"
          >
            <div className="p-6 border-b border-white/5">
              <Link href="/dashboard/admin" className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold gradient-text">AegisPay AI</div>
                  <div className="text-xs text-gray-600">Admin Portal</div>
                </div>
              </Link>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={`sidebar-item ${isActive ? 'active' : ''}`}>
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 text-sm">{item.label}</span>
                      {item.badge && (
                        <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/5">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{user?.firstName} {user?.lastName}</div>
                  <div className="text-xs text-gray-500 truncate">{user?.role?.replace('_', ' ')}</div>
                </div>
                <button onClick={handleLogout} className="text-gray-600 hover:text-red-400 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className={`flex-1 transition-all duration-300 min-h-screen ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <header className="sticky top-0 z-10 glass border-b border-white/5 px-6 py-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-white transition-colors">
            <div className="w-5 h-0.5 bg-current mb-1" />
            <div className="w-5 h-0.5 bg-current mb-1" />
            <div className="w-5 h-0.5 bg-current" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5">
              <Activity className="w-3 h-3 text-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Live</span>
            </div>
            <button className="relative text-gray-500 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">4</span>
            </button>
          </div>
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
