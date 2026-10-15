import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowDownToLine, Calendar, CheckSquare, ChevronRight, Bell, Clock, TrendingUp } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import MessageNotification from '@/components/features/MessageNotification';
import { getUserProducts, creditDailyIncome, getNextPayoutMs, formatUGX } from '@/lib/storage';
import { PRODUCTS } from '@/constants/products';
import { toast } from 'sonner';
import heroBanner from '@/assets/hero-banner.jpg';

const GAME_IMAGES = [
  'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=200&h=150&fit=crop',
  'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=200&h=150&fit=crop',
  'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=200&h=150&fit=crop',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&h=150&fit=crop',
];

function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// Helper to get user from NEW Supabase storage
function getSupaUser() {
  try {
    const raw = localStorage.getItem('legend_user');
    if (!raw) return null;
    const u = JSON.parse(raw);
    return {
      id: u.id,
      phone: u.phone,
      balance: u.balance || 0,
      cumulativeIncome: u.cumulativeIncome || u.balance || 0,
      referral_code: u.referral_code,
      referralCode: u.referral_code,
      isAdmin:!!(u.is_admin || u.isadmin),
    };
  } catch { return null; }
}

export default function HomePage() {
  const navigate = useNavigate();
  const [showNotification, setShowNotification] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => getSupaUser());
  const [nextPayoutMs, setNextPayoutMs] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    const shown = sessionStorage.getItem('legend_notification_shown');
    if (!shown) { setShowNotification(true); sessionStorage.setItem('legend_notification_shown', '1'); }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      // Try credit income (works with local product system)
      try {
        const result = creditDailyIncome(currentUser.id);
        if (result?.credited > 0) {
          toast.success(`Daily income credited: +${formatUGX(result.credited)}`, { description: 'From your active products', duration: 6000, icon: '💰' });
        }
      } catch {}
      setNextPayoutMs(getNextPayoutMs(currentUser.id));

      // Refresh balance from localStorage legend_user
      const fresh = getSupaUser();
      if (fresh) setCurrentUser(fresh);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser) setNextPayoutMs(getNextPayoutMs(currentUser.id));
  }, []);

  if (!currentUser) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading... <button onClick={() => navigate('/login')} className="ml-2 underline">Login</button></div>;
  }

  const userProducts = getUserProducts(currentUser.id);
  const activeProducts = userProducts.filter(p => p.status === 'active');
  const dailyTotal = activeProducts.reduce((sum, up) => {
    const def = PRODUCTS.find(p => p.id === up.productId);
    return sum + (def?.dailyIncome || 0);
  }, 0);

  const quickActions = [
    { icon: CreditCard, label: 'Recharge', path: '/recharge', color: '#c9a84c' },
    { icon: ArrowDownToLine, label: 'Withdraw', path: '/withdraw', color: '#c9a84c' },
    { icon: Calendar, label: 'Check In', path: '/checkin', color: '#c9a84c' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks', color: '#c9a84c' },
  ];

  return (
    <AppLayout>
      {showNotification && <MessageNotification onClose={() => setShowNotification(false)} />}

      <div className="flex justify-end px-4 pt-3">
        <button onClick={() => setShowNotification(true)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <Bell size={16} className="text-[#c9a84c]" />
        </button>
      </div>

      <div className="relative mx-4 mt-2 rounded-2xl overflow-hidden">
        <img src={heroBanner} alt="Legend Investors" className="w-full h-44 object-cover" />
        <div className="absolute inset-0 flex items-end p-4" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)' }}>
          <div><p className="text-gray-400 text-xs">Enter</p><h2 className="text-white text-3xl font-black">A New World</h2></div>
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold text-black gold-gradient">LEGEND</div>
      </div>

      {activeProducts.length > 0 && (
        <div className="mx-4 mt-3 rounded-2xl p-3 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #1a1100, #2d1f00)', border: '1px solid rgba(201,168,76,0.35)' }}>
          <div
