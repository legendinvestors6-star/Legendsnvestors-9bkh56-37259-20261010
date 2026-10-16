import { useState, useEffect } from 'react';
import { getRechargeOrders, getWithdrawOrders, getUsers, getGiftCodes, createGiftCode, deleteGiftCode, approveWithdrawOrder, rejectWithdrawOrder, formatUGX, getTransactions, getPasswordResets } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const AdminPage = () => {
  const [tab, setTab] = useState<'users' | 'recharge' | 'withdraw' | 'gifts' | 'resets'>('users');
  const [recharges, setRecharges] = useState<any[]>([]);
  const [withdraws, setWithdraws] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [gifts, setGifts] = useState<any[]>([]);
  const [resets, setResets] = useState<any[]>([]);
  const [giftAmount, setGiftAmount] = useState('10000');
  const [giftCodeCustom, setGiftCodeCustom] = useState('');

  const loadData = () => {
    setRecharges(getRechargeOrders());
    setWithdraws(getWithdrawOrders());
    setUsers(getUsers());
    setGifts(getGiftCodes());
    setResets(getPasswordResets());
  };

  useEffect(() => { loadData(); }, []);

  const totalBalance = users.reduce((s: number, u: any) => s + (Number(u.balance)||0), 0);
  const totalRecharge = recharges.filter((r:any)=>r.status==='completed').reduce((s:number,r:any)=>s+r.amount,0);

  return (
    <div className="p-4 max-w-5xl mx-auto pb-20 bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">Admin - 0746085840</h1>
      
      {/* STATS */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-zinc-900 p-4 rounded-xl"><div className="text-gray-400 text-sm">Total Users</div><div className="text-2xl font-bold">{users.length}</div></div>
        <div className="bg-zinc-900 p-4 rounded-xl"><div className="text-gray-400 text-sm">Total Balance</div><div className="text-xl font-bold">{formatUGX(totalBalance)}</div></div>
        <div className="bg-zinc-900 p-4 rounded-xl"><div className="text-gray-400 text-sm">Recharges</div><div className="text-xl font-bold">{formatUGX(totalRecharge)}</div></div>
        <div className="bg-zinc-900 p-4 rounded-xl"><div className="text-gray-400 text-sm">Pending Withdraw</div><div className="text-2xl font-bold">{withdraws.filter((w:any)=>w.status==='pending').length}</div></div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {['users','recharge','withdraw','gifts','resets'].map(t=>(
          <Button key={t} size="sm" variant={tab===t?'default':'outline'} onClick={()=>setTab(t as any)} className="capitalize">{t}</Button>
        ))}
      </div>

      {tab==='users' && (
        <div className="space-y-2">
          {users.length===0 && <p className="text-gray-500">No users on this device - data is per browser (localStorage)</p>}
          {users.map((u:any)=>(
            <div key={u.id} className="bg-zinc-900 p-3 rounded flex justify-between items-center">
              <div><div className="font-mono text-sm">{u.phone}</div><div className="text-xs text-gray-400">{u.referralCode} | Ref: {u.referredBy?.slice(0,6)||'none'}</div></div>
              <div className="text-right"><div className="font-bold">{formatUGX(u.balance)}</div><div className="text-xs text-gray-400">{new