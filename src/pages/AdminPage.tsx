import { useState, useEffect } from 'react';
import { getRechargeOrders, getWithdrawOrders, approveRechargeOrder, rejectRechargeOrder, approveWithdrawOrder, rejectWithdrawOrder, getUsers, formatUGX } from '@/lib/storage';
import { Button } from '@/components/ui/button';

export const AdminPage = () => {
  const [recharges, setRecharges] = useState<any[]>([]);
  const [withdraws, setWithdraws] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const loadData = () => {
    setRecharges(getRechargeOrders());
    setWithdraws(getWithdrawOrders());
    setUsers(getUsers());
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Panel - 0746085840</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Users: {users.length}</h2>
        <div className="space-y-2">
          {users.map((u: any) => (
            <div key={u.id} className="border p-2 rounded flex justify-between">
              <span>{u.phone}</span>
              <span>{formatUGX(u.balance)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Recharge Orders (Now Automatic)</h2>
        <p className="text-sm text-gray-500 mb-2">Recharges are now automatic - status = completed instantly</p>
        <div className="space-y-2">
          {recharges.map((o: any) => (
            <div key={o.id} className="border p-2 rounded flex justify-between items-center">
              <div>
                <div>{o.userId} - {formatUGX(o.amount)}</div>
                <div className="text-xs">{o.status} - {o.paymentMethod}</div>
              </div>
              <div className="flex gap-2">
                {o.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => { approveRechargeOrder(o.id); loadData(); }}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => { rejectRechargeOrder(o.id); loadData(); }}>Reject</Button>
                  </>
                )}
                {o.status === 'completed' && <span className="text-green-600">Completed ✓</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Withdraw Orders</h2>
        <div className="space-y-2">
          {withdraws.map((o: any) => (
            <div key={o.id} className="border p-2 rounded flex justify-between items-center">
              <div>
                <div>{o.userId} - {formatUGX(o.amount)} → {formatUGX(o.receivedAmount)}</div>
                <div className="text-xs">{o.status}</div>
              </div>
              <div className="flex gap-2">
                {o.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => { approveWithdrawOrder(o.id); loadData(); }}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => { rejectRechargeOrder(o.id); loadData(); }}>Reject</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={loadData}>Refresh</Button>
    </div>
  );
};

export default AdminPage;