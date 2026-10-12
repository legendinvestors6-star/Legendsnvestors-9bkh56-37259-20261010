export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, message: 'API is live', hasKey: !!process.env.PESAJET_API_KEY });
  }

  try {
    const { amount, phoneNumber } = req.body || {};
    if (!amount || !phoneNumber) return res.status(400).json({ error: 'Missing amount/phone' });

    let phone = phoneNumber.toString().trim();
    if (phone.startsWith('0')) phone = '+256' + phone.slice(1);
    if (!phone.startsWith('+')) phone = '+256' + phone;

    let provider = phone.includes('75') || phone.includes('70') ? 'airtel' : 'mtn';

    const r = await fetch('https://payments.pesajet.com/api/v1/payments', {
      method: 'POST',
      headers: { 'X-API-Key': process.env.PESAJET_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(amount), phoneNumber: phone, provider, reference: 'LEGEND-'+Date.now(), currency: 'UGX' })
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
      }
