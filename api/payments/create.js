export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.status(200).json({ ok: true, hasKey: !!process.env.PESAJET_API_KEY });

  try {
    let body = req.body;
    if (!body || typeof body === 'object' && Object.keys(body).length === 0) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString();
      try { body = JSON.parse(raw); } catch { body = {}; }
    }
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    const amount = body?.amount;
    let phone = (body?.phone || body?.phoneNumber || '').toString().trim();
    if (phone.startsWith('0')) phone = '+256' + phone.slice(1);
    if (!phone.startsWith('+')) phone = '+' + phone.replace(/\+/g,'');

    // --- FORCED PROVIDER FIX ---
    let clean = phone.replace('+256','').replace('+','');
    if (clean.startsWith('0')) clean = clean.slice(1);
    let provider = 'mtn';
    if (clean.startsWith('70') || clean.startsWith('75') || clean.startsWith('74')) {
      provider = 'airtel';
    }

    const apiKey = (process.env.PESAJET_API_KEY || '').trim();
    const reference = 'LEGEND-' + Date.now();

    if (!apiKey) {
      return res.status(200).json({ success: false, message: 'Missing PESAJET_API_KEY in Vercel', reference });
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
      await supabase.from('recharges').insert({ reference, phone, amount: Number(amount), provider, status: 'pending' });
    } catch (e) {}

    const r = await fetch('https://payments.pesajet.com/api/v1/payments', {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(amount), phoneNumber: phone, provider, reference, currency: 'UGX' })
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return res.status(200).json({ pesajet_status: r.status, pesajet_data: data, reference, success: r.ok, provider_sent: provider, phone_sent: phone, message: data.message || data.error || text });

  } catch (e) {
    return res.status(200).json({ success: false, error: e.message });
  }
}