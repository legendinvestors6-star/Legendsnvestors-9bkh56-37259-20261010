export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.status(200).json({ ok: true, hasKey: !!process.env.PESAJET_API_KEY });

  try {
    // FIX: Vercel already parses body in some runtimes, use it if exists
    let body = req.body;
    
    // If body is not parsed, parse manually
    if (!body || Object.keys(body).length === 0) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString();
      try { body = JSON.parse(raw); } catch { body = {}; }
    }
    
    // If still string, parse again
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    console.log('Received body:', JSON.stringify(body));

    const amount = body?.amount;
    const phoneNumber = body?.phoneNumber;

    if (!amount || !phoneNumber) {
      console.log('Missing fields, body was:', body);
      return res.status(400).json({ error: 'Missing amount/phone', receivedBody: body });
    }

    let phone = phoneNumber.toString().trim();
    if (phone.startsWith('0')) phone = '+256' + phone.slice(1);
    if (!phone.startsWith('+')) phone = '+256' + phone;

    let provider = phone.includes('75') || phone.includes('70') ? 'airtel' : 'mtn';
    const apiKey = process.env.PESAJET_API_KEY;

    console.log('Calling PesaJet with:', { amount, phone, provider, hasKey: !!apiKey });

    const r = await fetch('https://payments.pesajet.com/api/v1/payments', {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(amount), phoneNumber: phone, provider, reference: 'LEGEND-'+Date.now(), currency: 'UGX' })
    });

    const text = await r.text();
    console.log('PesaJet response:', r.status, text);

    let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return res.status(r.status).json({ pesajet_status: r.status, pesajet_data: data, phone_sent: phone });

  } catch (e) {
    console.error('Crash:', e);
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
}
