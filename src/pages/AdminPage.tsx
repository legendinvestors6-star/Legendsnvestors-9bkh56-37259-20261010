import { useState, useEffect } from 'react';
import { Users, CreditCard, ArrowDownToLine, BarChart3, Search, LogOut, Shield, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { getRechargeOrders, getWithdrawOrders, formatUGX } from '@/lib/storage';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('users');
  const [searchQ, setSearchQ] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [pesaRecharges, setPesaRecharges] = useState<any[]>([]);
  const [supaUsers, setSupaUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdminChecked, setIsAdminChecked] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('legend_user');
    if (!raw) { navigate('/login', { replace: true }); return; }
    try {
      const u = JSON.parse(raw);
      const isAdmin = u.is_admin || u.isadmin || u.isAdmin || u.phone === '0746085840';
      if (!isAdmin) { navigate('/home', { replace: true }); return; }
      setIsAdminChecked(true);
    } catch { navigate('/login', { replace: true }); }
  }, []);

  useEffect(() => {
    if (!isAdminChecked) return;
    const load = async () => {
      setLoading(true);
      const { data: usersData } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (usersData) setSupaUsers(usersData);
      const { data: pesaData } = await supabase.from('recharges').select('*').order('created_at', { ascending: false }).limit(100);
      if (pesaData) setPesaRecharges(pesaData);
      setLoading(false);
    };
    load();
  }, [isAdminChecked, refresh, tab]);

  if (!isAdminChecked) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Checking admin...</div>;
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading {supaUsers.length} users...</div>;

  const allUsers = supaUsers.map((u:any) => ({
    id: u.id, phone: u.phone, balance: u.balance || 0,
    referral_code: u.referral_code, referred_by: u.referred_by,
    created_at: u.created_at, isAdmin:!!(u.is_admin || u.isadmin),
  }));
  const users = allUsers.filter((u:any) =>!u.isAdmin);
  const adminUser = allUsers.find((u:any) => u.isAdmin);
  const filteredUsers = users.filter((u:any) => u.phone.toLowerCase().includes(searchQ.toLowerCase()));
  const rechargeOrders = getRechargeOrders();
  const withdrawOrders = getWithdrawOrders();

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'users', label: 'Users', icon: Users, badge: users.length },
    { key: 'recharge', label: 'Recharge', icon: CreditCard, badge: rechargeOrders.filter((o:any)=>o.status==='pending').length },
    { key: 'pesajet', label: 'PesaJet', icon: DollarSign, badge: pesaRecharges.filter((r:any)=>r.status!=='completed').length },
    { key: 'withdraw', label: 'Withdraw', icon: ArrowDownToLine, badge: withdrawOrders.filter((o:any)=>o.status==='pending').length },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="flex items-center justify-between p-4 bg-[#111] border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2"><Shield size={18} className="text-[#c9a84c]" /><span className="font-black text-sm">Admin LEGEND - {supaUsers.length} users</span></div>
        <button onClick={() => { localStorage.removeItem('legend_user'); localStorage.removeItem('legend_current_user'); navigate('/login', { replace: true }); }} className="w-8 h-8 rounded-xl bg-[#1e1e1e] flex items-center justify-center"><LogOut size={15} /></button>
      </div>

      <div className="flex gap-0 overflow-x-auto bg-[#111] border-b border-[#1a1a1a]">
        {tabs.map((t:any) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className="flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-xs font-bold" style={tab === t.key? { color: '#c9a84c', borderBottom: '2px solid #c9a84c' } : { color: '#777' }}>
              <Icon size={14} />{t.label}{t.badge>0 && <span className="ml-1 w-4 h-4 rounded-full text-[9px] font-black text-black flex items-center justify-center bg-[#c9a84c]">{t.badge}</span>}
            </button>
          );
        })}
      </div>

      <div className="p-4">
        {tab === 'users' && (
          <>
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-3 bg-[#1a1a1a] border border-[#333]">
              <Search size={14} className="text-gray-500" />
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search by phone..." className="flex-1 bg-transparent outline-none text-sm text-white" />
            </div>
            <p className="text-gray-400 text-xs mb-3">{filteredUsers.length} users - Admin: {adminUser?.phone} Code: {adminUser?.referral_code}</p>
            {filteredUsers.map((user:any) => (
              <div key={user.id} className="rounded-2xl p-4 mb-3 bg-[#151515] border border-[#2a2a2a]">
                <p className="font-bold text-sm">{user.phone}</p>
                <p className="text-gray-500 text-xs">{user.created_at? new Date(user.created_at).toLocaleString() : ''} - Referred by: {user.referred_by || 'NONE'}</p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="rounded-xl p-2 text-center bg-[#1e1e1e]"><p className="text-[#c9a84c] font-bold text-sm">{formatUGX(user.balance)}</p><p className="text-gray-600 text-[10px]">Balance</p></div>
                  <div className="rounded-xl p-2 text-center bg-[#1e1e1e]"><p className="text-white font-bold text-sm">{user.referral_code}</p><p className="text-gray-600 text-[10px]">My Code</p></div>
                  <div className="rounded-xl p-2 text-center bg-[#1e1e1e]"><p className="text-green-400 font-bold text-sm">{allUsers.filter((x:any) => x.referred_by === user.referral_code).length} refs</p><p className="text-gray-600 text-[10px]">Referrals</p></div>
                </div>
              </div>
            ))}
          </>
        )}
        {tab === 'overview' && <div className="text-gray-400 text-sm">Total Balance: {formatUGX(users.reduce((s:any,u:any)=>s+u.balance,0))} - Users: {users.length}</div>}
        {tab === 'pesajet' && <div className="space-y-2">{pesaRecharges.map((r:any) => <div key={r.id} className="rounded-xl p-3 bg-[#151515] border border-[#2a2a2a]"><p className="text-white text-sm">{r.amount} - {r.phone} - {r.status}</p></div>)}</div>}
        {tab === 'recharge' && <div className="space-y-2">{rechargeOrders.map((o:any) => <div key={o.id} className="rounded-xl p-3 bg-[#151515]"><p className="text-white text-sm">{o.amount} - {o.status}</p></div>)}</div>}
        {tab === 'withdraw' && <div className="space-y-2">{withdrawOrders.map((o:any) => <div key={o.id} className="rounded-xl p-3 bg-[#151515]"><p className="text-white text-sm">{o.amount} - {o.status}</p></div>)}</div>}
      </div>
    </div>
  );
          }
