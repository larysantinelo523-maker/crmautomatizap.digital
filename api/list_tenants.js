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
            let currentStatus = user.status_assinatura || 'vencido';
            let evaluatedStatus = currentStatus;
            
            // Avaliar o status com base na data de vencimento
            if (user.data_vencimento) {
                // Considerando UTC/Brasil para pegar o 'hoje' correto
                const dataVencStr = user.data_vencimento.split('T')[0]; // Pega só a data se houver tempo
                const [yr, mo, dy] = dataVencStr.split('-');
                const dataVenc = new Date(yr, mo - 1, dy, 0, 0, 0);
                
                const hojeStr = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
                const hoje = new Date(hojeStr);
                
                // Zera as horas para comparar apenas os dias
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

                // Se o status real for diferente do que está no banco, atualiza o banco
                if (evaluatedStatus !== currentStatus) {
                    currentStatus = evaluatedStatus;
                    // Atualiza em background no banco
                    await supabase
                        .from('usuarios')
                        .update({ status_assinatura: currentStatus })
                        .eq('id', user.id);
                }
            }

            // Pegar contagem de leads. A tabela leads ainda usa a coluna id_empresa para armazenar o ID do usuário/empresa
            let leadsCount = user.quantidade_leads; // Usa a nova coluna se existir
            
            if (leadsCount === undefined || leadsCount === null) {
                const { count, error: errLeads } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .eq('id_empresa', user.id);
                leadsCount = count;
            }

            result.push({
                id_empresa: user.id, // Mantemos a chave id_empresa para não quebrar o frontend imediatamente
                nome: user.nome_completo || 'Sem Nome',
                email: user.email || 'N/A',
                vencimento: user.data_vencimento || 'N/A',
                status: evaluatedStatus,
                total_leads: leadsCount || 0
            });
        }

        return res.status(200).json(result);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
}
