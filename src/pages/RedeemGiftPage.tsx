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
      const result = redeemGiftCode(currentUser.id, code.trim());
      if (result.success) {
        toast.success(`Gift code redeemed! +${formatUGX(result.amount || 0)}`);
        setCode('');
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
          <div className="flex flex-col gap-0.5">
            <div className="w-4 h-0.5 gold-gradient rounded-full" />
            <div className="w-4 h-0.5 gold-gradient rounded-full" />
            <div className="w-4 h-0.5 gold-gradient rounded-full" />
          </div>
          <h1 className="text-white font-bold text-lg">Redeem Gift</h1>
        </div>
      </div>

      <div className="px-4 mt-5 space-y-4">
        <div className="rounded-2xl p-5" style={{ background: '#151515', border: '1px solid rgba(201,168,76,0.2)' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex flex-col gap-0.5">
              <div className="w-4 h-0.5 gold-gradient rounded-full" />
              <div className="w-4 h-0.5 gold-gradient rounded-full" />
