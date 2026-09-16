const { MercadoPagoConfig, Payment } = require('mercadopago');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email, userId, nome, mensalidade } = req.body;

    if (!email || !userId) {
        return res.status(400).json({ error: 'Missing email or userId' });
    }

    let parsedAmount = 0.01;
    if (mensalidade) {
        if (typeof mensalidade === 'string') {
            const cleanStr = mensalidade.replace(/[^\d,-]/g, '').replace(',', '.');
            const floatVal = parseFloat(cleanStr);
            if (!isNaN(floatVal) && floatVal > 0) {
                parsedAmount = floatVal;
            }
        } else if (typeof mensalidade === 'number' && mensalidade > 0) {
            parsedAmount = mensalidade;
        }
    }

    try {
        const client = new MercadoPagoConfig({
            accessToken: 'APP_USR-5121029731142512-091416-44ec7bdf36a55ab8f244f0d84bebbf11-1370822621'
        });

        const payment = new Payment(client);

        const idempotencyKey = `PAY-${userId}-${Date.now()}`;

        const nameParts = (nome || 'Cliente CRM').trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ' ';

        const response = await payment.create({
            body: {
                transaction_amount: parsedAmount,
                description: 'Mensalidade AutomatiZAP CRM',
                payment_method_id: 'pix',
                payer: {
                    email: email,
                    first_name: firstName,
                    last_name: lastName
                },
                external_reference: userId, // Vincula ao usuário para o webhook
                notification_url: 'https://crmautomatizap-digital.vercel.app/api/mp_webhook'
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
