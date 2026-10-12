export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method === 'GET') {
    return res.status(200).json({ 
      ok: true, 
      message: 'Vite API is live',
      hasKey: !!process.env.PESAJET_API_KEY,
      keyPrefix: process.env.PESAJET_API_KEY ? process.env.PESAJET_API_KEY.substring(0, 5) : 'none'
    });
  }

  try {
    // Vite needs manual body reading
    let rawBody = '';
    for await (const chunk of req) {
      rawBody += chunk;
    }
    
    let body = {};
    try { body = JSON.parse(rawBody || '{}'); } catch {}
    
    const amount = body.amount;
    const phoneNumber = body.phoneNumber;

    if (!amount || !phoneNumber) {
      return res.status(400).json({ error: 'Missing amount or phoneNumber', received: body });
    }

    let phone = phoneNumber.toString().trim();
    if (phone.startsWith('0')) phone = '+256' + phone.slice(1);
    if (!phone.startsWith('+')) phone = '+256' + phone;

    let provider = 'mtn';
    if (phoneNumber.toString().startsWith('075') || phoneNumber.toString().startsWith('070') || phone.startsWith('+25675') || phone.startsWith('+25670')) {
      provider = 'airtel';
    }

    const apiKey = process.env.PESAJET_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'PESAJET_API_KEY not set in Vercel' });

    const response = await fetch('https://payments.pesajet.com/api/v1/payments', {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(amount),
        phoneNumber: phone,
        provider: provider,
        reference: 'LEGEND-' + Date.now(),
        currency: 'UGX'
      })
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return res.status(response.status).json(data);

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error: ' + e.message });
  }
}
