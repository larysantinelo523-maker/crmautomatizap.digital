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
        // Obter todas as empresas
        const { data: empresas, error: errEmp } = await supabase
            .from('empresas')
            .select('*');

        if (errEmp) throw errEmp;

        // Para cada empresa, pegar o dono, status, data de vencimento e contagem de leads
        const result = [];

        for (const emp of empresas) {
            // Pegar o dono (usuário primário)
            const { data: users, error: errUser } = await supabase
                .from('usuarios')
                .select('email, status_assinatura, data_vencimento')
                .eq('id_empresa', emp.id)
                .limit(1);
            
            const user = users && users.length > 0 ? users[0] : null;

            // Pegar contagem de leads
            const { count: leadsCount, error: errLeads } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('id_empresa', emp.id);

            result.push({
                id_empresa: emp.id,
                nome: emp.nome,
                email: user ? user.email : 'N/A',
                vencimento: user ? user.data_vencimento : 'N/A',
                status: user ? user.status_assinatura : 'N/A',
                total_leads: leadsCount || 0
            });
        }

        return res.status(200).json(result);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
}
