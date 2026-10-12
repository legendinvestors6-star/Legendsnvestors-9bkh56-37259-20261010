export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    const body = req.body || {};
    const amount = body.amount;
    const phoneNumber = body.phoneNumber;
    
    if (!amount || !phoneNumber) {
      return res.status(400).json({ error: 'Missing amount or phone' });
    }

    let formattedPhone = phoneNumber.toString().trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+256' + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+256' + formattedPhone;
    }

    let provider = 'mtn';
    const raw = phoneNumber.toString();
    if (raw.startsWith('075') || raw.startsWith('070') || raw.startsWith('75') || raw.startsWith('70')) {
      provider = 'airtel';
    }

    const apiKey = process.env.PESAJET_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'PESAJET_API_KEY not set in Vercel' });
    }

    const response = await fetch('https://payments.pesajet.com/api/v1/payments', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Number(amount),
        phoneNumber: formattedPhone,
        provider: provider,
        reference: 'LEGEND-' + Date.now(),
        currency: 'UGX'
      })
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || data.error || 'Payment failed', details: data });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server crash: ' + err.message });
  }
}
