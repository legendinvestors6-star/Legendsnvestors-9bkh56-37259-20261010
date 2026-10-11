import { useState } from "react"

export default function Recharge(){
 const [amount,setAmount]=useState("")
 const [phone,setPhone]=useState("")

 const pay = () => {
  if(Number(amount) < 30000){ alert("Minimum UGX 30,000"); return }
  if(phone.length < 10){ alert("Enter phone number"); return }

  const order = {
    id: Date.now(),
    amount: Number(amount),
    phone: phone,
    status: "pending",
    created_at: new Date().toISOString()
  }

  const all = JSON.parse(localStorage.getItem("recharge_orders") || "[]")
  all.unshift(order)
  localStorage.setItem("recharge_orders", JSON.stringify(all))

  window.location.href = "/recharge-status"
 }

 return(
  <div className="bg-black min-h-screen p-4 text-white">
   <div className="max-w-md mx-auto bg-[#1a1a1a] border border-[#d4af37] rounded-[20px] p-5">
    <h1 className="text-center font-bold text-[#f8e7a0]">Recharge Account</h1>
    <p className="text-center text-xs text-gray-400 mb-4">Min UGX 30,000</p>

    <label className="text-sm text-[#f8e7a0]">Amount</label>
    <div className="flex bg-black border border-[#d4af37]/40 rounded-xl px-3 mt-1">
     <span className="py-3 text-[#f8e7a0] font-bold text-sm">UGX</span>
     <input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Enter amount" type="number" className="flex-1 bg-transparent p-3 outline-none text-white" />
    </div>

    <label className="text-sm text-[#f8e7a0] mt-4 block">Phone</label>
    <div className="flex bg-black border border-[#d4af37]/40 rounded-xl px-3 mt-1">
     <span className="py-3">📱</span>
     <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Enter phone number" type="tel" className="flex-1 bg-transparent p-3 outline-none text-white placeholder:text-gray-500" />
    </div>

    <button onClick={pay} className="w-full mt-5 bg-gradient-to-b from-[#f8e7a0] to-[#d4af37] text-black py-3 rounded-xl font-bold">Proceed to Recharge</button>
   </div>
  </div>
 )
   }
