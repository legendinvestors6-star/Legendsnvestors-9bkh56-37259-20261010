// src/lib/storage.ts - FIXED AUTOMATIC VERSION
const USERS_KEY = 'legend_users';
const CURRENT_USER_KEY = 'legend_current_user';
const RECHARGE_KEY = 'legend_recharges';
const WITHDRAW_KEY = 'legend_withdraws';
const GIFT_KEY = 'legend_gifts';
const RESET_KEY = 'legend_resets';
const TRANS_KEY = 'legend_trans';

export const formatUGX = (n:number) => `UGX ${Math.round(n).toLocaleString()}`;

const get = (k:string) => { try { return JSON.parse(localStorage.getItem(k)||'[]'); } catch { return [] } };
const set = (k:string,v:any) => localStorage.setItem(k,JSON.stringify(v));

export const getUsers = () => get(USERS_KEY);
export const getCurrentUser = () => { try { return JSON.parse(localStorage.getItem(CURRENT_USER_KEY)||'null'); } catch { return null } };
export const setCurrentUser = (u:any) => localStorage.setItem(CURRENT_USER_KEY,JSON.stringify(u));
export const getRechargeOrders = () => get(RECHARGE_KEY);
export const getWithdrawOrders = () => get(WITHDRAW_KEY);
export const getGiftCodes = () => get(GIFT_KEY);
export const getPasswordResets = () => get(RESET_KEY);
export const getTransactions = () => get(TRANS_KEY);

export const createRechargeOrder = (o:any) => {
  const orders = getRechargeOrders();
  const id = Date.now().toString();
  // AUTOMATIC COMPLETE
  const newOrder = { ...o, id, status:'completed', createdAt:new Date().toISOString() };
  orders.unshift(newOrder);
  set(RECHARGE_KEY, orders);
  
  // ADD BALANCE AUTOMATICALLY
  const users = getUsers();
  const idx = users.findIndex((u:any)=>u.id===o.userId);
  if(idx>=0){
    users[idx].balance = (Number(users[idx].balance)||0)+Number(o.amount);
    set(USERS_KEY, users);
    const cur = getCurrentUser();
    if(cur && cur.id===o.userId){ cur.balance = users[idx].balance; setCurrentUser(cur); }
  }
  // add trans
  const trans = getTransactions();
  trans.unshift({id, userId:o.userId, type:'recharge', amount:o.amount, status:'completed', createdAt:new Date().toISOString()});
  set(TRANS_KEY, trans);
  return newOrder;
};

export const createGiftCode = (amount:number, desc:string, custom?:string) => {
  const gifts = getGiftCodes();
  const code = custom || 'GIFT'+Math.random().toString(36).substring(2,8).toUpperCase();
  const g = { id:Date.now().toString(), code, amount, description:desc, used:false, usedBy:null, createdAt:new Date().toISOString() };
  gifts.unshift(g); set(GIFT_KEY,gifts); return g;
};
export const deleteGiftCode = (id:string)=>{ set(GIFT_KEY, getGiftCodes().filter((g:any)=>g.id!==id)); };
export const approveWithdrawOrder = (id:string)=>{ const wd=getWithdrawOrders(); const i=wd.findIndex((x:any)=>x.id===id); if(i>=0){wd[i].status='approved'; set(WITHDRAW_KEY,wd);} };
export const rejectWithdrawOrder = (id:string)=>{ const wd=getWithdrawOrders(); const i=wd.findIndex((x:any)=>x.id===id); if(i>=0){ const o=wd[i]; wd[i].status='rejected'; set(WITHDRAW_KEY,wd); const users=getUsers(); const ui=users.findIndex((u:any)=>u.id===o.userId); if(ui>=0){users[ui].balance+=o.amount; set(USERS_KEY,users);} } };
export const createWithdrawOrder = (o:any)=>{ const wd=getWithdrawOrders(); const no={...o, id:Date.now().toString(), status:'pending', createdAt:new Date().toISOString()}; wd.unshift(no); set(WITHDRAW_KEY,wd); return no; };