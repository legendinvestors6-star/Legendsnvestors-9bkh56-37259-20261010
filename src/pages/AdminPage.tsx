import { useState, useEffect, useCallback } from 'react';
import { LogOut, Shield, CreditCard, ArrowDownCircle, Gift, Package, Users, Banknote, Play, Trophy, Megaphone } from 'lucide-react';
import { getAdminStats, processDailyIncome } from '@/lib/adminData';
import type { AdminStats } from '@/types/admin';
import { toast } from 'sonner';
import StatsOverview from '@/components/admin/StatsOverview';
import PaymentsTab from '@/components/admin/PaymentsTab';
import WithdrawalsTab from '@/components/admin/WithdrawalsTab';
import RedeemTab from '@/components/admin/RedeemTab';
import PackagesTab from '@/components/admin/PackagesTab';
import UsersTab from '@/components/admin/UsersTab';
import RechargesTab from '@/components/admin/RechargesTab';
import MissionsTab from '@/components/admin/MissionsTab';
import BroadcastTab from '@/components/admin/BroadcastTab';

type Tab = 'recharges' | 'payments' | 'withdrawals' | 'redeem' | 'packages' | 'users' | 'missions' | 'broadcast';

interface Props {
  onLogout: () => void;
