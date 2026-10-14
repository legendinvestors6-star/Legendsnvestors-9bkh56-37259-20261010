export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { amount, phone } = req.body;
    let clean = phone.replace('+256','').replace(/\s/g,'');
    clean = clean.startsWith('0') ? clean.slice(1) : clean;
    let provider = 'mtn';
    if (clean.startsWith('75') || clean.startsWith('70') || clean.startsWith('74') || clean.startsWith('20')) provider = 'airtel';
    const finalPhone = '+256'+clean;
    const ref = 'LEGEND-'+Date.now();

    const P_KEY = process.env.PESAJET_API_KEY;
    if (!P_KEY) return res.status(500).json({ error: 'Missing PESAJET_API_KEY' });

    // 1. CALL PESAJET FIRST - DON'T WAIT FOR SUPABASE
    const pesaRes = await fetch('https://payments.pesajet.com/api/v1/payments', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'X-API-Key': P_KEY },
      body: JSON.stringify({ amount:Number(amount), phoneNumber:finalPhone, provider, reference:ref, currency:'UGX' })
    });
    const pesaText = await pesaRes.text();
    let pesaData; try{ pesaData=JSON.parse(pesaText)}catch{ pesaData={raw:pesaText} }

    if (!pesaRes.ok) {
      return res.status(400).json({ error:'PesaJet says: '+(pesaData.message||pesaText), pesaData });
    }

    // 2. TRY SAVE TO SUPABASE, BUT IGNORE IF KEY INVALID
    try{
      const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
      if(URL && KEY){
        const {createClient}=await import('@supabase/supabase-js');
        const supa=createClient(URL, KEY);
        await supa.from('recharges').insert({ reference:ref, phone:finalPhone, amount:Number(amount), provider, status:'pending', pesajet_response:pesaData });
      }
    }catch(e){ console.log('DB ignored:', e.message) }

    return res.status(200).json({ success:true, reference:ref });

  } catch(e){ return res.status(500).json({ error:e.message }) }
}