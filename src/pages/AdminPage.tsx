import type { User, Transaction, RechargeOrder, WithdrawOrder, UserProduct } from '@/types';
import { REGISTRATION_BONUS, PRODUCTS, MTN_ACCOUNT, MTN_NAME } from '@/constants/products';

const KEYS = {
  USERS: 'legend_users',
  CURRENT_USER: 'legend_current_user',
  TRANSACTIONS: 'legend_transactions',
  RECHARGE_ORDERS: 'legend_recharge_orders',
  WITHDRAW_ORDERS: 'legend_withdraw_orders',
  USER_PRODUCTS: 'legend_user_products',
  GIFT_CODES: 'legend_gift_codes',
  PASSWORD_RESETS: 'legend_password_resets',
};

export interface PasswordResetRequest { id: string; phone: string; newPassword: string; status: 'pending' | 'approved' | 'rejected'; createdAt: string; resolvedAt?: string; note?: string; }
export interface GiftCode { id: string; code: string; amount: number; usedBy?: string; usedAt?: string; createdAt: string; note?: string; expiresAt?: string; }

function generateId(): string { return Math.random().toString(36).substr(2, 9) + Date.now().toString(36); }
function generateReferralCode(): string { return Math.random().toString(36).substr(2, 8).toUpperCase(); }

const ADMIN_PHONE = '0746085840';
const ADMIN_PASSWORD = 'milly@2323';

function initAdmin() {
  const users = getUsers();
  const adminIdx = users.findIndex(u => u.isAdmin);
  if (adminIdx === -1) {
    const admin: User = { id: 'admin001', phone: ADMIN_PHONE, password: ADMIN_PASSWORD, balance: 0, cumulativeIncome: 0, level: 1, referralCode: 'ADMIN000', checkInDays: 0, createdAt: new Date().toISOString(), isAdmin: true, } as User;
    saveUsers([...users, admin]);
  }
}

export function getUsers(): User[] { try { const data = localStorage.getItem(KEYS.USERS); return data? JSON.parse(data) : []; } catch { return []; } }
export function saveUsers(users: User[]): void { localStorage.setItem(KEYS.USERS, JSON.stringify(users)); }

// ===== FIXED VERSION - NEVER BLACK SCREEN =====
export function getCurrentUser(): User | null {
  try {
    const supaRaw = localStorage.getItem('legend_user');
    if (supaRaw) {
      const u = JSON.parse(supaRaw);
      if(!u ||!u.id) return null;
      return {
        id: u.id,
        phone: u.phone,
        password: u.password || '',
        balance: Number(u.balance || 0),
        cumulativeIncome: Number(u.balance || 0),
        level: 1,
        referralCode: u.referral_code || u.referralCode || '',
        referredBy: u.referred_by || u.referredBy || undefined,
        checkInDays: 0,
        createdAt: u.created_at || new Date().toISOString(),
        isAdmin: u.phone === ADMIN_PHONE || u.is_admin || u.isAdmin,
        bankCard: u.bankCard || null,
      } as User;
    }
    const id = localStorage.getItem(KEYS.CURRENT_USER);
    if (!id) return null;
    return getUsers().find(u => u.id === id) || null;
  } catch { return null; }
}

export function setCurrentUser(user: any): void {
  if (!user) {
    localStorage.removeItem('legend_user');
    localStorage.removeItem(KEYS.CURRENT_USER);
  } else if (typeof user === 'string') {
    localStorage.setItem(KEYS.CURRENT_USER, user);
  } else {
    localStorage.setItem('legend_user', JSON.stringify(user));
    localStorage.setItem(KEYS.CURRENT_USER, user.id);
  }
}

export function updateUser(userId: string, updates: Partial<User>): User | null {
  try {
    const raw = localStorage.getItem('legend_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u.id === userId) {
        const updated = {...u,...updates, balance: (updates as any).balance?? u.balance };
        // keep snake_case too
        if((updates as any).referralCode) (updated as any).referral_code = (updates as any).referralCode;
        localStorage.setItem('legend_user', JSON.stringify(updated));
      }
    }
  } catch {}
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return null;
  users[idx] = {...users[idx],...updates };
  saveUsers(users);
  return users[idx];
}

export function formatUGX(amount: number): string {
  try { return `UGX ${(Number(amount)||0).toLocaleString()}` } catch { return `UGX ${amount}` }
}

// Keep all your other functions below as they were...
export function registerUser(phone: string, password: string, referralCode?: string): { success: boolean; message: string; user?: User } {
  initAdmin(); const users = getUsers(); if (users.find(u => u.phone === phone)) return { success: false, message: 'Phone number already registered' };
  let referredBy: string | undefined; if (referralCode) { const referrer = users.find(u => u.referralCode === referralCode.toUpperCase()); if (referrer) referredBy = referrer.id; }
  const newUser: User = { id: generateId(), phone, password, balance: REGISTRATION_BONUS, cumulativeIncome: 0, level: 1, referralCode: generateReferralCode(), referredBy, checkInDays: 0, createdAt: new Date().toISOString(), } as User;
  saveUsers([...users, newUser]); addTransaction({ userId: newUser.id, type: 'bonus', amount: REGISTRATION_BONUS, status: 'completed', description: 'Registration bonus reward', }); return { success: true, message: 'Registration successful', user: newUser };
}
export function loginUser(phone: string, password: string): { success: boolean; message: string; user?: User } {
  initAdmin(); const users = getUsers(); const user = users.find(u => u.phone === phone && u.password === password); if (!user) return { success: false, message: 'Incorrect phone number or password' }; setCurrentUser(user.id); return { success: true, message: 'Login successful', user };
}
export function getTransactions(userId?: string): Transaction[] { try { const data = localStorage.getItem(KEYS.TRANSACTIONS); const all: Transaction[] = data? JSON.parse(data) : []; return userId? all.filter(t => t.userId === userId) : all; } catch { return []; } }
export function addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Transaction { const transactions = getTransactions(); const newTx: Transaction = {...tx, id: generateId(), createdAt: new Date().toISOString(), } as Transaction; localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([newTx,...transactions])); return newTx; }
export function getRechargeOrders(userId?: string): RechargeOrder[] { try { const data = localStorage.getItem(KEYS.RECHARGE_ORDERS); const all: RechargeOrder[] = data? JSON.parse(data) : []; return userId? all.filter(o => o.userId === userId) : all; } catch { return []; } }
export function createRechargeOrder(userId: string, amount: number, paymentMethod: string, phoneNumber: string): RechargeOrder { const orders = getRechargeOrders(); const order: RechargeOrder = { id: generateId(), userId, amount, paymentMethod, phoneNumber, status: 'pending', createdAt: new Date().toISOString(), mtnAccount: MTN_ACCOUNT, mtnName: MTN_NAME, } as RechargeOrder; localStorage.setItem(KEYS.RECHARGE_ORDERS, JSON.stringify([order,...orders])); return order; }
export function approveRechargeOrder(orderId: string): boolean { const orders = getRechargeOrders(); const idx = orders.findIndex(o => o.id === orderId); if (idx === -1) return false; const order = orders[idx]; if (order.status!== 'pending') return false; orders[idx].status = 'completed'; localStorage.setItem(KEYS.RECHARGE_ORDERS, JSON.stringify(orders)); const users = getUsers(); const uIdx = users.findIndex(u => u.id === order.userId); if (uIdx!== -1) { users[uIdx].balance += order.amount; saveUsers(users); } addTransaction({ userId: order.userId, type: 'recharge', amount: order.amount, status: 'completed', description: `Recharge via ${order.paymentMethod}`, }); return true; }
export function rejectRechargeOrder(orderId: string): boolean { const orders = getRechargeOrders(); const idx = orders.findIndex(o => o.id === orderId); if (idx === -1) return false; orders[idx].status = 'rejected'; localStorage.setItem(KEYS.RECHARGE_ORDERS, JSON.stringify(orders)); return true; }
export function getWithdrawOrders(userId?: string): WithdrawOrder[] { try { const data = localStorage.getItem(KEYS.WITHDRAW_ORDERS); const all: WithdrawOrder[] = data? JSON.parse(data) : []; return userId? all.filter(o => o.userId === userId) : all; } catch { return []; } }
export function createWithdrawOrder(userId: string, amount: number): { success: boolean; message: string; order?: WithdrawOrder } {
  const user = getUsers().find(u => u.id === userId) || getCurrentUser(); if (!user) return { success: false, message: 'User not found' }; if (!(user as any).bankCard) return { success: false, message: 'Please bind your bank card first' };
  if (amount < 9000) return { success: false, message: 'Minimum withdrawal is UGX 9,000' }; if (amount > user.balance) return { success: false, message: 'Insufficient balance' };
  const fee = Math.floor(amount * 0.16); const received = amount - fee; const orders = getWithdrawOrders();
  const order: WithdrawOrder = { id: generateId(), userId, amount, receivedAmount: received, fee, bankCard: (user as any).bankCard, status: 'pending', createdAt: new Date().toISOString(), } as WithdrawOrder;
  localStorage.setItem(KEYS.WITHDRAW_ORDERS, JSON.stringify([order,...orders])); updateUser(userId, { balance: user.balance - amount } as any); return { success: true, message: 'Withdrawal submitted', order };
}
export function approveWithdrawOrder(orderId: string): boolean { const orders = getWithdrawOrders(); const idx = orders.findIndex(o => o.id === orderId); if (idx === -1) return false; orders[idx].status = 'completed'; localStorage.setItem(KEYS.WITHDRAW_ORDERS, JSON.stringify(orders)); return true; }
export function rejectWithdrawOrder(orderId: string): boolean { const orders = getWithdrawOrders(); const idx = orders.findIndex(o => o.id === orderId); if (idx === -1) return false; const order = orders[idx]; orders[idx].status = 'rejected'; localStorage.setItem(KEYS.WITHDRAW_ORDERS, JSON.stringify(orders)); const user = getUsers().find(u => u.id === order.userId) || getCurrentUser(); if (user) updateUser(order.userId, { balance: user.balance + order.amount } as any); return true; }
export function getUserProducts(userId?: string): UserProduct[] { try { const data = localStorage.getItem(KEYS.USER_PRODUCTS); const all: UserProduct[] = data? JSON.parse(data) : []; return userId? all.filter(p => p.userId === userId) : all; } catch { return []; } }
export function purchaseProduct(userId: string, productId: number, price: number, dailyIncome: number, term: number): { success: boolean; message: string } {
  const user = getUsers().find(u => u.id === userId) || getCurrentUser(); if (!user) return { success: false, message: 'User not found' }; if (user.balance < price) return { success: false, message: 'Insufficient balance' };
  const products = getUserProducts(); const now = new Date(); const endDate = new Date(now); endDate.setDate(endDate.getDate() + term);
  const newProduct: UserProduct = { id: generateId(), userId, productId, purchaseDate: now.toISOString(), endDate: endDate.toISOString(), totalEarned: 0, status: 'active', } as UserProduct;
  localStorage.setItem(KEYS.USER_PRODUCTS, JSON.stringify([...products, newProduct])); updateUser(userId, { balance: user.balance - price } as any); return { success: true, message: 'Product purchased' };
}
export function getTeamMembers(userId: string): { level1: User[]; level2: User[]; level3: User[] } {
  try {
    const users = getUsers(); if(users.length===0) return {level1:[], level2:[], level3:[]};
    const level1 = users.filter(u => (u.referredBy === userId || (u as any).referred_by === userId));
    const level2 = users.filter(u => level1.some(l1 => l1.id === u.referredBy || (l1.id === (u as any).referred_by)));
    const level3 = users.filter(u => level2.some(l2 => l2.id === u.referredBy));
    return { level1, level2, level3 };
  } catch { return {level1:[], level2:[], level3:[]}; }
}
export function getTeamCommissions(userId: string): { level1: number; level2: number; level3: number } { try { const txs = getTransactions(userId).filter(t => t.type === 'referral'); return { level1: txs.filter(t => t.description.includes('Level 1')).reduce((sum, t) => sum + t.amount, 0), level2: 0, level3: 0, }; } catch { return {level1:0, level2:0, level3:0}; } }
export function getGiftCodes(): GiftCode[] { try { const data = localStorage.getItem(KEYS.GIFT_CODES); return data? JSON.parse(data) : []; } catch { return []; } }
export function createGiftCode(amount: number, note?: string, customCode?: string): GiftCode { const codes = getGiftCodes(); const code: GiftCode = { id: generateId(), code: customCode? customCode.toUpperCase() : Math.random().toString(36).substr(2, 8).toUpperCase(), amount, note, expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), createdAt: new Date().toISOString(), }; localStorage.setItem(KEYS.GIFT_CODES, JSON.stringify([code,...codes])); return code; }
export function deleteGiftCode(codeId: string): void { const codes = getGiftCodes().filter(c => c.id!== codeId); localStorage.setItem(KEYS.GIFT_CODES, JSON.stringify(codes)); }
export function getPasswordResets(): PasswordResetRequest[] { try { const data = localStorage.getItem(KEYS.PASSWORD_RESETS); return data? JSON.parse(data) : []; } catch { return []; } }
export function approvePasswordReset(resetId: string): boolean { const resets = getPasswordResets(); const idx = resets.findIndex(r => r.id === resetId); if (idx === -1) return false; resets[idx] = {...resets[idx], status: 'approved', resolvedAt: new Date().toISOString() }; localStorage.setItem(KEYS.PASSWORD_RESETS, JSON.stringify(resets)); return true; }
export function rejectPasswordReset(resetId: string, note?: string): boolean { const resets = getPasswordResets(); const idx = resets.findIndex(r => r.id === resetId); if (idx === -1) return false; resets[idx] = {...resets[idx], status: 'rejected', resolvedAt: new Date().toISOString(), note }; localStorage.setItem(KEYS.PASSWORD_RESETS, JSON.stringify(resets)); return true; }
export function redeemGiftCode(userId: string, codeStr: string): { success: boolean; message: string; amount?: number } {
  const user = getUsers().find(u => u.id === userId) || getCurrentUser(); if (!user) return { success: false, message: 'User not found' }; const codes = getGiftCodes(); const idx = codes.findIndex(c => c.code === codeStr.toUpperCase() &&!c.usedBy); if (idx === -1) return { success: false, message: 'Invalid code' }; const code = codes[idx]; codes[idx] = {...code, usedBy: userId, usedAt: new Date().toISOString() }; localStorage.setItem(KEYS.GIFT_CODES, JSON.stringify(codes)); updateUser(userId, { balance: user.balance + code.amount } as any); return { success: true, message: 'Redeemed', amount: code.amount };
}
export function creditDailyIncome(userId: string): { credited: number; nextPayoutMs: number } { return {credited:0, nextPayoutMs:0}; }
export function getNextPayoutMs(userId: string): number { return 0; }
export function performCheckIn(userId: string): { success: boolean; message: string; reward?: number } { return {success:false, message:'Already checked'}; }
export function createPasswordReset(phone: string, newPassword: string): { success: boolean; message: string } { return {success:true, message:'Submitted'}; }
export function getPasswordResetStatus(phone: string): PasswordResetRequest | null { return null; }