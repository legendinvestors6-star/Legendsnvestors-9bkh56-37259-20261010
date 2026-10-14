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
    const reference = 'LEGEND-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    console.log(`PAYMENT: ${finalPhone} | ${finalProvider} | ${amount} | ${reference}`);

    if (!process.env.PESAJET_API_KEY) {
      return res.status(500).json({ error: 'Missing PESAJET_API_KEY in Vercel' });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      return res.status(500).json({ error: 'Missing SUPABASE env' });
    }

    const pesajetRes = await fetch('https://payments.pesajet.com/api/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.PESAJET_API_KEY
      },
      body: JSON.stringify({
        amount: Number(amount),
        phoneNumber: finalPhone,
        provider: finalProvider,
        reference: reference,
        currency: 'UGX'
      })
    });

    const pesajetText = await pesajetRes.text();
    let pesajetData;
    try { pesajetData = JSON.parse(pesajetText); } catch { pesajetData = { raw: pesajetText }; }

    console.log('PESAJET RESP:', pesajetRes.status, pesajetData);

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const { error: dbError } = await supabase.from('recharges').insert({
      reference: reference,
      user_id: userId || finalPhone,
      phone: finalPhone,
      amount: Number(amount),
      provider: finalProvider,
      status: pesajetRes.ok ? 'pending' : 'failed',
      pesajet_response: pesajetData
    });

    if (dbError) console.log('DB ERROR:', dbError);

    if (!pesajetRes.ok) {
      return res.status(400).json({
        error: 'PesaJet failed',
        pesajet_status: pesajetRes.status,
        pesajet_data: pesajetData,
        provider_sent: finalProvider,
        phone_sent: finalPhone
      });
    }

    return res.status(200).json({
      success: true,
      reference: reference,
      provider: finalProvider,
      phone: finalPhone,
      pesajet: pesajetData
    });

  } catch (e) {
    console.error('CREATE ERROR:', e);
    return res.status(500).json({ error: e.message });
  }
      }
