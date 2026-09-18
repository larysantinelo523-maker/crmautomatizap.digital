const { createClient } = require('@supabase/supabase-js');
const { MercadoPagoConfig, Payment } = require('mercadopago');

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qosgrqdfeqzxnzhmwomv.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseKey) {
        return res.status(500).json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // Obter todos os usuários (empresas)
        const { data: empresas, error: errEmp } = await supabase
            .from('usuarios')
            .select('*')
            .neq('tipo_usuario', 'administrador');

        if (errEmp) throw errEmp;

        let totalEmpresas = 0;
        let clientesPagos = 0;
        let clientesInadimplentes = 0;

        empresas.forEach(emp => {
            // Garante que o administrador não seja contado (filtro duplo)
            if (emp.tipo_usuario && emp.tipo_usuario.trim().toLowerCase() === 'administrador') return;
            // Opcional: filtro por email caso seja necessário
            if (emp.email && emp.email.trim().toLowerCase() === 'admin@automatizap.com') return;
            
            totalEmpresas++;

            let evaluatedStatus = emp.status_assinatura || 'vencido';

            if (emp.data_vencimento && emp.data_vencimento !== 'N/A') {
                const dataVencStr = emp.data_vencimento.split('T')[0];
                const parts = dataVencStr.split('-');
                if (parts.length === 3) {
                    const dataVenc = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0);
                    const hojeStr = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
                    const hoje = new Date(hojeStr);
                    
                    dataVenc.setHours(0, 0, 0, 0);
                    hoje.setHours(0, 0, 0, 0);

                    const diffTime = dataVenc.getTime() - hoje.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays < 0) {
                        evaluatedStatus = 'vencido';
                    } else if (diffDays >= 0 && diffDays <= 3) {
                        evaluatedStatus = 'Aviso prévio';
                    } else {
                        evaluatedStatus = 'pago';
                    }
                }
            }

            if (evaluatedStatus === 'pago' || evaluatedStatus === 'Aviso prévio') {
                clientesPagos++;
            } else if (evaluatedStatus === 'vencido' || evaluatedStatus === 'inadimplente' || evaluatedStatus === 'cancelado') {
                clientesInadimplentes++;
            }
        });

        let faturamentoReal = 0;
        try {
            const client = new MercadoPagoConfig({ 
                accessToken: 'APP_USR-5121029731142512-091416-44ec7bdf36a55ab8f244f0d84bebbf11-1370822621' 
            });
            const payment = new Payment(client);
            
            const hojeMP = new Date();
            const firstDay = new Date(hojeMP.getFullYear(), hojeMP.getMonth(), 1).toISOString();
            const lastDay = new Date(hojeMP.getFullYear(), hojeMP.getMonth() + 1, 0, 23, 59, 59).toISOString();
            
            const searchResult = await payment.search({
                options: {
                    begin_date: firstDay,
                    end_date: lastDay,
                    status: 'approved'
                }
            });
            
            if (searchResult && searchResult.results) {
                searchResult.results.forEach(p => {
                    faturamentoReal += p.transaction_amount;
                });
            }
        } catch (mpErr) {
            console.error("Erro ao buscar faturamento no Mercado Pago:", mpErr);
        }

        return res.status(200).json({
            empresas: totalEmpresas,
            pagos: clientesPagos,
            inadimplentes: clientesInadimplentes,
            faturamento: faturamentoReal
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
