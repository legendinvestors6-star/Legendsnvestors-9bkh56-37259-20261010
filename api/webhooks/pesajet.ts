import { createClient } from '@supabase/supabase-js'

export default async function handler(req: any, res: any) {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
  const { reference, status } = req.body || {};
  if (reference) {
    await supabase.from('recharges').update({ status }).eq('reference', reference);
  }
  res.json({ ok: true });
}
