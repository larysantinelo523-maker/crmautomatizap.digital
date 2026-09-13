const { createClient } = require('@supabase/supabase-js');

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

        let totalEmpresas = empresas.length;
        let clientesPagos = 0;
        let clientesInadimplentes = 0;

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        empresas.forEach(emp => {
            let isInadimplente = false;

            if (emp.status_assinatura === 'inadimplente' || emp.status_assinatura === 'cancelado') {
                isInadimplente = true;
            } else if (emp.data_vencimento && emp.data_vencimento !== 'N/A') {
                const parts = emp.data_vencimento.split('-'); // ex: 2026-10-12
                if (parts.length === 3) {
                    const venc = new Date(parts[0], parts[1] - 1, parts[2]);
                    if (venc < hoje) {
                        isInadimplente = true;
                    }
                }
            }

            if (isInadimplente) {
                clientesInadimplentes++;
            } else {
                clientesPagos++;
            }
        });

        return res.status(200).json({
            empresas: totalEmpresas,
            pagos: clientesPagos,
            inadimplentes: clientesInadimplentes,
            faturamento: 0 // Placeholder para a futura integração com Mercado Pago
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
