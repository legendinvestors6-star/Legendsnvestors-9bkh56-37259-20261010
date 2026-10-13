export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.status(200).json({ ok: true, hasKey: !!process.env.PESAJET_API_KEY });

  try {
    let body = req.body;
    if (!body || Object.keys(body).length === 0) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString();
      try { body = JSON.parse(raw); } catch { body = {}; }
    }
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    const amount = body?.amount || body?.Amount;
    const phoneNumber = body?.phoneNumber || body?.phone || body?.mobile || body?.msisdn || body?.PhoneNumber;

    if (!amount || !phoneNumber) {
      return res.status(400).json({ error: 'Missing amount/phone', receivedBody: body });
    } 

    let phone = phoneNumber.toString().trim();
    if (phone.startsWith('0')) phone = '+256' + phone.slice(1);
    if (!phone.startsWith('+')) phone = '+256' + phone;

    let provider = body?.provider || (phone.includes('75') || phone.includes('70') ? 'airtel' : 'mtn');
    const apiKey = process.env.PESAJET_API_KEY;
    const reference = body?.reference || 'LEGEND-'+Date.now();

    // === NEW: SAVE PENDING TO SUPABASE FOR AUTOMATIC FLOW ===
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
      );
      await supabase.from('recharges').insert({
        reference: reference,
        phone: phone,
        amount: Number(amount),
        provider: provider,
        status: 'pending',
        created_at: new Date().toISOString()
      });
      console.log('Saved pending:', reference);
    } catch (dbErr) {
      console.log('Supabase save failed (non-critical):', dbErr.message);
    }

    console.log('Calling PesaJet with:', { amount, phone, provider, reference });

    const r = await fetch('https://payments.pesajet.com/api/v1/payments', {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        amount: Number(amount), 
        phoneNumber: phone, 
        provider, 
        reference: reference, 
        currency: 'UGX' 
      })
    });

    const text = await r.text();
    console.log('PesaJet response:', r.status, text);

    let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }

    // Return reference for frontend polling
    return res.status(r.status).json({ 
      pesajet_status: r.status, 
      pesajet_data: data, 
      phone_sent: phone,
      reference: reference,  // <-- IMPORTANT FOR AUTOMATIC
      success: r.ok
    });

  } catch (e) {
    console.error('Crash:', e);
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
}
