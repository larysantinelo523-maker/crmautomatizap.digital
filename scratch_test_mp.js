const { MercadoPagoConfig, Payment } = require('mercadopago');

async function testMP() {
    try {
        const client = new MercadoPagoConfig({ 
            accessToken: 'APP_USR-5121029731142512-091416-44ec7bdf36a55ab8f244f0d84bebbf11-1370822621' 
        });
        
        const payment = new Payment(client);
        const idempotencyKey = `PAY-TEST-${Date.now()}`;
        
        console.log("Enviando requisição pro Mercado Pago...");
        const response = await payment.create({
            body: {
                transaction_amount: 0.01,
                description: 'Mensalidade AutomatiZAP CRM',
                payment_method_id: 'pix',
                payer: {
                    email: 'test@example.com'
                },
                external_reference: 'TEST-USER',
                notification_url: 'https://crmautomatizap-digital.vercel.app/api/mp_webhook'
            },
            requestOptions: { idempotencyKey }
        });
        
        console.log("Sucesso! QR Code:", response.point_of_interaction?.transaction_data?.qr_code);
    } catch (error) {
        console.error("Erro no MP:", error.message);
        if (error.cause) {
            console.error("Cause:", error.cause);
        }
    }
}

testMP();
