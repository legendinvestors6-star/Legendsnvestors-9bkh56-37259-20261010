export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { amount, phone, userId, provider } = req.body;
    
    if (!amount || !phone) return res.status(400).json({ message: 'Amount and phone required' });

    const reference = `${userId || phone}-${Date.now()}`;
    const amountInCents = Math.round(Number(amount) * 100);

    const pesaRes = await fetch("https://payments.pesajet.com/api/v1/payments", {
      method: "POST",
      headers: {
        "X-API-Key": process.env.PESAJET_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInCents,
        phoneNumber: phone,
        provider: provider || "mtn",
        reference,
      }),
    });

    const text = await pesaRes.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!pesaRes.ok) {
      return res.status(400).json({ message: data.message || text });
    }

    return res.status(200).json({ success: true, reference, data });

  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}
