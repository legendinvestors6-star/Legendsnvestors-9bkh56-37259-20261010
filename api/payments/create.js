export default async function handler(req,res){
 if(req.method !== "POST") return res.status(405).json({message:"Method not allowed"})
 try{
  const { amount, phone } = req.body
  let clean = phone.replace(/\D/g,"")
  if(clean.startsWith("0")) clean = "256" + clean.slice(1)
  if(!clean.startsWith("256")) clean = "256" + clean
  
  // auto detect provider by prefix
  let provider = "mtn"
  const prefix = clean.slice(3,5) // get 77,75 etc
  if(["70","75"].includes(prefix)) provider = "airtel"
  
  const r = await fetch("https://payments.pesajet.com/api/v1/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.PESAJET_API_KEY
    },
    body: JSON.stringify({
      amount: Number(amount),
      phoneNumber: "+" + clean,
      provider,
      reference: "RECH-" + Date.now()
    })
  })
  const data = await r.json()
  if(!r.ok) return res.status(400).json({message: data.message || JSON.stringify(data)})
  return res.status(200).json(data)
 }catch(e){
  return res.status(500).json({message:e.message})
 }
}
