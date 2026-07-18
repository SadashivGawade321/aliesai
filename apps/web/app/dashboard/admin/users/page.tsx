'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Users, Search, Shield, Star, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';

const roleConfig: Record<string, { label: string; class: string }> = {
  super_admin:      { label: 'Super Admin',    class: 'badge-danger' },
  admin:            { label: 'Admin',          class: 'badge-warning' },
  merchant:         { label: 'Merchant',       class: 'badge-purple' },
  customer:         { label: 'Customer',       class: 'badge-info' },
  delivery_partner: { label: 'Driver',         class: 'badge-success' },
};

const mockUsers = [
  { _id: '1', firstName: 'Super', lastName: 'Admin', email: 'admin@aegispay.ai', role: 'super_admin', status: 'active', trustScore: null, createdAt: '2024-01-01' },
  { _id: '2', firstName: 'Arjun', lastName: 'Sharma', email: 'customer@aegispay.ai', role: 'customer', status: 'active', trustScore: 88, createdAt: '2024-01-05' },
  { _id: '3', firstName: 'Priya', lastName: 'Merchants', email: 'merchant@aegispay.ai', role: 'merchant', status: 'active', trustScore: 94, createdAt: '2024-01-03' },
  { _id: '4', firstName: 'Ravi', lastName: 'Driver', email: 'driver@aegispay.ai', role: 'delivery_partner', status: 'active', trustScore: 91, createdAt: '2024-01-04' },
  { _id: '5', firstName: 'Admin', lastName: 'User', email: 'admin2@aegispay.ai', role: 'admin', status: 'active', trustScore: null, createdAt: '2024-01-02' },
];

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then(r => r.data).catch(() => ({ data: mockUsers })),
    staleTime: 30000,
  });

  const users: any[] = data?.data ?? mockUsers;
  const filtered = users.filter(u =>
    (!search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())) &&
    (!roleFilter || u.role === roleFilter)
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-400" /> Users
        </h1>
        <p className="text-gray-500 text-sm mt-1">Manage platform users across all roles</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: users.length, color: 'bg-blue-600/20' },
          { label: 'Admins', value: users.filter(u => u.role.includes('admin')).length, color: 'bg-red-600/20' },
          { label: 'Customers', value: users.filter(u => u.role === 'customer').length, color: 'bg-cyan-600/20' },
          { label: 'Merchants', value: users.filter(u => u.role === 'merchant').length, color: 'bg-purple-600/20' },
          { label: 'Drivers', value: users.filter(u => u.role === 'delivery_partner').length, color: 'bg-green-600/20' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`stat-card ${s.color}`}>
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
            placeholder="Search by name or email..."
            className="w-full bg-white/5 border border-white/8 rounded-xl py-2.5 pl-9 pr-4 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/40"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="bg-white/5 border border-white/8 rounded-xl py-2.5 px-4 text-sm text-gray-300 focus:outline-none focus:border-blue-500/40"
        >
          <option value="">All Roles</option>
          {Object.entries(roleConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['User', 'Email', 'Role', 'Trust Score', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-white/5 rounded w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.map((user, i) => (
                <motion.tr key={user._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-white/2">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{user.firstName} {user.lastName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-400 text-xs">{user.email}</td>
                  <td className="px-5 py-4">
                    <span className={roleConfig[user.role]?.class ?? 'badge-info'}>{roleConfig[user.role]?.label ?? user.role}</span>
                  </td>
                  <td className="px-5 py-4">
                    {user.trustScore ? (
                      <div className="flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-amber-400" />
                        <span className={`text-sm font-semibold ${user.trustScore >= 80 ? 'text-green-400' : user.trustScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                          {user.trustScore}
                        </span>
                      </div>
                    ) : <span className="text-gray-600 text-xs">N/A</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={user.status === 'active' ? 'badge-success' : 'badge-danger'}>{user.status}</span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{user.createdAt?.slice(0, 10)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button className="text-gray-500 hover:text-blue-400 transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-500 hover:text-green-400 transition-colors" title="Activate">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button className="text-gray-500 hover:text-red-400 transition-colors" title="Deactivate">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
