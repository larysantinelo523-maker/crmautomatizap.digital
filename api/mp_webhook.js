const { MercadoPagoConfig, Payment } = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const paymentId = req.body?.data?.id || req.query?.['data.id'];
        
        if (req.query?.type === 'payment' || req.body?.type === 'payment' || req.body?.action === 'payment.updated') {
            if (!paymentId) return res.status(200).send('OK');

            const client = new MercadoPagoConfig({ 
                accessToken: 'APP_USR-5121029731142512-091416-44ec7bdf36a55ab8f244f0d84bebbf11-1370822621' 
            });
            const payment = new Payment(client);
            const paymentInfo = await payment.get({ id: paymentId });

            if (paymentInfo.status === 'approved') {
                const userId = paymentInfo.external_reference;
                if (!userId) return res.status(200).send('No external reference');

                // Conecta no Supabase
                const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qosgrqdfeqzxnzhmwomv.supabase.co';
                const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                
                if (!supabaseKey) {
                    console.error("Missing SUPABASE_SERVICE_ROLE_KEY in webhook");
                    return res.status(500).json({ error: "Server config error" });
                }

                const supabase = createClient(supabaseUrl, supabaseKey);

                // Busca o usuario para pegar a data_vencimento atual
                const { data: user, error: fetchError } = await supabase
                    .from('usuarios')
                    .select('data_vencimento')
                    .eq('id', userId)
                    .single();

                if (fetchError || !user) throw fetchError || new Error("User not found");

                // Calcula +1 mês baseado na data ATUAL do banco
                let nextDate = new Date();
                const now = new Date();
                if (user.data_vencimento && user.data_vencimento !== 'N/A') {
                    const pts = user.data_vencimento.split('-');
                    let yr = parseInt(pts[0], 10), mo = parseInt(pts[1], 10) - 1, dy = parseInt(pts[2], 10);
                    let tMo = mo + 1, tYr = yr;
                    if (tMo > 11) { tMo = 0; tYr++; }
                    let mDy = new Date(tYr, tMo + 1, 0).getDate();
                    nextDate = new Date(tYr, tMo, Math.min(dy, mDy), 0, 0, 0, 0);
                    
                    // Se o cliente estava inadimplente há muito tempo e a nova data ainda fica no passado,
                    // damos +1 mês a partir do dia de hoje para ser justo.
                    if (nextDate < now) {
                        nextDate = new Date(now);
                        nextDate.setMonth(nextDate.getMonth() + 1);
                    }
                } else {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                }

                const newDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth()+1).padStart(2,'0')}-${String(nextDate.getDate()).padStart(2,'0')}`;

                // Atualiza o banco
                const { error: updateError } = await supabase
                    .from('usuarios')
                    .update({ data_vencimento: newDateStr, status_assinatura: 'pago' })
                    .eq('id', userId);

                if (updateError) throw updateError;
                console.log(`User ${userId} renewed to ${newDateStr}`);
            }
        }
        
        return res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).send('Internal Server Error');
    }
}
