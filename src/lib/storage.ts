export function formatUGX(n:any){ try{ return `UGX ${(Number(n)||0).toLocaleString()}` }catch{ return `UGX ${n}` } }

function normalizeUser(raw:any){
  if(!raw) return null;
  try{
    const u = typeof raw === 'string'? JSON.parse(raw) : raw;
    if(!u ||!u.id) return null;
    return {
      id: u.id,
      phone: u.phone || u.phoneNumber || '',
      balance: Number(u.balance || 0),
      referralCode: u.referralCode || u.referral_code || '',
      referral_code: u.referral_code || u.referralCode || '',
      referredBy: u.referredBy || u.referred_by || '',
      referred_by: u.referred_by || u.referredBy || '',
      is_admin:!!(u.is_admin || u.isadmin || u.isAdmin),
      isAdmin:!!(u.is_admin || u.isadmin || u.isAdmin),
      createdAt: u.createdAt || u.created_at,
      created_at: u.created_at || u.createdAt,
     ...u
    };
  }catch{ return null; }
}

export function getCurrentUser(){
  try{
    // 1. Try new supabase user
    const raw = localStorage.getItem('legend_user');
    if(raw){
      const norm = normalizeUser(raw);
      if(norm) return norm;
    }
    // 2. Try old current_user id system
    const id = localStorage.getItem('legend_current_user');
    if(id){
      const usersRaw = localStorage.getItem('legend_users');
      if(usersRaw){
        const users = JSON.parse(usersRaw);
        const found = users.find((x:any)=>x.id===id);
        const norm = normalizeUser(found);
        if(norm) return norm;
      }
    }
    return null;
  }catch(e){
    console.error('getCurrentUser error', e);
    return null;
  }
}

// Safe wrappers - NEVER throw
export function getUsers(){ try{ return JSON.parse(localStorage.getItem('legend_users')||'[]') }catch{ return [] } }
export function getRechargeOrders(){ try{ return JSON.parse(localStorage.getItem('legend_recharges')||'[]') }catch{ return [] } }
export function getWithdrawOrders(){ try{ return JSON.parse(localStorage.getItem('legend_withdraws')||'[]') }catch{ return [] } }
export function getUserProducts(){ try{ return JSON.parse(localStorage.getItem('legend_user_products')||'[]') }catch{ return [] } }
export function getTransactions(){ try{ return JSON.parse(localStorage.getItem('legend_transactions')||'[]') }catch{ return [] } }
export function getGiftCodes(){ try{ return JSON.parse(localStorage.getItem('legend_gifts')||'[]') }catch{ return [] } }
export function getPasswordResets(){ try{ return JSON.parse(localStorage.getItem('legend_resets')||'[]') }catch{ return [] } }

// No-op approvals to prevent crash
export function approveRechargeOrder(id:string){ try{ const o=getRechargeOrders(); const i=o.findIndex((x:any)=>x.id===id); if(i>=0){ o[i].status='approved'; localStorage.setItem('legend_recharges', JSON.stringify(o)); } }catch{} }
export function rejectRechargeOrder(id:string){ try{ const o=getRechargeOrders(); const i=o.findIndex((x:any)=>x.id===id); if(i>=0){ o[i].status='rejected'; localStorage.setItem('legend_recharges', JSON.stringify(o)); } }catch{} }
export function approveWithdrawOrder(id:string){ try{ const o=getWithdrawOrders(); const i=o.findIndex((x:any)=>x.id===id); if(i>=0){ o[i].status='approved'; localStorage.setItem('legend_withdraws', JSON.stringify(o)); } }catch{} }
export function rejectWithdrawOrder(id:string){ try{ const o=getWithdrawOrders(); const i=o.findIndex((x:any)=>x.id===id); if(i>=0){ o[i].status='rejected'; localStorage.setItem('legend_withdraws', JSON.stringify(o)); } }catch{} }
export function updateUser(){}
export function addTransaction(){}
export function createGiftCode(){}
export function deleteGiftCode(){}
export function approvePasswordReset(){}
export function rejectPasswordReset(){}
