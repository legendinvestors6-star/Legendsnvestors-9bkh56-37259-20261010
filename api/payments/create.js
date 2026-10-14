export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.status(200).json({ ok: true, hasKey: !!process.env.PESAJET_API_KEY, keyPrefix: (process.env.PESAJET_API_KEY || '').slice(0,10) });

  try {
    let body = req.body;
    if (!body || Object.keys(body).length === 0) {
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString();
      try { body = JSON.parse(raw); } catch { body = {}; }
    }
    if (typeof body === 'string') try { body = JSON.parse(body); } catch {}

    const amount = body?.amount;
    let phone = (body?.phone || body?.phoneNumber || '').toString().trim();
    
    // Normalize phone
    if (phone.startsWith('0')) phone = '+256' + phone.slice(1);
    if (!phone.startsWith('+')) phone = '+256' + phone.replace('+','');

    // AUTO-DETECT PROVIDER - FIXED
    let provider = body?.provider;
    const clean = phone.replace('+256','');
    if (clean.startsWith('70') || clean.startsWith('75') || clean.startsWith('74')) {
      provider = 'airtel';
    } else {
      provider = 'mtn';
    }

    const apiKey = (process.env.PESAJET_API_KEY || '').trim(); // TRIM space!
    const reference = 'LEGEND-'+Date.now();

    if (!apiKey) {
      return res.status(200).json({ success: false, error: 'PESAJET_API_KEY missing in Vercel', reference });
    }

    // Save pending for automatic flow
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
      await supabase.from('recharges').insert({ reference, phone, amount: Number(amount), provider, status: 'pending', created_at: new Date().toISOString() });
    } catch (e) { console.log('DB save non-critical:', e.message); }

    console.log('Sending to PesaJet:', { amount, phone, provider, reference, hasKey: !!apiKey });

    const r = await fetch('https://payments.pesajet.com/api/v1/payments', {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(amount), phoneNumber: phone, provider, reference, currency: 'UGX' })
    });

    const text = await r.text();
    let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }

    console.log('PesaJet reply:', r.status, text);

    // ALWAYS return 200 so frontend can read the real message
    return res.status(200).json({ 
      pesajet_status: r.status,
      pesajet_data: data,
      reference,
      success: r.ok,
      phone_sent: phone,
      provider_sent: provider,
      message: r.ok ? 'STK sent' : (data.message || data.error || text.slice(0,300))
    });

  } catch (e) {
    return res.status(200).json({ success: false, error: e.message, reference: 'error-'+Date.now() });
  }
}
