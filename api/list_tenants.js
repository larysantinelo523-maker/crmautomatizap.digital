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
        // Obter todos os usuários (que são as empresas agora)
        const { data: usuarios, error: errUser } = await supabase
            .from('usuarios')
            .select('*')
            .neq('tipo_usuario', 'administrador');

        if (errUser) throw errUser;

        const result = [];

        for (const user of usuarios) {
            // Pegar contagem de leads. A tabela leads ainda usa a coluna id_empresa para armazenar o ID do usuário/empresa
            const { count: leadsCount, error: errLeads } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('id_empresa', user.id); // A coluna no banco ainda se chama id_empresa

            result.push({
                id_empresa: user.id, // Mantemos a chave id_empresa para não quebrar o frontend imediatamente
                nome: user.nome_completo || 'Sem Nome',
                email: user.email || 'N/A',
                vencimento: user.data_vencimento || 'N/A',
                status: user.status_assinatura || 'N/A',
                total_leads: leadsCount || 0
            });
        }

        return res.status(200).json(result);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
}
