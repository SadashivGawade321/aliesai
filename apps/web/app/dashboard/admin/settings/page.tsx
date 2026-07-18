'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Bell, Key, Globe, Database, Save, CheckCircle } from 'lucide-react';

function SettingSection({ title, icon: Icon, children }: any) {
  return (
    <div className="glass-card space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-white/5">
        <Icon className="w-4 h-4 text-blue-400" />
        <h3 className="text-white font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function SettingRow({ label, desc, children }: any) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm text-white font-medium">{label}</div>
        {desc && <div className="text-xs text-gray-500 mt-0.5">{desc}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${on ? 'bg-blue-500' : 'bg-white/10'}`}
      style={{ height: '22px', width: '40px' }}
    >
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="w-6 h-6 text-gray-400" /> Settings
          </h1>
          <p className="text-gray-500 text-sm mt-1">Platform configuration and preferences</p>
        </div>
        <motion.button
          onClick={handleSave}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl font-semibold transition-all ${saved ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'btn-primary'}`}
        >
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </motion.button>
      </motion.div>

      <SettingSection title="Security" icon={Shield}>
        <SettingRow label="Two-Factor Authentication" desc="Require 2FA for admin logins">
          <Toggle defaultChecked />
        </SettingRow>
        <SettingRow label="IP Whitelisting" desc="Restrict admin access by IP">
          <Toggle />
        </SettingRow>
        <SettingRow label="Session Timeout" desc="Auto-logout after inactivity">
          <select className="bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none">
            <option>15 minutes</option>
            <option>30 minutes</option>
            <option>1 hour</option>
            <option>Never</option>
          </select>
        </SettingRow>
      </SettingSection>

      <SettingSection title="Fraud Detection" icon={Shield}>
        <SettingRow label="Auto-Block Critical Fraud" desc="Block orders with fraud score ≥ 80">
          <Toggle defaultChecked />
        </SettingRow>
        <SettingRow label="Fraud Score Threshold" desc="Minimum score to trigger alert">
          <input type="number" defaultValue={40} className="bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none w-20 text-center" />
        </SettingRow>
        <SettingRow label="Velocity Attack Detection" desc="Detect rapid order creation patterns">
          <Toggle defaultChecked />
        </SettingRow>
        <SettingRow label="GPS Mismatch Detection" desc="Flag orders with location anomalies">
          <Toggle defaultChecked />
        </SettingRow>
      </SettingSection>

      <SettingSection title="Insurance Pool" icon={Database}>
        <SettingRow label="Contribution Rate" desc="Percentage of each transaction added to pool">
          <div className="flex items-center gap-2">
            <input type="number" step="0.1" defaultValue={0.5} className="bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none w-20 text-center" />
            <span className="text-gray-500 text-sm">%</span>
          </div>
        </SettingRow>
        <SettingRow label="Auto-Claim Processing" desc="Process eligible claims automatically">
          <Toggle defaultChecked />
        </SettingRow>
        <SettingRow label="Maximum Claim Amount" desc="Cap on single insurance claim payout">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">₹</span>
            <input type="number" defaultValue={5000} className="bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none w-24 text-center" />
          </div>
        </SettingRow>
      </SettingSection>

      <SettingSection title="Notifications" icon={Bell}>
        <SettingRow label="Critical Fraud Alerts" desc="Notify admin on CRITICAL fraud events">
          <Toggle defaultChecked />
        </SettingRow>
        <SettingRow label="Settlement Alerts" desc="Notify when settlements are processed">
          <Toggle defaultChecked />
        </SettingRow>
        <SettingRow label="AI Dispute Resolutions" desc="Notify on each AI-resolved dispute">
          <Toggle />
        </SettingRow>
        <SettingRow label="Email Notifications" desc="Send alerts to admin email">
          <Toggle defaultChecked />
        </SettingRow>
      </SettingSection>

      <SettingSection title="API & Integration" icon={Key}>
        <SettingRow label="AI Service URL" desc="FastAPI endpoint for fraud & trust">
          <input defaultValue="http://localhost:8000" className="bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none w-56 font-mono" />
        </SettingRow>
        <SettingRow label="Rate Limit (req/min)" desc="Max API requests per user per minute">
          <input type="number" defaultValue={100} className="bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none w-20 text-center" />
        </SettingRow>
        <SettingRow label="CORS Origin" desc="Allowed frontend origin">
          <input defaultValue="http://localhost:3000" className="bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none w-56 font-mono" />
        </SettingRow>
      </SettingSection>

      <SettingSection title="Platform" icon={Globe}>
        <SettingRow label="Maintenance Mode" desc="Temporarily disable all transactions">
          <Toggle />
        </SettingRow>
        <SettingRow label="New User Registration" desc="Allow new users to register">
          <Toggle defaultChecked />
        </SettingRow>
        <SettingRow label="Default Currency" desc="Platform currency">
          <select className="bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none">
            <option>INR (₹)</option>
            <option>USD ($)</option>
            <option>EUR (€)</option>
          </select>
        </SettingRow>
      </SettingSection>
    </div>
  );
}
