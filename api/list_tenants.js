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

    // ─── MODO DETALHE: /api/list_tenants?id=UUID ────────────────────────────────
    if (req.query && req.query.id) {
        const id = req.query.id;
        try {
            const { data: usuario, error: errorUser } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', id)
                .single();

            if (errorUser) throw errorUser;

            const { data: horarios } = await supabase
                .from('horarios_empresa')
                .select('*')
                .eq('id_empresa', id);

            const data30diasStr = new Date(new Date().getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString();

            const { count: leadsCount } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('id_empresa', id)
                .gte('criado_em', data30diasStr);

            const { count: reunioesCount } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('id_empresa', id)
                .or('status.eq.qualificado,qualificacao.eq.qualificado')
                .gte('criado_em', data30diasStr);

            // Calcular status de pagamento
            let evaluatedStatus = usuario.status_assinatura || 'vencido';
            let diffDays = 0;

            if (usuario.data_vencimento) {
                const dataVencStr = usuario.data_vencimento.split('T')[0];
                const [yr, mo, dy] = dataVencStr.split('-');
                const dataVenc = new Date(parseInt(yr), parseInt(mo) - 1, parseInt(dy), 0, 0, 0);
                const hojeStr = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
                const hoje = new Date(hojeStr);
                dataVenc.setHours(0, 0, 0, 0);
                hoje.setHours(0, 0, 0, 0);
                const diffTime = dataVenc.getTime() - hoje.getTime();
                diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays < 0) evaluatedStatus = 'vencido';
                else if (diffDays <= 3) evaluatedStatus = 'Aviso prévio';
                else evaluatedStatus = 'pago';
            }

            return res.status(200).json({
                usuario,
                horarios: horarios || [],
                status: evaluatedStatus,
                diasRestantes: diffDays,
                total_leads: leadsCount || 0,
                reunioes_marcadas: reunioesCount || 0
            });

        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error', details: err.message });
        }
    }

    // ─── MODO LISTA: /api/list_tenants ──────────────────────────────────────────
    try {
        const { data: usuarios, error: errUser } = await supabase
            .from('usuarios')
            .select('*')
            .neq('tipo_usuario', 'administrador');

        if (errUser) throw errUser;

        const result = [];

        for (const user of usuarios) {
            let currentStatus = user.status_assinatura || 'vencido';
            let evaluatedStatus = currentStatus;
            
            if (user.data_vencimento) {
                const dataVencStr = user.data_vencimento.split('T')[0];
                const [yr, mo, dy] = dataVencStr.split('-');
                const dataVenc = new Date(yr, mo - 1, dy, 0, 0, 0);
                
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

                if (evaluatedStatus !== currentStatus) {
                    currentStatus = evaluatedStatus;
                    await supabase
                        .from('usuarios')
                        .update({ status_assinatura: currentStatus })
                        .eq('id', user.id);
                }
            }

            let leadsCount = user.quantidade_leads;
            
            if (leadsCount === undefined || leadsCount === null) {
                const { count, error: errLeads } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .eq('id_empresa', user.id);
                leadsCount = count;
            }

            // Reuniões agendadas (últimos 30 dias)
            const data30dias = new Date(new Date().getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString();
            const { count: reunioesCount } = await supabase
                .from('leads').select('*', { count: 'exact', head: true })
                .eq('id_empresa', user.id)
                .or('status.eq.qualificado,qualificacao.eq.qualificado')
                .gte('criado_em', data30dias);

            result.push({
                id_empresa: user.id,
                nome: user.nome_completo || 'Sem Nome',
                email: user.email || 'N/A',
                vencimento: user.data_vencimento || 'N/A',
                status: evaluatedStatus,
                total_leads: leadsCount || 0,
                reunioes_marcadas: reunioesCount || 0,
                criado_em: user.criado_em || null,
                whatsapp: user.whatsapp || null,
                segmento: user.segmento || null,
                localizacao: user.localizacao || null,
                descricao: user.descricao || null,
                cnpj_cpf: user.cnpj_cpf || null
            });
        }

        return res.status(200).json(result);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
}
