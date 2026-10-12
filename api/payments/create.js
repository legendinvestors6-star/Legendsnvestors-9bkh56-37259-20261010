export default async function handler(req, res) {
  if (req.method!== 'POST') return res.status(405).json({error: 'Method not allowed'});

  const { amount, phoneNumber, provider } = req.body;

  // Clean phone: 075xxxxxxx -> +25675xxxxxxx
  let formattedPhone = phoneNumber;
  if (phoneNumber.startsWith('0')) {
    formattedPhone = '+256' + phoneNumber.slice(1);
  } else if (!phoneNumber.startsWith('+')) {
    formattedPhone = '+256' + phoneNumber;
  }

  // Provider: mtn or airtel
  const pesajetProvider = provider === 'airtel'? 'airtel' : 'mtn';

  try {
    const response = await fetch('https://payments.pesajet.com/api/v1/payments', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.PESAJET_API_KEY, // <-- this must be pk_... NOT sk_...
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: parseInt(amount),
        phoneNumber: formattedPhone,
        provider: pesajetProvider,
        reference: 'LEGEND-' + Date.now(),
        currency: 'UGX'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({error: data.message || data.error || 'Payment failed', raw: data});
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({error: err.message});
  }
}
