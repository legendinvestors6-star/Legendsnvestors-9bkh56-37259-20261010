export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, phone, provider, userId } = req.body;
    if (!amount || !phone) {
      return res.status(400).json({ error: 'Missing amount or phone' });
    }

    let raw = phone.replace('+256', '').replace(/\s/g, '');
    let clean = raw.startsWith('0') ? raw.slice(1) : raw;
    let finalProvider = provider || 'mtn';
    if (clean.startsWith('75') || clean.startsWith('70') || clean.startsWith('74') || clean.startsWith('20')) {
      finalProvider = 'airtel';
    }
    const finalPhone = '+256' + clean;
    const reference = 'LEGEND-' + Date.now() + '-' + Math.random().toString(36).substring(2,6).toUpperCase();

    // ACCEPT ANY ENV NAME
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY_SECRET || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const PESAJET_KEY = process.env.PESAJET_API_KEY || process.env.VITE_PESAJET_API_KEY;

    console.log('ENV CHECK:', { hasUrl: !!SUPABASE_URL, hasKey: !!SUPABASE_KEY, hasPesa: !!PESAJET_KEY });

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ error: `Missing SUPABASE env - Found URL:${!!SUPABASE_URL} KEY:${!!SUPABASE_KEY} - Check Vercel Settings` });
    }
    if (!PESAJET_KEY) {
      return res.status(500).json({ error: 'Missing PESAJET_API_KEY' });
    }

    const pesajetRes = await fetch('https://payments.pesajet.com/api/v1/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': PESAJET_KEY },
      body: JSON.stringify({ amount: Number(amount), phoneNumber: finalPhone, provider: finalProvider, reference, currency: 'UGX' })
    });

    const pesajetText = await pesajetRes.text();
    let pesajetData;
    try { pesajetData = JSON.parse(pesajetText); } catch { pesajetData = { raw: pesajetText }; }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    await supabase.from('recharges').insert({
      reference, user_id: userId || finalPhone, phone: finalPhone,
      amount: Number(amount), provider: finalProvider,
      status: pesajetRes.ok ? 'pending' : 'failed',
      pesajet_response: pesajetData
    });

    if (!pesajetRes.ok) {
      return res.status(400).json({ error: 'PesaJet failed', pesajet_data: pesajetData, provider_sent: finalProvider, phone_sent: finalPhone });
    }

    return res.status(200).json({ success: true, reference, provider: finalProvider, phone: finalPhone });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}