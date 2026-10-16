import { useState, useEffect } from 'react';
import { Users, CreditCard, ArrowDownToLine, BarChart3, Check, X, Search, LogOut, Shield, TrendingUp, Gift, Bell, DollarSign, Trash2, Eye, Copy, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import { PRODUCTS } from '@/constants/products';

// local storage helpers kept for gift codes / transactions
import {
  getRechargeOrders, getWithdrawOrders, getUserProducts,
  approveRechargeOrder, rejectRechargeOrder, approveWithdrawOrder, rejectWithdrawOrder,
  formatUGX, updateUser, addTransaction, getTransactions,
  getGiftCodes, createGiftCode, deleteGiftCode,
  getPasswordResets, approvePasswordReset, rejectPasswordReset, getUsers as getLocalUsers
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

  // ---- FETCH USERS FROM SUPABASE, NOT LOCALSTORAGE ----
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      const { data, error } = await supabase
       .from('users')
       .select('*')
       .order('created_at', { ascending: false });
      if (error) {
        console.error('Supabase users error:', error);
        toast.error(error.message);
      } else {
        setSupaUsers(data || []);
      }
      setLoadingUsers(false);
    };
    fetchUsers();

    const fetchPesa = async () => {
      const { data } = await supabase.from('recharges').select('*').order('created_at', { ascending: false }).limit(100);
      if (data) setPesaRecharges(data);
    };
    fetchPesa();
  }, [refresh, tab]);

  // ---- AUTH CHECK - handle both isadmin and is_admin ----
  useEffect(() => {
    const raw = localStorage.getItem('legend_user');
    if (!raw) { navigate('/login'); return; }
    try {
      const u = JSON.parse(raw);
      const isAdmin = u.is_admin || u.isadmin || u.isAdmin || u.phone === '0750000000';
      if (!isAdmin) {
        toast.error('Not admin');
        navigate('/home');
      }
    } catch { navigate('/login'); }
  }, []);

  const allUsers = supaUsers.map(u => ({
    id: u.id,
    phone: u.phone,
    balance: u.balance || 0,
    referral_code: u.referral_code,
    referralCode: u.referral_code,
    referred_by: u.referred_by,
    created_at: u.created_at,
    createdAt: u.created_at,
    isAdmin:!!(u.is_admin || u.isadmin),
    level: u.level || 1,
  }));

  const users = allUsers.filter(u =>!u.isAdmin);
  const adminUser = allUsers.find(u => u.isAdmin);

  const filteredUsers = users.filter(u => u.phone.toLowerCase().includes(searchQ.toLowerCase()));

  //... keep your recharge/withdraw logic same, but using allUsers for lookup
  const rechargeOrders = getRechargeOrders();
  const withdrawOrders = getWithdrawOrders();
  const pendingRecharge = rechargeOrders.filter(o => o.status === 'pending');
  const pendingWithdraw = withdrawOrders.filter(o => o.status === 'pending');
  const pendingPesa = pesaRecharges.filter(r => r.status!== 'completed');

  const getReferralCount = (user) => {
    return allUsers.filter(x => x.referred_by === user.referral_code).length;
  };

  // If still black, this will show error instead of black
  if (loadingUsers) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading users...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#111] border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2"><Shield size={18} className="text-[#c9a84c]" /><span className="font-black">Admin Panel LEGEND - {supaUsers.length} users</span></div>
        <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="w-8 h-8 rounded-xl bg-[#1e1e1e] flex items-center justify-center"><LogOut size={15} /></button>
      </div>

      {/* USERS TAB FIXED */}
      <div className="p-4">
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
              <div className="rounded-xl p-2 text-center bg-[#1e1e1e]"><p className="text-green-400 font-bold text-sm">{getReferralCount(user)} refs</p><p className="text-gray-600 text-[10px]">Referrals</p></div>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && <p className="text-center text-gray-600 mt-10">No users found in Supabase</p>}
      </div>
    </div>
  );
}