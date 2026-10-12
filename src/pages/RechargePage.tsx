import { useState } from "react"

const MIN = 30000

export default function Recharge(){
 const [amount,setAmount]=useState("")
 const [phone,setPhone]=useState("")
 const [loading,setLoading]=useState(false)
 const quick = [30000, 50000, 100000, 200000]

 const handleRecharge = async () => {
  const num = Number(amount)
  if(num < MIN){ alert(`Minimum UGX ${MIN.toLocaleString()}`); return }
  if(phone.length < 10){ alert("Enter phone number"); return }
  setLoading(true)
  try {
    const res = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: num, phone, userId: phone, provider: "mtn" })
    })
    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch { throw new Error(text.slice(0,200) || "Empty response from server") }
    if(!res.ok) throw new Error(data.message || "Payment failed")
    alert(`STK Push sent to ${phone}! Check phone for PIN.`)
    window.location.href = "/recharge-history"
  } catch (e: any) {
    alert("Error: " + e.message)
  } finally {
    setLoading(false)
  }
 }

 return(
  <div className="bg-[#0e0e0e] min-h-screen p-4 pb-28 text-white">
   <div className="max-w-md mx-auto">
    <div className="bg-[#1a1a1a] border border-[#d4af37]/50 rounded-[20px] p-5 text-center">
      <div className="w-12 h-12 mx-auto bg-[#2a2410] border border-[#d4af37] rounded-full flex items-center justify-center text-[#f8e7a0] mb-2">💳</div>
      <h1 className="font-bold text-[18px] text-[#f8e7a0]">Recharge Account</h1>
      <p className="text-[12px] text-gray-400">Enter details to continue</p>
    </div>
    <div className="bg-[#1a1a1a] border border-[#f8e7a0] rounded-[20px] p-5 mt-4">
      <label className="text-[13px] font-bold text-[#f8e7a0]">Recharge Amount</label>
      <div className="flex mt-2 bg-[#0e0e0e] rounded-xl border border-[#3a3210] px-3 items-center">
        <span className="font-bold text-[#f8e7a0] text-sm">UGX</span>
        <input value={amount} onChange={e=>setAmount(e.target.value)} type="number" placeholder="Enter amount" className="flex-1 bg-transparent p-3 text-[16px] font-bold text-white outline-none placeholder:text-gray-500" />
      </div>
      <p className="text-[11px] mt-2 text-[#f8e7a0]/80">Minimum: UGX 30,000 {Number(amount) < MIN && amount? "❌ Too low" : ""}</p>
      <div className="flex gap-2 mt-3">
        {quick.map(v=>(
          <button key={v} onClick={()=>setAmount(String(v))} className={`text-[12px] px-3 py-1.5 rounded-full border font-semibold ${amount==String(v)? "bg-[#f8e7a0] text-black border-[#f8e7a0]" : "bg-[#2a2410] border-[#d4af37]/30 text-[#f8e7a0]"}`}>{v/1000}k</button>
        ))}
      </div>
    </div>
    <div className="bg-[#1a1a1a] border border-[#f8e7a0] rounded-[20px] p-5 mt-4">
      <label className="text-[13px] font-bold text-[#f8e7a0]">Phone Number</label>
      <div className="flex mt-2 bg-[#0e0e0e] rounded-xl border border-[#3a3210] px-3 items-center">
        <span className="text-gray-400">📱</span>
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Enter phone number" type="tel" className="flex-1 bg-transparent p-3 text-[15px] text-white outline-none placeholder:text-gray-500" />
      </div>
      <button onClick={handleRecharge} disabled={loading || Number(amount) < MIN} className="w-full mt-5 bg-gradient-to-b from-[#f8e7a0] to-[#d4af37] disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 text-black py-4 rounded-xl font-extrabold text-[16px]">
        {loading? "Processing..." : "Proceed to Recharge"}
      </button>
    </div>
   </div>
  </div>
 )
}
