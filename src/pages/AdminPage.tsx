

import { useState, useEffect } from 'react';
import { Users, CreditCard, ArrowDownToLine, BarChart3, Check, X, Search, LogOut, Shield, TrendingUp, Gift, Bell, DollarSign, Trash2, Eye, Copy, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import { PRODUCTS } from '@/constants/products';
import {
  getRechargeOrders, getWithdrawOrders, getUserProducts,
  approveRechargeOrder, rejectRechargeOrder, approveWithdrawOrder, rejectWithdrawOrder,
  formatUGX, updateUser, addTransaction, getTransactions,
  getGiftCodes, createGiftCode, deleteGiftCode,
  getPasswordResets, approvePasswordReset, rejectPasswordReset
} from '@/lib/storage';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('users');
  const [searchQ, setSearchQ] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [pesaRecharges, setPesaRecharges] = useState([]);
  const [supaUsers, setSupaUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (data) setSupaUsers(data);
      setLoadingUsers(false);
    };
    fetchUsers();
    const fetchPesa = async () => {
      const { data } = await supabase.from('recharges').select('*').order('created_at', { ascending: false }).limit(100);
      if (data) setPesaRecharges(data);
    };
    fetchPesa();
  }, [refresh, tab]);

  useEffect(() => {
    const raw = localStorage.getItem('legend_user');
    if (!raw) { navigate('/login'); return; }
    try {
      const u = JSON.parse(raw);
      const isAdmin = u.is_admin || u.isadmin || u.isAdmin || u.phone === '0746085840' || u.phone === '0750000000';
      if (!isAdmin) navigate('/home');
    } catch { navigate('/login'); }
  }, []);

  const allUsers = supaUsers.map(u => ({
    id: u.id, phone: u.phone, balance: u.balance || 0,
    referral_code: u.referral_code, referralCode: u.referral_code,
    referred_by: u.referred_by, created_at: u.created_at, createdAt: u.created_at,
    isAdmin:!!(u.is_admin || u.isadmin),
  }));
  const users = allUsers.filter(u =>!u.isAdmin);
  const adminUser = allUsers.find(u => u.isAdmin);
  const filteredUsers = users.filter(u => u.phone.toLowerCase().includes(searchQ.toLowerCase()));
  const rechargeOrders = getRechargeOrders();
  const withdrawOrders = getWithdrawOrders();
  const pendingRecharge = rechargeOrders.filter(o => o.status === 'pending');
  const pendingWithdraw = withdrawOrders.filter(o => o.status === 'pending');
  const pendingPesa = pesaRecharges.filter(r => r.status!== 'completed');

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'users', label: 'Users', icon: Users, badge: users.length },
    { key: 'recharge', label: 'Recharge', icon: CreditCard, badge: pendingRecharge.length },
    { key: 'pesajet', label: 'PesaJet', icon: DollarSign, badge: pendingPesa.length },
    { key: 'withdraw', label: 'Withdraw', icon: ArrowDownToLine, badge: pendingWithdraw.length },
  ];

  if (loadingUsers) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading users...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="flex items-center justify-between p-4 bg-[#111] border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2"><Shield size={18} className="text-[#c9a84c]" /><span className="font-black">Admin LEGEND - {supaUsers.length} users</span></div>
        <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="w-8 h-8 rounded-xl bg-[#1e1e1e] flex items-center justify-center"><LogOut size={15} /></button>
      </div>

      <div className="flex gap-0 overflow-x-auto bg-[#111] border-b border-[#1a1a1a]">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className="flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-xs font-bold relative" style={tab === t.key? { color: '#c9a84c', borderBottom: '2px solid #c9a84c' } : { color: '#777' }}>
              <Icon size={14} />{t.label}{t.badge>0 && <span className="ml-1 w-4 h-4 rounded-full text-[9px] font-black text-black flex items-center justify-center bg-[#c9a84c]">{t.badge}</span>}
            </button>
          );
        })}
      </div>

      <div className="p-4">
        {tab === 'users' && (
          <>
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-3" style={{ background: '#1a1a1a', border: '1px solid #333' }}>
              <Search size={14} className="text-gray-500" />
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search by phone..." className="flex-1 bg-transparent outline-none text-sm text-white" />
            </div>
            <p className="text-gray-400 text-xs mb-3">{filteredUsers.length} users (Total {supaUsers.length}) - Admin: {adminUser?.phone} Code: {adminUser?.referral_code}</p>
            {filteredUsers.map(user => (
              <div key={user.id} className="rounded-2xl p-4 mb-3" style={{ background: '#151515', border: '1px solid #2a2a2a' }}>
                <p className="font-bold text-sm">{user.phone}</p>
                <p className="text-gray-500 text-xs">{user.created_at? new Date(user.created_at).toLocaleString() : ''} - Referred by: {user.referred_by || 'NONE'}</p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="rounded-xl p-2 text-center bg-[#1e1e1e]"><p className="text-[#c9a84c] font-bold text-sm">{formatUGX(user.balance)}</p><p className="text-gray-600 text-[10px]">Balance</p></div>
                  <div className="rounded-xl p-2 text-center bg-[#1e1e1e]"><p className="text-white font-bold text-sm">{user.referral_code}</p><p className="text-gray-600 text-[10px]">My Code</p></div>
                  <div className="rounded-xl p-2 text-center bg-[#1e1e1e]"><p className="text-green-400 font-bold text-sm">{allUsers.filter(x => x.referred_by === user.referral_code).length} refs</p><p className="text-gray-600 text-[10px]">Referrals</p></div>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'overview' && <div className="text-gray-400">Total Balance: {formatUGX(users.reduce((s,u)=>s+u.balance,0))} - Users: {users.length} - PesaJet: {pesaRecharges.length} orders</div>}
        {tab === 'pesajet' && <div className="space-y-2">{pesaRecharges.map(r => <div key={r.id} className="rounded-xl p-3 bg-[#151515] border border-[#2a2a2a]"><p className="text-white text-sm">{r.amount} - {r.phone} - {r.status}</p></div>)}</div>}
        {tab === 'recharge' && <div className="space-y-2">{rechargeOrders.map(o => <div key={o.id} className="rounded-xl p-3 bg-[#151515]"><p className="text-white">{o.amount} - {o.status}</p></div>)}</div>}
        {tab === 'withdraw' && <div className="space-y-2">{withdrawOrders.map(o => <div key={o.id} className="rounded-xl p-3 bg-[#151515]"><p className="text-white">{o.amount} - {o.status}</p></div>)}</div>}
      </div>
    </div>
  );
}
