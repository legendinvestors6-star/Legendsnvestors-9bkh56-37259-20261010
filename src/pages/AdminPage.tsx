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

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
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
      if (!isAdmin) { navigate('/home'); }
    } catch { navigate('/login'); }
  }, []);

  const allUsers = supaUsers.map((u) => ({
    id: u.id, phone: u.phone, balance: u.balance || 0,
    referral_code: u.referral_code, referralCode: u.referral_code,
    referred_by: u.referred_by, created_at: u.created_at, createdAt: u.created_at,
    isAdmin:!!(u.is_admin || u.isadmin), level: 1,
  }));
  const users = allUsers.filter((u) =>!u.isAdmin);
  const adminUser = allUsers.find((u) => u.isAdmin);
  const filteredUsers = users.filter((u) => u.phone.toLowerCase().includes(searchQ.toLowerCase()));

  const rechargeOrders = getRechargeOrders();
  const withdrawOrders = getWithdrawOrders();
  const userProducts = getUserProducts();
  const pendingRecharge = rechargeOrders.filter((o) => o.status === 'pending');
  const pendingWithdraw = withdrawOrders.filter((o) => o.status === 'pending');
  const pendingPesa = pesaRecharges.filter((r) => r.status!== 'completed');
  const totalBalance = users.reduce((s, u) => s + u.balance, 0);
  const totalRecharge = rechargeOrders.filter((o) => o.status === 'completed').reduce((s, o) => s + o.amount, 0);
  const passwordResets = getPasswordResets();
  const pendingResets = passwordResets.filter((r) => r.status === 'pending');

  const getReferralCount = (user) => allUsers.filter((x) => x.referred_by === user.referral_code).length;

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'users', label: 'Users', icon: Users, badge: users.length },
    { key: 'recharge', label: 'Recharge', icon: CreditCard, badge: pendingRecharge.length },
    { key: 'pesajet', label: 'PesaJet', icon: DollarSign, badge: pendingPesa.length },
    { key: 'withdraw', label: 'Withdraw', icon: ArrowDownToLine, badge: pendingWithdraw.length },
    { key: 'products', label: 'Products', icon: TrendingUp },
    { key: 'resets', label: 'Resets', icon: Shield, badge: pendingResets.length },
    { key: 'gifts', label: 'Tools', icon: Gift },
  ];

  if (loadingUsers) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading users...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="flex items-center justify-between p-4 bg-[#111] border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2"><Shield size={18} className="text-[#c9a84c]" /><span className="font-black">Admin LEGEND - {supaUsers.length} users</span></div>
        <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="w-8 h-8 rounded-xl bg-[#1e1e1e] flex items-center justify-center"><LogOut size={15} /></button>
      </div>

      <div className="flex gap-0 overflow-x-auto bg-[#111] border-b border-[#1a1a1a]">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-3 text-xs font-semibold relative" style={tab === t.key? { color: '#c9a84c', borderBottom: '2px solid #c9a84c' } : { color: '#555' }}>
              <Icon size={13} />{t.label}{t.badge!== undefined && t.badge > 0 && <span className="absolute top-1.5 right-1 w-4 h-4 rounded-full text-[9px] font-black text-black flex items-center justify-center gold-gradient">{t.badge}</span>}
            </button>
          );
        })}
      </div>

      <div className="p-4 pb-8">
        {tab === 'overview' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-4 bg-[#151515] border border-[#2a2a2a]"><p className="text-3xl font-black text-[#c9a84c]">{users.length}</p><p className="text-gray-500 text-xs">Total Users</p></div>
              <div className="rounded-2xl p-4 bg-[#151515] border border-[#2a2a2a]"><p className="text-3xl font-black text-yellow-400">{pendingRecharge.length}</p><p className="text-gray-500 text-xs">Pending Recharge</p></div>
              <div className="rounded-2xl p-4 bg-[#151515] border border-[#2a2a2a]"><p className="text-3xl font-black text-red-400">{pendingWithdraw.length}</p><p className="text-gray-500 text-xs">Pending Withdraw</p></div>
              <div className="rounded-2xl p-4 bg-[#151515] border border-[#2a2a2a]"><p className="text-3xl font-black text-green-400">{userProducts.filter((p) => p.status === 'active').length}</p><p className="text-gray-500 text-xs">Active Products</p></div>
            </div>
            <div className="rounded-2xl p-4 bg-[#151515] border border-yellow-900/20"><p className="text-gray-500 text-xs">Total Platform Balance</p><p className="text-[#c9a84c] text-2xl font-black">{formatUGX(totalBalance)}</p></div>
            <div className="rounded-2xl p-4 bg-[#151515] border border-[#2a2a2a]"><p className="text-gray-500 text-xs">Total Completed Recharges</p><p className="text-white text-2xl font-black">{formatUGX(totalRecharge)}</p></div>
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: '#1a1a1a', border: '1px solid #333' }}>
              <Search size={14} className="text-gray-500" />
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search by phone..." className="flex-1 bg-transparent outline-none text-sm text-white" />
            </div>
            <p className="text-gray-400 text-xs">{filteredUsers.length} users (Total {supaUsers.length}) - Admin: {adminUser?.phone} Code: {adminUser?.referral_code}</p>
            {filteredUsers.map((user) => (
              <div key={user.id} className="rounded-2xl p-4" style={{ background: '#151515', border: '1px solid #2a2a2a' }}>
                <p className="font-bold text-sm">{user.phone}</p>
                <p className="text-gray-500 text-xs">{user.created_at? new Date(user.created_at).toLocaleString() : ''} - Referred by: {user.referred_by || 'NONE'}</p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="rounded-xl p-2 text-center bg-[#1e1e1e]"><p className="text-[#c9a84c] font-bold text-sm">{formatUGX(user.balance)}</p><p className="text-gray-600 text-[10px]">Balance</p></div>
                  <div className="rounded-xl p-2 text-center bg-[#1e1e1e]"><p className="text-white font-bold text-sm">{user.referral_code}</p><p className="text-gray-600 text-[10px]">My Code</p></div>
                  <div className="rounded-xl p-2 text-center bg-[#1e1e1e]"><p className="text-green-400 font-bold text-sm">{getReferralCount(user)} refs</p><p className="text-gray-600 text-[10px]">Referrals</p></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'pesajet' && (
          <div className="space-y-3">
            <div className="flex justify-between"><p className="text-gray-400 text-xs">{pesaRecharges.length} orders</p><button onClick={() => setRefresh(r => r+1)} className="text-xs px-3 py-1.5 rounded-full bg-yellow-500 text-black font-bold">Refresh</button></div>
            {pesaRecharges.map((r) => (<div key={r.id} className="rounded-2xl p-4 bg-[#151515] border border-[#2a2a2a]"><p className="text-white text-sm">{r.amount} - {r.phone} - {r.status} - {r.provider}</p><p className="text-gray-500 text-xs">Ref: {r.reference}</p></div>))}
          </div>
        )}

        {tab === 'recharge' && (<div className="space-y-2">{rechargeOrders.map((o) => (<div key={o.id} className="rounded-xl p-3 bg-[#151515] border border-[#2a2a2a]"><p className="text-white text-sm">{o.amount} - {o.status}</p></div>))}</div>)}
        {tab === 'withdraw' && (<div className="space-y-2">{withdrawOrders.map((o) => (<div key={o.id} className="rounded-xl p-3 bg-[#151515] border border-[#2a2a2a]"><p className="text-white text-sm">{o.amount} - {o.status}</p></div>))}</div>)}
        {tab === 'products' && (<div className="space-y-2">{PRODUCTS.map((p) => (<div key={p.id} className="rounded-xl p-3 bg-[#151515] border border-[#2a2a2a]"><p className="text-white text-sm">{p.name} - {formatUGX(p.price)}</p></div>))}</div>)}
        {tab === 'resets' && (<div className="space-y-2">{passwordResets.map((r) => (<div key={r.id} className="rounded-xl p-3 bg-[#151515] border border-[#2a2a2a]"><p className="text-white text-sm">{r.phone} - {r.status}</p></div>))}</div>)}
        {tab === 'gifts' && (<div className="rounded-xl p-4 bg-[#151515] border border-[#2a2a2a]"><p className="text-white">Gift codes: {getGiftCodes().length}</p></div>)}
      </div>
    </div>
  );
}