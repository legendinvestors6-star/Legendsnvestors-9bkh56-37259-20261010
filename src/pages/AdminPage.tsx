import { useState, useEffect } from 'react';
import { getRechargeOrders, getWithdrawOrders, getUsers, getGiftCodes, createGiftCode, deleteGiftCode, approveWithdrawOrder, rejectWithdrawOrder, formatUGX, getPasswordResets } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const AdminPage = () => {
  const [tab, setTab] = useState('users');
  const [re, setRe] = useState<any[]>([]);
  const [wd, setWd] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [gifts, setGifts] = useState<any[]>([]);
  const [resets, setResets] = useState<any[]>([]);
  const [amt, setAmt] = useState('10000');
  const [code, setCode] = useState('');

  const load = () => {
    setRe(getRechargeOrders());
    setWd(getWithdrawOrders());
    setUsers(getUsers());
    setGifts(getGiftCodes());
    setResets(getPasswordResets());
  };
  useEffect(()=>{load()},[]);

  const totalBal = users.reduce((s:number,u:any)=>s+(Number(u.balance)||0),0);
  const totalRe = re.filter((r:any)=>r.status==='completed').reduce((s:number,r:any)=>s+r.amount,0);

  return (
    <div className="p-4 max-w-5xl mx-auto bg-black min-h-screen text-white pb-20">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-zinc-900 p-4 rounded-xl"><div className="text-xs text-gray-400">Users</div><div className="text-2xl font-bold">{users.length}</div></div>
        <div className="bg-zinc-900 p-4 rounded-xl"><div className="text-xs text-gray-400">Total Bal</div><div className="font-bold">{formatUGX(totalBal)}</div></div>
        <div className="bg-zinc-900 p-4 rounded-xl"><div className="text-xs text-gray-400">Recharge</div><div className="font-bold">{formatUGX(totalRe)}</div></div>
        <div className="bg-zinc-900 p-4 rounded-xl"><div className="text-xs text-gray-400">Pending WD</div><div className="text-2xl font-bold">{wd.filter((w:any)=>w.status==='pending').length}</div></div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {['users','recharge','withdraw','gifts','resets'].map(t=>(
          <Button key={t} size="sm" variant={tab===t?'default':'outline'} onClick={()=>setTab(t)} className="capitalize">{t}</Button>
        ))}
      </div>

      {tab==='users' && <div className="space-y-2">
        {users.length===0 && <p className="text-gray-500 text-sm">No users - localStorage is per browser</p>}
        {users.map((u:any)=><div key={u.id} className="bg-zinc-900 p-3 rounded flex justify-between"><div><div className="font-mono text-sm">{u.phone}</div><div className="text-xs text-gray-400">{u.referralCode}</div></div><div className="font-bold">{formatUGX(u.balance)}</div></div>)}
      </div>}

      {tab==='recharge' && <div className="space-y-2">
        <p className="text-xs text-green-400">Automatic - completed instantly</p>
        {re.map((o:any)=><div key={o.id} className="bg-zinc-900 p-3 rounded flex justify-between text-sm"><div>{formatUGX(o.amount)} - {o.phoneNumber}</div><div className="text-green-500">{o.status}</div></div>)}
      </div>}

      {tab==='withdraw' && <div className="space-y-2">
        {wd.map((o:any)=><div key={o.id} className="bg-zinc-900 p-3 rounded text-sm"><div className="flex justify-between"><span>{formatUGX(o.amount)} to {formatUGX(o.receivedAmount)}</span><span>{o.status}</span></div><div className="text-xs text-gray-400">{o.userId}</div>{o.status==='pending' && <div className="flex gap-2 mt-2"><Button size="sm" className="bg-green-600" onClick={()=>{approveWithdrawOrder(o.id);load()}}>Approve</Button><Button size="sm" variant="destructive" onClick={()=>{rejectWithdrawOrder(o.id);load()}}>Reject</Button></div>}</div>)}
      </div>}

      {tab==='gifts' && <div>
        <div className="bg-zinc-900 p-3 rounded mb