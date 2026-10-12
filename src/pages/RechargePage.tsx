import { useState } from "react"

const MIN = 30000

export default function Recharge(){
 const [amount,setAmount]=useState("")
 const [phone,setPhone]=useState("")
 const [loading,setLoading]=useState(false)

 const quick = [30000, 50000, 100000, 200000]

 // <-- PUT IT HERE, RIGHT HERE -->
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
 // <-- END HERE -->

 return(
  <div>... your JSX ...</div>
 )
}
