const { MercadoPagoConfig, Payment } = require('mercadopago');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email, userId } = req.body;

    if (!email || !userId) {
        return res.status(400).json({ error: 'Missing email or userId' });
    }

    try {
        const client = new MercadoPagoConfig({ 
            accessToken: 'APP_USR-6868985718529176-091416-d62094d20cd66eb239b77b3938f3b383-3690859454' 
        });
        
        const payment = new Payment(client);
        
        const idempotencyKey = `PAY-${userId}-${Date.now()}`;
        
        const response = await payment.create({
            body: {
                transaction_amount: 147.90, // Valor da mensalidade
                description: 'Mensalidade AutomatiZAP CRM',
                payment_method_id: 'pix',
                payer: {
                    email: email
                },
                external_reference: userId // Vincula ao usuário para o webhook
            },
            requestOptions: { idempotencyKey }
        });

        const qrCode = response.point_of_interaction.transaction_data.qr_code;
        const qrCodeBase64 = response.point_of_interaction.transaction_data.qr_code_base64;

        return res.status(200).json({
            qr_code: qrCode,
            qr_code_base64: qrCodeBase64
        });
    } catch (error) {
        console.error('Erro Mercado Pago:', error);
        return res.status(500).json({ error: 'Falha ao gerar PIX', details: error.message });
    }
}
