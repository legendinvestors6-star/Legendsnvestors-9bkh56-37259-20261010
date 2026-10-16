import { useState } from 'react';
import { ChevronLeft, Gift, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { redeemGiftCode, formatUGX } from '@/lib/storage';
import { TELEGRAM_LINK } from '@/constants/products';

function getSupaUser() {
  try {
    const raw = localStorage.getItem('legend_user');
    if (!raw) return null;
    const u = JSON.parse(raw);
    return { id: u.id, phone: u.phone, balance: u.balance||0, referral_code: u.referral_code };
  } catch { return null; }
}

export default function RedeemGiftPage() {
  const navigate = useNavigate();
  const [currentUser] = useState(() => getSupaUser());
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  if (!currentUser) { navigate('/login'); return null; }

  const handleRedeem = () => {
    if (!code.trim()) { toast.error('Please enter a gift code'); return; }
    setLoading(true);
    setTimeout(() => {
      const result = redeemGiftCode(currentUser.id, code.trim().toUpperCase());
      if (result.success) {
        toast.success(`Gift code redeemed! +${formatUGX(result.amount || 0)}`);
        setCode('');
        // refresh balance
        const raw = localStorage.getItem('legend_user');
        if (raw) {
          const updated = JSON.parse(raw);
          console.log('New balance:', updated.balance);
        }
      } else {
        toast.error(result.message);
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="app-container min-h-screen" style={{ background: '#0a0a0a' }}>
      <div className="flex items-center gap-3 p-4" style={{ background: '#111111', borderBottom: '1px solid #2a2a2a' }}>
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#1e1e1e' }}>
          <ChevronLeft size={18} className="text-gray-400" />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-white font-bold text-lg">Redeem Gift</h1>
        </div>
      </div>

      <div className="px-4 mt-5 space-y-4">
        <div className="rounded-2xl p-5" style={{ background: '#151515', border: '1px solid rgba(201,168,76,0.2)' }}>
          <h2 className="font-black text-white mb-1">Legend Investors</h2>
          <p className="text-gray-500 text-sm mb-5">Redeem Gift Code - {currentUser.phone}</p>

          <p className="text-sm text-gray-500 mb-2">Get gift codes from the official group</p>
          <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5"
            style={{ background: 'rgba(0,136,204,0.1)', border: '1px solid rgba(0,136,204,0.2)' }}>
            <span className="text-[#0088cc] text-sm">Official Telegram Group</span>
          </a>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-400 mb-2 block flex items-center gap-1.5">
              <Tag size={13} className="text-[#c9a84c]" /> Gift Code
            </label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="Enter gift code (e.g. ABC12345)"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              autoCapitalize="off"
              className="w-full rounded-xl px-4 py-3.5 text-sm outline-none text-white uppercase tracking-widest placeholder-gray-600"
              style={{ background: '#1e1e1e', border: '1.5px solid #333' }}
            />
          </div>

          <button onClick={handleRedeem} disabled={loading}
            className="w-full gold-gradient py-4 rounded-xl font-bold text-black disabled:opacity-60 flex items-center justify-center gap-2">
            <Gift size={18} />
            {loading? 'Redeeming...' : 'Confirm'}
          </button>
        </div>

        <div className="rounded-2xl p-4" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}>
          <p className="text-[#c9a84c] text-sm font-semibold mb-2">How to get gift codes?</p>
          <div className="space-y-1.5 text-xs text-gray-500">
            <p>• Gift codes are created exclusively by the platform admin.</p>
            <p>• Join the official Telegram group to receive codes.</p>
            <p>• Each code can only be used once.</p>
            <p>• Redeemed balance is added instantly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}