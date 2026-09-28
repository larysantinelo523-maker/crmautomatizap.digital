const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'Missing id parameter' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qosgrqdfeqzxnzhmwomv.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseKey) {
        return res.status(500).json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // 1. Fetch User
        const { data: usuario, error: errorUser } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', id)
            .single();

        if (errorUser) throw errorUser;

        // 2. Fetch Horarios
        const { data: horarios, error: errorHorarios } = await supabase
            .from('horarios_empresa')
            .select('*')
            .eq('id_empresa', id);

        if (errorHorarios) throw errorHorarios;

        // 3. Fetch Leads and Reunioes in the last 30 days
        const data30diasStr = new Date(new Date().getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString();

        // 3a. Leads (contagem)
        const { count: leadsCount, error: errorLeads } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('id_empresa', id)
            .gte('criado_em', data30diasStr);

        // 3b. Reuniões agendadas (leads com status = 'qualificado')
        const { count: reunioesCount, error: errorReunioes } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('id_empresa', id)
            .or('status.eq.qualificado,qualificacao.eq.qualificado')
            .gte('criado_em', data30diasStr);

        // Define status
        let evaluatedStatus = usuario.status_assinatura || 'vencido';
        let diffDays = 0;
        
        if (usuario.data_vencimento) {
            const dataVencStr = usuario.data_vencimento.split('T')[0];
            const [yr, mo, dy] = dataVencStr.split('-');
            const dataVenc = new Date(yr, mo - 1, dy, 0, 0, 0);
            
            const hojeStr = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
            const hoje = new Date(hojeStr);
            
            dataVenc.setHours(0, 0, 0, 0);
            hoje.setHours(0, 0, 0, 0);

            const diffTime = dataVenc.getTime() - hoje.getTime();
            diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                evaluatedStatus = 'vencido';
            } else if (diffDays >= 0 && diffDays <= 3) {
                evaluatedStatus = 'Aviso prévio';
            } else {
                evaluatedStatus = 'pago';
            }
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
};
