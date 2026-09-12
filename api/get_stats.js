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
        // Obter número total de empresas
        const { count: totalEmpresas, error: errEmp } = await supabase
            .from('empresas')
            .select('*', { count: 'exact', head: true });

        // Obter número total de leads (ignorando RLS porque usa service_role)
        const { count: totalLeads, error: errLeads } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true });

        // Obter número total de conversas (atendimentos)
        const { count: totalConversas, error: errConv } = await supabase
            .from('conversas')
            .select('*', { count: 'exact', head: true });

        // Obter número total de usuarios
        const { count: totalUsuarios, error: errUsers } = await supabase
            .from('usuarios')
            .select('*', { count: 'exact', head: true });

        return res.status(200).json({
            empresas: totalEmpresas || 0,
            leads: totalLeads || 0,
            conversas: totalConversas || 0,
            usuarios: totalUsuarios || 0
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
