import { useState, useEffect } from 'react';
import { Users, CreditCard, ArrowDownToLine, BarChart3, Check, X, Search, LogOut, Shield, Gift, DollarSign, Trash2, Plus, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import { formatUGX } from '@/lib/storage';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [searchQ, setSearchQ] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [recharges, setRecharges] = useState<any[]>([]);
  const [giftCodes, setGiftCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gcCode, setGcCode] = useState('');
  const [gcAmt, setGcAmt] = useState('');
  const [editBal, setEditBal] = useState<{id: string, val: string} | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const { data: u } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    const { data: r } = await supabase.from('recharges').select('*').order('created_at', { ascending: false }).limit(200);
    const { data: g } = await supabase.from('gift_codes').select('*').order('created_at', { ascending: false });
    if (u) setUsers(u);
    if (r) setRecharges(r);
    if (g) setGiftCodes(g);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => {
    const raw = localStorage.getItem('legend_user');
    if (!raw) { navigate('/login'); return; }
    try {
      const u = JSON.parse(raw);
      if (!(u.is_admin || u.isAdmin || u.phone === '0746085840')) navigate('/home');
    } catch { navigate('/login'); }
  }, []);

  const normalUsers = users.filter(u => !u.is_admin);
  const pendingRecharge = recharges.filter(r => r.status !== 'completed');
  const totalBal = normalUsers.reduce((s, u) => s + (u.balance || 0), 0);
  const filtered = normalUsers.filter(u => u.phone?.includes(searchQ));

  // --- ACTIONS ---
  const updateBalance = async (userId: string, newBalance: number) => {
    const { error } = await supabase.from('users').update({ balance: newBalance }).eq('id', userId);
    if (error) toast.error(error.message);
    else { toast.success('Balance updated to ' + formatUGX(newBalance)); fetchAll(); setEditBal(null); }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Delete user?')) return;
    await supabase.from('users').delete().eq('id', id);
    toast.success('Deleted'); fetchAll();
  };

  const approveRecharge = async (r: any) => {
    const user = users.find(u => u.id === r.user_id || u.phone === r.phone);
    if (!user) return toast.error('User not found');
    await supabase.from('users').update({ balance: (user.balance || 0) + Number(r.amount) }).eq('id', user.id);
    await supabase.from('recharges').update({ status: 'completed' }).eq('id', r.id);
    toast.success('Approved + ' + r.amount); fetchAll();
  };

  const createGift = async () => {
    if (!gcCode || !gcAmt) return toast.error('Enter code & amount');
    const { error } = await supabase.from('gift_codes').insert({
      id: Date.now().toString(),
      code: gcCode.toUpperCase().trim(),
      amount: parseInt(gcAmt)
    });
    if (error) toast.error(error.message.includes('duplicate') ? 'Code already exists' : error.message);
    else { toast.success('Created ' + gcCode.toUpperCase()); setGcCode(''); setGcAmt(''); fetchAll(); }
  };

  const deleteGift = async (id: string) => {
    await supabase.from('gift_codes').delete().eq('id', id);
    fetchAll();
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="flex justify-between p-4 bg-[#111] border-b border-[#222]">
        <span className="font-black"><Shield className="inline mr-2 text-[#c9a84c]" size={18}/>Admin - {normalUsers.length} users - {formatUGX(totalBal)}</span>
        <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="bg-[#222] p-2 rounded-xl"><LogOut size={16}/></button>
      </div>

      <div className="flex overflow-x-auto bg-[#111] border-b border-[#1a1a1a]">
        {[
          {k:'overview', l:'Overview', i:BarChart3},
          {k:'users', l:`Users (${normalUsers.length})`, i:Users},
          {k:'recharge', l:`Recharge (${pendingRecharge.length})`, i:DollarSign},
          {k:'gifts', l:`Gift Codes (${giftCodes.length})`, i:Gift},
        ].map(t => (
          <button key={t.k} onClick={()=>setTab(t.k)} className={`px-4 py-3 text-xs font-bold ${tab===t.k?'text-[#c9a84c] border-b-2 border-[#c9a84c]':'text-[#666]'}`}>{t.l}</button>
        ))}
      </div>

      <div className="p-4">
        {tab==='overview' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#151515] border border-[#222] p-4 rounded-2xl"><p className="text-3xl font-black text-[#c9a84c]">{normalUsers.length}</p><p className="text-xs text-gray-500">Total Users</p></div>
            <div className="bg-[#151515] border border-[#222] p-4 rounded-2xl"><p className="text-3xl font-black text-yellow-400">{pendingRecharge.length}</p><p className="text-xs text-gray-500">Pending Recharge</p></div>
            <div className="bg-[#151515] border border-[#222] p-4 rounded-2xl"><p className="text-2xl font-black text-green-400">{formatUGX(totalBal)}</p><p className="text-xs text-gray-500">Total Balance</p></div>
            <div className="bg-[#151515] border border-[#222] p-4 rounded-2xl"><p className="text-2xl font-black">{giftCodes.length}</p><p className="text-xs text-gray-500">Gift Codes</p></div>
          </div>
        )}

        {tab==='users' && (
          <div className="space-y-3">
            <div className="flex gap-2 bg-[#1a1a1a] border border-[#333] rounded-xl px-3 py-2.5"><Search size={14} className="text-gray-500"/><input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search phone..." className="bg-transparent outline-none text-sm w-full"/></div>
            {filtered.map(u=>(
              <div key={u.id} className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-4">
                <div className="flex justify-between">
                  <p className="font-bold">{u.phone} {u.is_admin && '(ADMIN)'}</p>
                  <button onClick={()=>deleteUser(u.id)} className="text-red-400"><Trash2 size={14}/></button>
                </div>
                <p className="text-xs text-gray-500">{new Date(u.created_at).toLocaleString()} - Code: {u.referral_code} - Ref by: {u.referred_by || 'NONE'}</p>
                <div className="mt-2 flex gap-2 items-center">
                  <span className="text-[#c9a84c] font-black">{formatUGX(u.balance || 0)}</span>
                  {editBal?.id===u.id ? (
                    <div className="flex gap-2">
                      <input value={editBal.val} onChange={e=>setEditBal({id:u.id, val:e.target.value})} type="number" className="w-24 bg-[#222] border border-[#333] rounded-lg px-2 py-1 text-sm"/>
                      <button onClick={()=>updateBalance(u.id, parseInt(editBal.val))} className="bg-green-600 px-3 py-1 rounded-lg text-xs"><Check size={12}/></button>
                      <button onClick={()=>setEditBal(null)} className="bg-[#333] px-3 py-1 rounded-lg text-xs"><X size={12}/></button>
                    </div>
                  ) : (
                    <button onClick={()=>setEditBal({id:u.id, val:(u.balance||0).toString()})} className="bg-[#222] px-3 py-1 rounded-full text-xs flex gap-1"><Edit3 size={12}/> Edit Balance</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==='recharge' && (
          <div className="space-y-2">
            {recharges.map(r=>(
              <div key={r.id} className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-3 flex justify-between items-center">
                <div><p className="text-sm font-bold">{r.amount} UGX - {r.phone}</p><p className="text-xs text-gray-500">{r.provider} - {r.status} - {new Date(r.created_at).toLocaleString()}</p><p className="text-xs">Ref: {r.reference}</p></div>
                {r.status!=='completed' && <button onClick={()=>approveRecharge(r)} className="bg-yellow-500 text-black px-4 py-2 rounded-full text-xs font-bold">Approve</button>}
              </div>
            ))}
          </div>
        )}

        {tab==='gifts' && (
          <div className="space-y-4">
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-4 space-y-3">
              <p className="font-bold text-[#c9a84c] text-sm">Create Gift Code (Works for ALL users)</p>
              <input value={gcCode} onChange={e=>setGcCode(e.target.value.toUpperCase())} placeholder="Code e.g. PROBABLY" className="w-full bg-[#1e1e1e] border border-[#333] rounded-xl px-3 py-3 text-sm outline-none"/>
              <input value={gcAmt} onChange={e=>setGcAmt(e.target.value)} type="number" placeholder="Amount e.g. 5000" className="w-full bg-[#1e1e1e] border border-[#333] rounded-xl px-3 py-3 text-sm outline-none"/>
              <button onClick={createGift} className="w-full bg-yellow-500 text-black py-3 rounded-xl font-bold flex justify-center gap-2"><Plus size={16}/>Create Code</button>
            </div>
            <div className="space-y-2">
              {giftCodes.map((g:any)=>(
                <div key={g.id} className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-3 flex justify-between">
                  <div><p className="font-bold">{g.code}</p><p className="text-xs text-[#c9a84c]">{formatUGX(g.amount)} - {g.used_by ? `USED by ${g.used_by}` : 'ACTIVE'}</p></div>
                  <button onClick={()=>deleteGift(g.id)} className="text-red-400 text-xs">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}