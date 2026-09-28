const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qosgrqdfeqzxnzhmwomv.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseKey) return res.status(500).json({ error: 'Missing SERVICE_ROLE_KEY' });
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ─── GET: buscar horários de uma empresa ─────────────────────────────────────
    if (req.method === 'GET') {
        const id = req.query && req.query.id;
        if (!id) return res.status(400).json({ error: 'Missing id' });
        try {
            const { data: user, error } = await supabase
                .from('usuarios').select('horarios').eq('id', id).single();
            if (error && error.code !== 'PGRST116') throw error;
            return res.status(200).json(user?.horarios || []);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    // ─── POST: salvar horários de uma empresa ────────────────────────────────────
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { userId, fuso_horario, horas_lead_parado, horarios } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
        const userUpdate = {};
        if (fuso_horario !== undefined) userUpdate.fuso_horario = fuso_horario;
        if (horas_lead_parado !== undefined) userUpdate.horas_lead_parado = horas_lead_parado;
        if (horarios && Array.isArray(horarios)) userUpdate.horarios = horarios;
        
        if (Object.keys(userUpdate).length > 0) {
            const { error: errUser } = await supabase.from('usuarios').update(userUpdate).eq('id', userId);
            if (errUser) throw errUser;
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
