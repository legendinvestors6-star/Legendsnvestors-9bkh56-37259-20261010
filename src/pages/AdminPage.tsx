import { useState, useEffect } from 'react';
import {
  Users, CreditCard, ArrowDownToLine, BarChart3, Check, X, Search,
  LogOut, Shield, TrendingUp, Gift, Bell, DollarSign, Trash2, Eye, Copy, Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import {
  getUsers, getRechargeOrders, getWithdrawOrders, getUserProducts,
  approveRechargeOrder, rejectRechargeOrder, approveWithdrawOrder, rejectWithdrawOrder,
  setCurrentUser, formatUGX, updateUser, addTransaction, getTransactions,
  getGiftCodes, createGiftCode, deleteGiftCode,
  getPasswordResets, approvePasswordReset, rejectPasswordReset
} from '@/lib/storage';
import type { PasswordResetRequest } from '@/lib/storage';
import type { GiftCode } from '@/lib/storage';
import type { User, RechargeOrder, WithdrawOrder } from '@/types';
import { PRODUCTS } from '@/constants/products';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

function GiftToolsTab({ users, rechargeOrders, withdrawOrders, onRefresh }: {
  users: User[];
  rechargeOrders: RechargeOrder[];
  withdrawOrders: WithdrawOrder[];
  onRefresh: () => void;
}) {
  const [giftCode, setGiftCode] = useState('');
  const [giftAmount, setGiftAmount] = useState('');
  const [giftNote, setGiftNote] = useState('');
  const [giftExpiry] = useState('');
  const [creditUser, setCreditUser] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditNote, setCreditNote] = useState('');
  const [deductUser, setDeductUser] = useState('');
  const [deductAmount, setDeductAmount] = useState('');
  const [giftCodes, setGiftCodes] = useState<GiftCode[]>(() => getGiftCodes());
  const refreshCodes = () => setGiftCodes(getGiftCodes());

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4" style={{ background: '#151515', border: '1px solid rgba(201,168,76,0.3)' }}>
        <div className="flex items-center gap-2 mb-3"><Gift size={16} className="text-[#c9a84c]" /><p className="text-white font-bold text-sm">Create Gift Code</p></div>
        <div className="space-y-2">
          <input value={giftCode} onChange={e => setGiftCode(e.target.value.toUpperCase())} placeholder="Custom code (optional — auto-generated if empty)" className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none uppercase tracking-widest" style={{ background: '#1e1e1e', border: '1px solid #333' }} />
          <input value={giftAmount} onChange={e => setGiftAmount(e.target.value)} type="number" placeholder="Amount (UGX)" className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none bg-transparent" style={{ background: '#1e1e1e', border: '1px solid #333' }} />
          <input value={giftNote} onChange={e => setGiftNote(e.target.value)} placeholder="Note (optional)" className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none bg-transparent" style={{ background: '#1e1e1e', border: '1px solid #333' }} />
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}><span className="text-yellow-400 text-xs">⏱</span><span className="text-yellow-300 text-xs font-medium">Code expires automatically 30 minutes after creation</span></div>
          <button onClick={() => {
            const amt = parseInt(giftAmount);
            if (amt <= 0 || isNaN(amt)) { toast.error('Enter a valid amount'); return; }
            const created = createGiftCode(amt, giftNote || undefined, giftCode || undefined);
            toast.success(`Gift code created: ${created.code}`);
            setGiftCode(''); setGiftAmount(''); setGiftNote(''); refreshCodes(); onRefresh();
          }} className="w-full py-3 rounded-xl font-bold text-black text-sm gold-gradient flex items-center justify-center gap-2"><Plus size={15} /> Generate Gift Code</button>
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: '#151515', border: '1px solid rgba(201,168,76,0.25)' }}>
        <p className="text-white font-bold text-sm mb-3">Gift Code Summary</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Total Created', value: giftCodes.length, color: '#c9a84c' },
            { label: 'Total Redeemed', value: giftCodes.filter(c => c.usedBy).length, color: '#22c55e' },
            { label: 'UGX Distributed', value: formatUGX(giftCodes.filter(c => c.usedBy).reduce((s, c) => s + c.amount, 0)), color: '#f0c040' },
            { label: 'Available / Expired', value: `${giftCodes.filter(c =>!c.usedBy &&!(c.expiresAt && new Date(c.expiresAt) < new Date())).length} / ${giftCodes.filter(c =>!c.usedBy && c.expiresAt && new Date(c.expiresAt) < new Date()).length}`, color: '#60a5fa' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl p-3 text-center" style={{ background: '#1e1e1e' }}>
              <p className="font-black text-sm" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-gray-600 text-[10px] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: '#151515', border: '1px solid #2a2a2a' }}>
        <div className="flex items-center justify-between mb-3"><p className="text-white font-bold text-sm">Gift Codes ({giftCodes.length})</p><span className="text-[10px] text-gray-500">{giftCodes.filter(c =>!c.usedBy).length} available</span></div>
        {giftCodes.length === 0? (<p className="text-gray-600 text-xs text-center py-4">No gift codes yet. Create one above.</p>) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {giftCodes.map(gc => (
              <div key={gc.id} className="rounded-xl p-3 flex items-center justify-between" style={{ background: '#1e1e1e', border: `1px solid ${gc.usedBy? '#2a2a2a' : 'rgba(201,168,76,0.2)'}` }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5"><span className="font-black tracking-widest text-sm" style={{ color: gc.usedBy? '#555' : '#c9a84c' }}>{gc.code}</span>{!gc.usedBy && (<button onClick={() => { navigator.clipboard.writeText(gc.code); toast.success('Copied!'); }} className="w-5 h-5 rounded flex items-center justify-center" style={{ background: '#333' }}><Copy size={11} className="text-gray-400" /></button>)}</div>
                  <p className="text-[#c9a84c] text-xs font-bold">{formatUGX(gc.amount)}</p>
                </div>
                <button onClick={() => { deleteGiftCode(gc.id); refreshCodes(); toast.success('Deleted'); }} className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}><Trash2 size={11} className="text-red-400" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl p-4" style={{ background: '#151515', border: '1px solid #2a2a2a' }}>
        <div className="flex items-center gap-2 mb-3"><DollarSign size={16} className="text-[#c9a84c]" /><p className="text-white font-bold text-sm">Credit Balance to User</p></div>
        <div className="space-y-2">
          <select value={creditUser} onChange={e => setCreditUser(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none" style={{ background: '#1e1e1e', border: '1px solid #333' }}><option value="">Select user...</option>{users.map(u => <option key={u.id} value={u.id}>{u.phone} — {formatUGX(u.balance)}</option>)}</select>
          <input value={creditAmount} onChange={e => setCreditAmount(e.target.value)} type="number" placeholder="Amount (UGX)" className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none bg-transparent" style={{ background: '#1e1e1e', border: '1px solid #333' }} />
          <input value={creditNote} onChange={e => setCreditNote(e.target.value)} type="text" placeholder="Note (optional)" className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none bg-transparent" style={{ background: '#1e1e1e', border: '1px solid #333' }} />
          <button onClick={() => {
            const amt = parseInt(creditAmount);
            if (!creditUser) { toast.error('Select a user'); return; }
            if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
            const usr = getUsers().find(u => u.id === creditUser);
            if (!usr) return;
            updateUser(creditUser, { balance: usr.balance + amt, cumulativeIncome: usr.cumulativeIncome + amt });
            addTransaction({ userId: creditUser, type: 'income', amount: amt, status: 'completed', description: creditNote || 'Admin credit' });
            toast.success(`Credited ${formatUGX(amt)} to ${usr.phone}`);
            setCreditUser(''); setCreditAmount(''); setCreditNote(''); onRefresh();
          }} className="w-full py-3 rounded-xl font-bold text-black text-sm gold-gradient">Credit Balance</button>
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: '#151515', border: '1px solid #2a2a2a' }}>
        <div className="flex items-center gap-2 mb-3"><Trash2 size={16} className="text-red-400" /><p className="text-white font-bold text-sm">Deduct Balance</p></div>
        <div className="space-y-2">
          <select value={deductUser} onChange={e => setDeductUser(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none" style={{ background: '#1e1e1e', border: '1px solid #333' }}><option value="">Select user...</option>{users.map(u => <option key={u.id} value={u.id}>{u.phone} — {formatUGX(u.balance)}</option>)}</select>
          <input value={deductAmount} onChange={e => setDeductAmount(e.target.value)} type="number" placeholder="Amount to deduct (UGX)" className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none bg-transparent" style={{ background: '#1e1e1e', border: '1px solid #333' }} />
          <button onClick={() => {
            const amt = parseInt(deductAmount);
            if (!deductUser) { toast.error('Select a user'); return; }
            if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
            const usr = getUsers().find(u => u.id === deductUser);
            if (!usr) return;
            if (amt > usr.balance) { toast.error('Amount exceeds user balance'); return; }
            updateUser(deductUser, { balance: usr.balance - amt });
            addTransaction({ userId: deductUser, type: 'withdraw', amount: -amt, status: 'completed', description: 'Admin deduction' });
            toast.success(`Deducted ${formatUGX(amt)} from ${usr.phone}`);
            setDeductUser(''); setDeductAmount(''); onRefresh();
          }} className="w-full py-3 rounded-xl font-bold text-red-400 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>Deduct Balance</button>
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: '#151515', border: '1px solid #2a2a2a' }}>
        <div className="flex items-center gap-2 mb-3"><Bell size={16} className="text-yellow-400" /><p className="text-white font-bold text-sm">Platform Stats</p></div>
        <div className="space-y-2">
          {[
            { label: 'Total Users', value: users.length },
            { label: 'Total Recharge Orders', value: rechargeOrders.length },
            { label: 'Total Withdraw Orders', value: withdrawOrders.length },
            { label: 'Completed Recharges', value: formatUGX(rechargeOrders.filter(o => o.status === 'completed').reduce((s, o) => s + o.amount, 0)) },
            { label: 'Pending Withdrawals', value: formatUGX(withdrawOrders.filter(o => o.status === 'pending').reduce((s, o) => s + o.amount, 0)) },
            { label: 'Total Platform Balances', value: formatUGX(users.reduce((s, u) => s + u.balance, 0)) },
            { label: 'Active Gift Codes', value: getGiftCodes().filter(c =>!c.usedBy).length },
          ].map(stat => (
            <div key={stat.label} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #222' }}>
              <span className="text-gray-500 text-xs">{stat.label}</span>
              <span className="text-white font-bold text-sm">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: '#151515', border: '1px solid #2a2a2a' }}>
        <div className="flex items-center gap-2 mb-3"><Eye size={16} className="text-blue-400" /><p className="text-white font-bold text-sm">View User Transactions</p></div>
        <select onChange={(e) => {
          const uid = e.target.value;
          if (!uid) return;
          const txs = getTransactions(uid);
          const usr = getUsers().find(u => u.id === uid);
          alert(`${usr?.phone} — ${txs.length} transactions\n\n` + txs.slice(0, 10).map(t => `${t.type.toUpperCase()}: ${t.amount >= 0? '+' : ''}${t.amount} UGX — ${t.description} (${t.status})`).join('\n'));
        }} className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none" style={{ background: '#1e1e1e', border: '1px solid #333' }}>
          <option value="">Select user to view transactions...</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.phone} — {formatUGX(u.balance)}</option>)}
        </select>
      </div>
    </div>
  );
}

type AdminTab = 'overview' | 'users' | 'recharge' | 'pesajet' | 'withdraw' | 'products' | 'gifts' | 'resets';

export default function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [searchQ, setSearchQ] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [pesaRecharges, setPesaRecharges] = useState<any[]>([]);

  const users = getUsers().filter(u =>!u.isAdmin);
  const rechargeOrders = getRechargeOrders();
  const withdrawOrders = getWithdrawOrders();
  const userProducts = getUserProducts();

  useEffect(()=>{
    const fetchPesa = async () => {
      const { data } = await supabase.from('recharges').select('*').order('created_at', { ascending: false }).limit(100);
      if(data) setPesaRecharges(data);
    };
    fetchPesa();
  }, [refresh, tab]);

  const pendingRecharge = rechargeOrders.filter(o => o.status === 'pending');
  const pendingWithdraw = withdrawOrders.filter(o => o.status === 'pending');
  const pendingPesa = pesaRecharges.filter((r:any)=> r.status!== 'completed');
  const totalBalance = users.reduce((s, u) => s + u.balance, 0);
  const totalRecharge = rechargeOrders.filter(o => o.status === 'completed').reduce((s, o) => s + o.amount, 0);

  const handleApproveRecharge = (orderId: string) => { approveRechargeOrder(orderId); toast.success('Recharge approved'); setRefresh(r => r + 1); };
  const handleRejectRecharge = (orderId: string) => { rejectRechargeOrder(orderId); toast.success('Recharge rejected'); setRefresh(r => r + 1); };
  const handleApproveWithdraw = (orderId: string) => { approveWithdrawOrder(orderId); toast.success('Withdrawal approved'); setRefresh(r => r + 1); };
  const handleRejectWithdraw = (orderId: string) => { rejectWithdrawOrder(orderId); toast.success('Withdrawal rejected'); setRefresh(r => r + 1); };
  const handleLogout = () => { setCurrentUser(null); navigate('/login'); };
  const filteredUsers = users.filter(u => u.phone.toLowerCase().includes(searchQ.toLowerCase()));
  const passwordResets = getPasswordResets();
  const pendingResets = passwordResets.filter(r => r.status === 'pending');

  const tabs: { key: AdminTab; label: string; icon: typeof BarChart3; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'users', label: 'Users', icon: Users, badge: users.length },
    { key: 'recharge', label: 'Recharge', icon: CreditCard, badge: pendingRecharge.length },
    { key: 'pesajet', label: 'PesaJet', icon: DollarSign, badge: pendingPesa.length },
    { key: 'withdraw', label: 'Withdraw', icon: ArrowDownToLine, badge: pendingWithdraw.length },
    { key: 'products', label: 'Products', icon: TrendingUp },
    { key: 'resets', label: 'Resets', icon: Shield, badge: pendingResets.length },
    { key: 'gifts', label: 'Tools', icon: Gift },
  ];

  const getStatusStyle = (status: string) => {
    if (status === 'completed') return { background: 'rgba(201,168,76,0.1)', color: '#c9a84c' };
    if (status === 'pending') return { background: 'rgba(251,191,36,0.1)', color: '#fbbf24' };
    return { background: 'rgba(239,68,68,0.1)', color: '#ef4444' };
  };

  return (
    <div className="app-container min-h-screen" style={{ background: '#0a0a0a' }}>
      <div className="flex items-center justify-between p-4" style={{ background: '#111111', borderBottom: '1px solid #2a2a2a' }}>
        <div className="flex items-center gap-2"><Shield size={18} className="text-[#c9a84c]" /><span className="text-white font-black text-lg">Admin Panel</span><span className="text-[9px] font-bold text-black px-2 py-0.5 rounded-full gold-gradient ml-1">LEGEND</span></div>
        <button onClick={handleLogout} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#1e1e1e' }}><LogOut size={15} className="text-gray-400" /></button>
      </div>

      <div className="flex gap-0 overflow-x-auto" style={{ background: '#111111', borderBottom: '1px solid #1a1a1a' }}>
        {tabs.map(t => {
          const Icon = t.icon;
          return (<button key={t.key} onClick={() => setTab(t.key)} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-3 text-xs font-semibold relative transition-colors" style={tab === t.key? { color: '#c9a84c', borderBottom: '2px solid #c9a84c' } : { color: '#555' }}><Icon size={13} />{t.label}{t.badge!== undefined && t.badge > 0 && (<span className="absolute top-1.5 right-1 w-4 h-4 rounded-full text-[9px] font-black text-black flex items-center justify-center gold-gradient">{t.badge}</span>)}</button>);
        })}
      </div>

      <div className="p-4 pb-8">
        {tab === 'overview' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Users', value: users.length, color: '#c9a84c' },
                { label: 'Pending Recharge', value: pendingRecharge.length, color: '#fbbf24' },
                { label: 'Pending Withdraw', value: pendingWithdraw.length, color: '#f87171' },
                { label: 'Active Products', value: userProducts.filter(p => p.status === 'active').length, color: '#34d399' },
              ].map(stat => (<div key={stat.label} className="rounded-2xl p-4" style={{ background: '#151515', border: '1px solid #2a2a2a' }}><p className="text-3xl font-black" style={{ color: stat.color }}>{stat.value}</p><p className="text-gray-500 text-xs mt-1">{stat.label}</p></div>))}
            </div>
            <div className="rounded-2xl p-4" style={{ background: '#151515', border: '1px solid rgba(201,168,76,0.2)' }}><p className="text-gray-500 text-xs mb-1">Total Platform Balance</p><p className="text-[#c9a84c] text-2xl font-black">{formatUGX(totalBalance)}</p></div>
            <div className="rounded-2xl p-4" style={{ background: '#151515', border: '1px solid #2a2a2a' }}><p className="text-gray-500 text-xs mb-1">Total Completed Recharges</p><p className="text-white text-2xl font-black">{formatUGX(totalRecharge)}</p></div>
            <div className="rounded-2xl p-4" style={{ background: '#151515', border: '1px solid rgba(34,197,94,0.2)' }}><p className="text-gray-500 text-xs mb-1">PesaJet Live Recharges</p><p className="text-green-400 text-2xl font-black">{formatUGX(pesaRecharges.filter(r=>r.status==='completed').reduce((s:any,o:any)=>s+o.amount,0))} ({pesaRecharges.length} orders)</p></div>
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: '#1a1a1a', border: '1px solid #333' }}><Search size={14} className="text-gray-500" /><input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search by phone..." className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-600" /></div>
            <p className="text-gray-600 text-xs">{filteredUsers.length} users</p>
            {filteredUsers.map(user => (
              <div key={user.id} className="rounded-2xl p-4" style={{ background: '#151515', border: '1px solid #2a2a2a' }}>
                <div className="flex items-start justify-between mb-2"><div><p className="text-white font-bold text-sm">{user.phone}</p><p className="text-gray-500 text-xs">{new Date(user.createdAt).toLocaleDateString()}</p></div><span className="text-[10px] font-bold text-black px-2 py-0.5 rounded-full gold-gradient">Lv{user.level}</span></div>
                <div className="grid grid-cols-2 gap-2 mt-2"><div className="rounded-xl p-2 text-center" style={{ background: '#1e1e1e' }}><p className="text-[#c9a84c] font-bold text-sm">{formatUGX(user.balance)}</p><p className="text-gray-600 text-[10px]">Balance</p></div><div className="rounded-xl p-2 text-center" style={{ background: '#1e1e1e' }}><p className="text-white font-bold text-sm">{user.referralCode}</p><p className="text-gray-600 text-[10px]">Referral Code</p></div></div>
              </div>
            ))}
          </div>
        )}

        {tab === 'recharge' && (
          <div className="space-y-3">
            <p className="text-gray-500 text-xs">{rechargeOrders.length} total orders — {pendingRecharge.length} pending</p>
            {rechargeOrders.map(order => {
              const user = getUsers().find(u => u.id === order.userId);
              return (<div key={order.id} className="rounded-2xl p-4" style={{ background: '#151515', border: '1px solid #2a2a2a' }}><div className="flex justify-between items-start mb-3"><div><p className="text-white font-bold">{formatUGX(order.amount)}</p><p className="text-gray-400 text-xs">{user?.phone}</p><p className="text-gray-600 text-xs">{new Date(order.createdAt).toLocaleString()}</p></div><span className="text-[10px] px-2 py-1 rounded-full font-medium" style={getStatusStyle(order.status)}>{order.status}</span></div>{order.status === 'pending' && (<div className="grid grid-cols-2 gap-2"><button onClick={() => handleApproveRecharge(order.id)} className="py-2.5 rounded-xl text-xs font-bold text-black flex items-center justify-center gap-1 gold-gradient"><Check size={13} /> Approve</button><button onClick={() => handleRejectRecharge(order.id)} className="py-2.5 rounded-xl text-xs font-bold text-red-400 flex items-center justify-center gap-1" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}><X size={13} /> Reject</button></div>)}</div>);
            })}
          </div>
        )}

        {tab === 'pesajet' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center"><p className="text-gray-400 text-xs">{pesaRecharges.length} PesaJet orders — {pendingPesa.length} pending</p><button onClick={()=>setRefresh(r=>r+1)} className="text-xs px-3 py-1.5 rounded-full bg-yellow-500 text-black font-bold">Refresh</button></div>
            {pesaRecharges.length===0? (<div className="rounded-2xl p-10 text-center" style={{background:'#151515'}}><p className="text-gray-600 text-sm">No PesaJet recharges yet</p><p className="text-gray-500 text-xs mt-2">When user pays via PesaJet popup, it appears here instantly</p></div>) : pesaRecharges.map((r:any)=>(
              <div key={r.id} className="rounded-2xl p-4" style={{background:'#151515', border: `1px solid ${r.status==='completed'?'rgba(34,197,94,0.3)':'rgba(251,191,36,0.3)'}`}}>
                <div className="flex justify-between items-start mb-3">
                  <div><p className="text-white font-bold text-sm">{formatUGX(r.amount)} — {r.provider?.toUpperCase()}</p><p className="text-gray-300 text-xs mt-1">📱 {r.phone}</p><p className="text-gray-500 text-[11px]">Ref: {r.reference}</p><p className="text-gray-600 text-[11px]">{new Date(r.created_at).toLocaleString()}</p>{r.user_id && <p className="text-blue-400 text-[10px]">User ID: {r.user_id}</p>}</div>
                  <span className="text-[10px] px-2 py-1 rounded-full font-bold" style={r.status==='completed'?{background:'rgba(34,197,94,0.12)',color:'#22c55e'}:{background:'rgba(251,191,36,0.12)',color:'#fbbf24'}}>{r.status.toUpperCase()}</span>
                </div>
                {r.status!=='completed' && (
                  <button onClick={async()=>{
                    const allUsers = getUsers();
                    const matched = allUsers.find((u:any)=> {
                      const cleanPhone = (p:string)=> p.replace(/\D/g,'').slice(-9);
                      return cleanPhone(u.phone)===cleanPhone(r.phone);
                    });
                    if(matched){
                      updateUser(matched.id, { balance: matched.balance + r.amount });
                      addTransaction({ userId: matched.id, type: 'income', amount: r.amount, status: 'completed', description: `PesaJet ${r.provider} ${r.reference}` });
                      const { error } = await supabase.from('recharges').update({status:'completed'}).eq('id', r.id);
                      if(!error){ toast.success(`Credited ${formatUGX(r.amount)} to ${matched.phone}`); setRefresh(v=>v+1); } else { toast.error(error.message); }
                    } else {
                      const { error } = await supabase.from('recharges').update({status:'completed'}).eq('id', r.id);
                      if(!error){ toast.success('Marked completed - user not found by phone, credit manually'); setRefresh(v=>v+1); }
                    }
                  }} className="w-full py-3 rounded-xl text-xs font-bold text-black gold-gradient flex items-center justify-center gap-2"><Check size={14}/> Approve & Credit Balance</button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'withdraw' && (
          <div className="space-y-3">
            <p className="text-gray-500 text-xs">{withdrawOrders.length} total — {pendingWithdraw.length} pending</p>
            {withdrawOrders.map(order => {
              const user = getUsers().find(u => u.id === order.userId);
              return (<div key={order.id} className="rounded-2xl p-4" style={{ background: '#151515', border: '1px solid #2a2a2a' }}><div className="flex justify-between items-start mb-2"><div><p className="text-white font-bold">{formatUGX(order.amount)}</p><p className="text-gray-400 text-xs">{user?.phone || 'Unknown'}</p><p className="text-gray-500 text-xs">{order.bankCard?.bank} — {order.bankCard?.accountNumber}</p><p className="text-gray-600 text-xs">{new Date(order.createdAt).toLocaleString()}</p></div><span className="text-[10px] px-2 py-1 rounded-full font-medium" style={getStatusStyle(order.status)}>{order.status}</span></div>{order.status === 'pending' && (<div className="grid grid-cols-2 gap-2"><button onClick={() => handleApproveWithdraw(order.id)} className="py-2.5 rounded-xl text-xs font-bold text-black flex items-center justify-center gap-1 gold-gradient"><Check size={13} /> Approve</button><button onClick={() => handleRejectWithdraw(order.id)} className="py-2.5 rounded-xl text-xs font-bold text-red-400 flex items-center justify-center gap-1" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}><X size={13} /> Reject</button></div>)}</div>);
            })}
          </div>
        )}

        {tab === 'products' && (
          <div className="space-y-3">
            {PRODUCTS.map(product => {
              const purchases = userProducts.filter(p => p.productId === product.id);
              return (<div key={product.id} className="rounded-2xl p-4" style={{ background: '#151515', border: '1px solid #2a2a2a' }}><div className="flex items-center justify-between"><div><div className="flex items-center gap-2"><span className="text-[9px] font-bold text-black px-1.5 py-0.5 rounded gold-gradient">VIP{product.vip}</span><p className="text-white font-semibold text-sm">{product.name}</p></div><p className="text-[#c9a84c] font-bold mt-1">{formatUGX(product.price)}</p></div><div className="text-right"><p className="text-2xl font-black text-white">{purchases.length}</p><p className="text-gray-500 text-[10px]">purchases</p></div></div></div>);
            })}
          </div>
        )}

        {tab === 'resets' && (
          <div className="space-y-3">
            <p className="text-gray-500 text-xs">{passwordResets.length} total requests — {pendingResets.length} pending</p>
            {passwordResets.map((req: PasswordResetRequest) => (
              <div key={req.id} className="rounded-2xl p-4" style={{ background: '#151515', border: `1px solid ${req.status === 'pending'? 'rgba(245,158,11,0.35)' : '#2a2a2a'}` }}>
                <div className="flex justify-between items-start mb-3"><div><p className="text-white font-bold text-sm">{req.phone}</p><p className="text-gray-500 text-xs">{new Date(req.createdAt).toLocaleString()}</p></div><span className="text-[10px] px-2 py-1 rounded-full font-bold" style={req.status === 'approved'? { background: 'rgba(34,197,94,0.12)', color: '#22c55e' } : req.status === 'rejected'? { background: 'rgba(239,68,68,0.12)', color: '#ef4444' } : { background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>{req.status.toUpperCase()}</span></div>
                {req.status === 'pending' && (<div className="grid grid-cols-2 gap-2"><button onClick={() => { approvePasswordReset(req.id); toast.success(`Approved for ${req.phone}`); setRefresh(r => r + 1); }} className="py-2.5 rounded-xl text-xs font-bold text-black flex items-center justify-center gap-1 gold-gradient"><Check size={13} /> Approve</button><button onClick={() => { rejectPasswordReset(req.id); toast.success('Rejected'); setRefresh(r => r + 1); }} className="py-2.5 rounded-xl text-xs font-bold text-red-400 flex items-center justify-center gap-1" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}><X size={13} /> Reject</button></div>)}
              </div>
            ))}
          </div>
        )}

        {tab === 'gifts' && (<GiftToolsTab users={users} rechargeOrders={rechargeOrders} withdrawOrders={withdrawOrders} onRefresh={() => setRefresh(r => r + 1)} />)}
      </div>
    </div>
  );
                                                                                                                                                 }
