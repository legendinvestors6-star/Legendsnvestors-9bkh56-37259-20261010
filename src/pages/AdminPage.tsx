import { useState, useEffect } from 'react';
import { 
  Users, CreditCard, ArrowDownToLine, BarChart3, Check, X, Search, 
  LogOut, Shield, Gift, Plus, Trash2, RefreshCw 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

// Local storage helpers
import {
  getRechargeOrders, getWithdrawOrders,
  approveRechargeOrder, rejectRechargeOrder, approveWithdrawOrder, rejectWithdrawOrder,
  formatUGX, getGiftCodes, createGiftCode, deleteGiftCode
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

  // Gift code creation state
  const [newCode, setNewCode] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('1');

  // ---- AUTH CHECK ----
  useEffect(() => {
    const raw = localStorage.getItem('legend_user');
    if (!raw) { navigate('/login'); return; }
    try {
      const u = JSON.parse(raw);
      const isAdmin = u.is_admin || u.isadmin || u.isAdmin || u.phone === '0750000000';
      if (!isAdmin) {
        toast.error('Access denied. Admin privileges required.');
        navigate('/home');
      }
    } catch { 
      navigate('/login'); 
    }
  }, [navigate]);

  // ---- FETCH SUPABASE DATA ----
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

    const fetchPesa = async () => {
      const { data } = await supabase
        .from('recharges')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (data) setPesaRecharges(data);
    };

    fetchUsers();
    fetchPesa();
  }, [refresh]);

  // Derived user lists
  const allUsers = supaUsers.map(u => ({
    id: u.id,
    phone: u.phone,
    balance: u.balance || 0,
    referral_code: u.referral_code,
    referred_by: u.referred_by,
    created_at: u.created_at,
    isAdmin: !!(u.is_admin || u.isadmin),
    level: u.level || 1,
  }));

  const users = allUsers.filter(u => !u.isAdmin);
  const adminUser = allUsers.find(u => u.isAdmin);
  const filteredUsers = users.filter(u => u.phone.toLowerCase().includes(searchQ.toLowerCase()));

  // Local storage orders
  const rechargeOrders = getRechargeOrders();
  const withdrawOrders = getWithdrawOrders();
  const giftCodes = getGiftCodes();

  const pendingRecharge = rechargeOrders.filter(o => o.status === 'pending');
  const pendingWithdraw = withdrawOrders.filter(o => o.status === 'pending');

  const getReferralCount = (user) => {
    return allUsers.filter(x => x.referred_by === user.referral_code).length;
  };

  const triggerRefresh = () => setRefresh(prev => prev + 1);

  // ---- HANDLERS ----
  const handleApproveRecharge = (id) => {
    approveRechargeOrder(id);
    toast.success('Recharge approved!');
    triggerRefresh();
  };

  const handleRejectRecharge = (id) => {
    rejectRechargeOrder(id);
    toast.info('Recharge rejected');
    triggerRefresh();
  };

  const handleApproveWithdraw = (id) => {
    approveWithdrawOrder(id);
    toast.success('Withdrawal approved!');
    triggerRefresh();
  };

  const handleRejectWithdraw = (id) => {
    rejectWithdrawOrder(id);
    toast.info('Withdrawal rejected');
    triggerRefresh();
  };

  const handleCreateGiftCode = (e) => {
    e.preventDefault();
    if (!newCode || !newAmount) {
      toast.error('Please enter a code and amount');
      return;
    }
    createGiftCode({ code: newCode, amount: Number(newAmount), maxUses: Number(newMaxUses) });
    toast.success('Gift code created successfully!');
    setNewCode('');
    setNewAmount('');
    setNewMaxUses('1');
    triggerRefresh();
  };

  const handleDeleteGiftCode = (code) => {
    deleteGiftCode(code);
    toast.info('Gift code deleted');
    triggerRefresh();
  };

  if (loadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <div className="flex items-center gap-2">
          <RefreshCw className="animate-spin text-[#c9a84c]" size={20} />
          <span>Loading admin panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-10">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-[#111] border-b border-[#2a2a2a] sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-[#c9a84c]" />
          <span className="font-black text-sm sm:text-base">Admin Panel LEGEND</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={triggerRefresh} 
            className="p-2 rounded-xl bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300"
            title="Refresh Data"
          >
            <RefreshCw size={15} />
          </button>
          <button 
            onClick={() => { localStorage.clear(); navigate('/login'); }} 
            className="p-2 rounded-xl bg-[#1e1e1e] hover:bg-[#2a2a2a] text-red-400"
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto p-3 bg-[#111] border-b border-[#222]">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'users', label: 'Users', icon: Users, badge: users.length },
          { id: 'recharges', label: 'Recharges', icon: CreditCard, badge: pendingRecharge.length },
          { id: 'withdrawals', label: 'Withdrawals', icon: ArrowDownToLine, badge: pendingWithdraw.length },
          { id: 'gifts', label: 'Gift Codes', icon: Gift },
        ].map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive ? 'bg-[#c9a84c] text-black' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222]'
              }`}
            >
              <Icon size={14} />
              <span>{t.label}</span>
              {t.badge !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-black text-[#c9a84c]' : 'bg-[#333] text-gray-200'
                }`}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="p-4 max-w-4xl mx-auto">
        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#151515] border border-[#2a2a2a] p-4 rounded-2xl">
                <p className="text-gray-500 text-xs font-medium">Total Users</p>
                <p className="text-2xl font-black mt-1">{supaUsers.length}</p>
              </div>
              <div className="bg-[#151515] border border-[#2a2a2a] p-4 rounded-2xl">
                <p className="text-gray-500 text-xs font-medium">Pending Recharges</p>
                <p className="text-2xl font-black text-amber-400 mt-1">{pendingRecharge.length}</p>
              </div>
              <div className="bg-[#151515] border border-[#2a2a2a] p-4 rounded-2xl">
                <p className="text-gray-500 text-xs font-medium">Pending Withdrawals</p>
                <p className="text-2xl font-black text-amber-400 mt-1">{pendingWithdraw.length}</p>
              </div>
              <div className="bg-[#151515] border border-[#2a2a2a] p-4 rounded-2xl">
                <p className="text-gray-500 text-xs font-medium">Active Gift Codes</p>
                <p className="text-2xl font-black text-green-400 mt-1">{giftCodes.length}</p>
              </div>
            </div>

            {adminUser && (
              <div className="bg-[#151515] border border-[#2a2a2a] p-4 rounded-2xl">
                <h3 className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">Admin Account Details</h3>
                <p className="text-sm font-bold">Phone: {adminUser.phone}</p>
                <p className="text-xs text-gray-400">Referral Code: {adminUser.referral_code}</p>
              </div>
            )}
          </div>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
          <div>
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-3 bg-[#1a1a1a] border border-[#333]">
              <Search size={14} className="text-gray-500" />
              <input 
                value={searchQ} 
                onChange={e => setSearchQ(e.target.value)} 
                placeholder="Search by phone..." 
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-500" 
              />
            </div>

            <p className="text-gray-400 text-xs mb-3">
              Showing {filteredUsers.length} of {users.length} users
            </p>

            <div className="space-y-3">
              {filteredUsers.map(user => (
                <div key={user.id} className="rounded-2xl p-4 bg-[#151515] border border-[#2a2a2a]">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm">{user.phone}</p>
                      <p className="text-gray-500 text-[11px]">
                        {user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'} • Referred by: {user.referred_by || 'NONE'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="rounded-xl p-2 text-center bg-[#1e1e1e]">
                      <p className="text-[#c9a84c] font-bold text-xs sm:text-sm">{formatUGX(user.balance)}</p>
                      <p className="text-gray-600 text-[10px]">Balance</p>
                    </div>
                    <div className="rounded-xl p-2 text-center bg-[#1e1e1e]">
                      <p className="text-white font-bold text-xs sm:text-sm">{user.referral_code}</p>
                      <p className="text-gray-600 text-[10px]">Code</p>
                    </div>
                    <div className="rounded-xl p-2 text-center bg-[#1e1e1e]">
                      <p className="text-green-400 font-bold text-xs sm:text-sm">{getReferralCount(user)} refs</p>
                      <p className="text-gray-600 text-[10px]">Referrals</p>
                    </div>
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <p className="text-center text-gray-500 py-10 text-sm">No users found</p>
              )}
            </div>
          </div>
        )}

        {/* RECHARGES TAB */}
        {tab === 'recharges' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-400">Recharge Requests</h3>
            {rechargeOrders.length === 0 ? (
              <p className="text-center text-gray-500 py-10 text-sm">No recharge requests found</p>
            ) : (
              rechargeOrders.map(order => (
                <div key={order.id} className="p-4 bg-[#151515] border border-[#2a2a2a] rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{order.phone || 'User'}</p>
                    <p className="text-[#c9a84c] font-black text-sm">{formatUGX(order.amount)}</p>
                    <p className="text-gray-500 text-[10px]">{new Date(order.createdAt || order.created_at).toLocaleString()}</p>
                    <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      order.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                      order.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                  {order.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApproveRecharge(order.id)} className="p-2.5 bg-green-500/20 text-green-400 rounded-xl border border-green-500/30">
                        <Check size={16} />
                      </button>
                      <button onClick={() => handleRejectRecharge(order.id)} className="p-2.5 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* WITHDRAWALS TAB */}
        {tab === 'withdrawals' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-400">Withdrawal Requests</h3>
            {withdrawOrders.length === 0 ? (
              <p className="text-center text-gray-500 py-10 text-sm">No withdrawal requests found</p>
            ) : (
              withdrawOrders.map(order => (
                <div key={order.id} className="p-4 bg-[#151515] border border-[#2a2a2a] rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{order.phone || 'User'}</p>
                    <p className="text-red-400 font-black text-sm">{formatUGX(order.amount)}</p>
                    <p className="text-gray-500 text-[10px]">{new Date(order.createdAt || order.created_at).toLocaleString()}</p>
                    <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      order.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                      order.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                  {order.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApproveWithdraw(order.id)} className="p-2.5 bg-green-500/20 text-green-400 rounded-xl border border-green-500/30">
                        <Check size={16} />
                      </button>
                      <button onClick={() => handleRejectWithdraw(order.id)} className="p-2.5 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* GIFT CODES TAB */}
        {tab === 'gifts' && (
          <div className="space-y-4">
            <form onSubmit={handleCreateGiftCode} className="p-4 bg-[#151515] border border-[#2a2a2a] rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Create Gift Code</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input 
                  type="text" 
                  placeholder="CODE (e.g. BONUS500)" 
                  value={newCode}
                  onChange={e => setNewCode(e.target.value.toUpperCase())}
                  className="bg-[#1e1e1e] border border-[#333] px-3 py-2 rounded-xl text-sm outline-none focus:border-[#c9a84c]"
                />
                <input 
                  type="number" 
                  placeholder="Amount (UGX)" 
                  value={newAmount}
                  onChange={e => setNewAmount(e.target.value)}
                  className="bg-[#1e1e1e] border border-[#333] px-3 py-2 rounded-xl text-sm outline-none focus:border-[#c9a84c]"
                />
                <input 
                  type="number" 
                  placeholder="Max Uses" 
                  value={newMaxUses}
                  onChange={e => setNewMaxUses(e.target.value)}
                  className="bg-[#1e1e1e] border border-[#333] px-3 py-2 rounded-xl text-sm outline-none focus:border-[#c9a84c]"
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-[#c9a84c] text-black font-bold rounded-xl flex items-center justify-center gap-2 text-sm">
                <Plus size={16} /> Create Code
              </button>
            </form>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Existing Gift Codes</h3>
              {giftCodes.length === 0 ? (
                <p className="text-gray-500 text-xs">No active gift codes</p>
              ) : (
                giftCodes.map(code => (
                  <div key={code.code} className="p-3 bg-[#151515] border border-[#2a2a2a] rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-[#c9a84c]">{code.code}</p>
                      <p className="text-xs text-gray-400">{formatUGX(code.amount)} • Max uses: {code.maxUses || 1}</p>
                    </div>
                    <button onClick={() => handleDeleteGiftCode(code.code)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
