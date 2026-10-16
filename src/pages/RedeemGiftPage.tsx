import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Gift, ArrowLeft } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { formatUGX } from '@/lib/storage';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function RedeemGiftPage() {
  const navigate = useNavigate();
  const [giftCodeInput, setGiftCodeInput] = useState('');
  const [loading, setLoading] = useState(false);

  const getCurrentUser = () => {
    try {
      const raw = localStorage.getItem('legend_user');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  };
  const currentUser = getCurrentUser();

  const handleRedeem = async () => {
    const code = giftCodeInput.toUpperCase().trim();
    if(!code) return toast.error('Enter code');
    if(!currentUser) return toast.error('Please login first');

    setLoading(true);
    try {
      // 1. Check code from Supabase
      const { data, error } = await supabase.from('gift_codes').select('*').eq('code', code).single();
      
      if(error || !data) {
        toast.error(`Invalid code: ${code}`);
        setLoading(false);
        return;
      }
      if((data as any).used_by) {
        toast.error('Code already used');
        setLoading(false);
        return;
      }

      // 2. Get fresh balance from DB (not localStorage)
      const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', currentUser.id).single();
      
      if(userError || !userData) {
        toast.error('User not found');
        setLoading(false);
        return;
      }

      // 3. FIRST add balance (safer order)
      const newBalance = (userData.balance || 0) + Number(data.amount);
      const { error: balError } = await supabase.from('users').update({ balance: newBalance }).eq('id', currentUser.id);

      if (balError) {
        toast.error('Failed to add balance: ' + balError.message);
        setLoading(false);
        return;
      }

      // 4. THEN mark code as used
      const { error: updateError } = await supabase.from('gift_codes').update({ 
        used_by: currentUser.phone || currentUser.id, 
        used_at: new Date().toISOString() 
      }).eq('id', data.id);

      if (updateError) {
        // Rollback balance if marking fails
        await supabase.from('users').update({ balance: userData.balance }).eq('id', currentUser.id);
        toast.error('Failed to redeem');
        setLoading(false);
        return;
      }

      // 5. Update local storage
      try {
        const updated = { ...currentUser, ...userData, balance: newBalance };
        localStorage.setItem('legend_user', JSON.stringify(updated));
      } catch {}

      toast.success(`Redeemed ${formatUGX(data.amount)}!`);
      setGiftCodeInput('');
      
    } catch (err: any) {
      toast.error(err.message || 'Redeem failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="flex items-center gap-3 p-4 bg-[#111] border-b border-[#222]">
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-[#1e1e1e] flex items-center justify-center">
          <ArrowLeft size={16} />
        </button>
        <h1 className="font-black">Redeem Gift</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-4 space-y-4">
          <div>
            <p className="font-bold">Legend Investors</p>
            <p className="text-xs text-gray-500 mt-1">Redeem Gift Code - 0756406186</p>
            <p className="text-xs text-gray-500 mt-2">Get gift codes from the official group</p>
            <a href="#" className="mt-3 block w-full text-center py-3 rounded-xl bg-[#1e2a3a] text-[#4a90e2] text-sm">Official Telegram Group</a>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-400 flex items-center gap-1">
              <Gift size={12} className="text-[#c9a84c]" /> Gift Code
            </label>
            <input
              value={giftCodeInput}
              onChange={(e) => setGiftCodeInput(e.target.value.toUpperCase())}
              placeholder="Enter gift code"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="w-full bg-[#1e1e1e] border border-[#333] rounded-xl px-4 py-3 text-sm outline-none uppercase tracking-widest"
            />
          </div>

          <button
            onClick={handleRedeem}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#c9a84c] to-[#f5d76e] text-black font-black py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Gift size={18} />
            {loading ? 'Checking...' : 'Confirm'}
          </button>
        </div>

        <div className="bg-[#151515]/50 border border-[#2a2a2a]/50 rounded-2xl p-4">
          <p className="text-[#c9a84c] text-sm font-bold">How to get gift codes?</p>
          <ul className="text-xs text-gray-500 mt-2 space-y-1">
            <li>• Gift codes are created exclusively by the platform admin.</li>
            <li>• Join the official Telegram group to receive codes.</li>
            <li>• Each code can only be used once.</li>
            <li>• Redeemed balance is added instantly.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}