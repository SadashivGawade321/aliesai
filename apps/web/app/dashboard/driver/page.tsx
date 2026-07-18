'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Navigation, Package, DollarSign, CheckCircle, Star,
  LogOut, MapPin, Clock, AlertCircle, X,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { useMutation, useQuery } from '@tanstack/react-query';

const activeDeliveries = [
  { id: 'AGP-2024-1000', escrowId: 'ESC-DEMO-001', customer: 'Arjun Sharma', address: '1 Marine Drive, Mumbai', amount: '₹838', status: 'in_transit', distance: '1.2 km' },
  { id: 'AGP-2024-1001', escrowId: 'ESC-DEMO-002', customer: 'Arjun Sharma', address: '2 Marine Drive, Mumbai', amount: '₹471', status: 'otp_pending', distance: '3.4 km' },
];

function OtpModal({ delivery, onClose, onSuccess }: { delivery: any; onClose: () => void; onSuccess: () => void }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { mutate: verifyOtp, isPending } = useMutation({
    mutationFn: (otpCode: string) =>
      api.post(`/escrow/${delivery.escrowId}/verify-otp`, { otp: otpCode }).then(r => r.data),
    onSuccess: (data) => {
      onSuccess();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    },
  });

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
      verifyOtp(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const digits = pasted.split('');
      setOtp(digits);
      verifyOtp(pasted);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass-card w-full max-w-sm border border-blue-500/20"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-bold text-lg">Verify Delivery OTP</h2>
            <p className="text-gray-500 text-xs mt-0.5">Ask customer for their 6-digit OTP</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-blue-400 text-xs font-medium">{delivery.customer}</p>
          <p className="text-gray-400 text-xs mt-0.5">{delivery.address}</p>
        </div>

        <div className="flex gap-2 justify-center mb-5" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              maxLength={1}
              inputMode="numeric"
              className={`w-11 h-14 text-center text-xl font-bold rounded-xl border bg-white/5 text-white focus:outline-none transition-all ${
                digit ? 'border-blue-500 bg-blue-500/10' : 'border-white/10'
              } ${error ? 'border-red-500 bg-red-500/10' : ''}`}
            />
          ))}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-red-400 text-xs mb-4 bg-red-500/10 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => verifyOtp(otp.join(''))}
          disabled={otp.join('').length !== 6 || isPending}
          className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-40"
        >
          {isPending ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</>
          ) : (
            <><CheckCircle className="w-4 h-4" /> Confirm Delivery</>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}

function SuccessModal({ delivery, onClose }: { delivery: any; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className="glass-card w-full max-w-sm text-center border border-green-500/30"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-5"
        >
          <CheckCircle className="w-10 h-10 text-green-400" />
        </motion.div>
        <h2 className="text-white text-xl font-bold mb-2">Delivery Confirmed!</h2>
        <p className="text-gray-400 text-sm mb-2">OTP verified successfully.</p>
        <p className="text-green-400 text-sm font-medium mb-6">
          ₹{delivery.amount} released to merchant. Your earnings have been added.
        </p>
        <button onClick={onClose} className="btn-primary w-full">Done</button>
      </motion.div>
    </motion.div>
  );
}

export default function DriverDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [otpDelivery, setOtpDelivery] = useState<any>(null);
  const [successDelivery, setSuccessDelivery] = useState<any>(null);

  const { data: queryData, isLoading, refetch } = useQuery({
    queryKey: ['driver-deliveries'],
    queryFn: () => api.get('/orders').then(r => r.data).catch(() => ({ data: [] })),
    staleTime: 5000,
  });

  const orders = queryData?.data || [];
  const activeOrders = orders.filter((o: any) =>
    !['delivered', 'cancelled', 'refunded', 'disputed'].includes(o.status)
  );

  const deliveriesList = activeOrders.map((o: any) => ({
    id: o.orderNumber,
    escrowId: o.escrowAccountId?.escrowId || `ESC-DEMO-${o._id}`,
    customer: `${o.customerId?.firstName || 'Arjun'} ${o.customerId?.lastName || 'Sharma'}`,
    address: o.deliveryAddress ? `${o.deliveryAddress.line1}, ${o.deliveryAddress.city}` : 'Marine Drive, Mumbai',
    amount: `₹${o.totalAmount}`,
    status: o.escrowAccountId?.state === 'OTP_PENDING' || o.status === 'otp_pending' ? 'otp_pending' : 'in_transit',
    distance: '1.2 km',
  }));

  const deliveries = deliveriesList.length > 0 ? deliveriesList : activeDeliveries;

  const handleOtpSuccess = () => {
    setSuccessDelivery(otpDelivery);
    setOtpDelivery(null);
    refetch();
  };

  return (
    <div className="min-h-screen bg-[#030712]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-80 h-80 bg-cyan-600/08 rounded-full blur-3xl" />
      </div>

      <AnimatePresence>
        {otpDelivery && (
          <OtpModal
            delivery={otpDelivery}
            onClose={() => setOtpDelivery(null)}
            onSuccess={handleOtpSuccess}
          />
        )}
        {successDelivery && (
          <SuccessModal
            delivery={successDelivery}
            onClose={() => setSuccessDelivery(null)}
          />
        )}
      </AnimatePresence>

      <header className="relative z-10 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold gradient-text">AegisPay AI</span>
            <span className="text-xs text-gray-600 ml-2">Driver Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Online</span>
          </div>
          <button onClick={() => { logout(); router.push('/auth/login'); }} className="text-gray-600 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="relative z-10 max-w-2xl mx-auto p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white">Hello, <span className="gradient-text">{user?.firstName}</span> 🚴</h1>
          <p className="text-gray-500 text-sm">{deliveries.length} active {deliveries.length === 1 ? 'delivery' : 'deliveries'}</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Package, label: "Today's Deliveries", value: '8', color: 'bg-blue-600/20 glow-blue' },
            { icon: DollarSign, label: 'Earnings Today', value: '₹820', color: 'bg-green-600/20 glow-green' },
            { icon: Star, label: 'Trust Score', value: '91', color: 'bg-purple-600/20 glow-purple' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`stat-card text-center ${s.color}`}>
              <s.icon className="w-6 h-6 mx-auto mb-2 text-white opacity-80" />
              <div className="text-xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Active Deliveries */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold">Active Deliveries</h3>
          {deliveries.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card text-center py-12 text-gray-600">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400 opacity-50" />
              <p className="text-white font-medium">All deliveries completed!</p>
              <p className="text-sm mt-1">Great work today 🎉</p>
            </motion.div>
          ) : (
            deliveries.map((delivery, i) => (
              <motion.div key={delivery.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="glass-card border-gradient">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-medium">{delivery.id}</p>
                    <p className="text-gray-500 text-sm">{delivery.customer}</p>
                  </div>
                  <span className={delivery.status === 'otp_pending' ? 'badge-purple' : 'badge-info'}>
                    {delivery.status === 'otp_pending' ? 'OTP Pending' : 'In Transit'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                  <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>{delivery.address}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Navigation className="w-3 h-3" />{delivery.distance}</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{delivery.amount}</span>
                  </div>
                  <button
                    onClick={() => setOtpDelivery(delivery)}
                    className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Verify OTP
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Escrow Info */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-4 border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-2 text-blue-400 mb-1 font-medium text-sm">
            <Shield className="w-4 h-4" /> AegisPay Escrow Protected
          </div>
          <p className="text-gray-400 text-xs">
            Ask the customer for their 6-digit OTP at delivery. Funds are released instantly upon verification and your trust score increases.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
