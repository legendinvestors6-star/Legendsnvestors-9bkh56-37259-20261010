import { createClient } from '@supabase/supabase-js'

export const config = { runtime: 'nodejs' };

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  try {
    let body = req.body;
    if (!body || Object.keys(body).length === 0) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString();
      try { body = JSON.parse(raw); } catch { body = {}; }
    }

    console.log('Webhook body:', body);

    const reference = body?.reference || body?.Reference || body?.transaction_reference;
    const status = body?.status || body?.Status || body?.transaction_status || body?.TransactionStatus;

    if (!reference) {
      return res.status(200).json({ ok: true, msg: 'no reference' });
    }

    // Only auto-approve when SUCCESS
    if (status === 'SUCCESSFUL' || status === 'SUCCESS' || status === 'completed' || status === 'success' || status === 'Successful') {
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase
        .from('recharges')
        .update({ status: 'completed' })
        .eq('reference', reference);

      if (error) console.log('Supabase update error:', error);
      else console.log('✅ Auto-approved:', reference);
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return res.status(200).json({ ok: true }); // Always 200 for PesaJet
  }
}
