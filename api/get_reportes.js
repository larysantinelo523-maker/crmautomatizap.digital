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

    const { id_empresa } = req.query;

    try {
        let query = supabase.from('reportes_agente').select('*').order('criado_em', { ascending: false });
        if (id_empresa) {
            query = query.eq('id_empresa', id_empresa);
        }

        const { data, error } = await query;
        if (error) throw error;

        return res.status(200).json(data || []);
    } catch (err) {
        console.error('Erro em get_reportes:', err);
        return res.status(500).json({ error: err.message });
    }
}
