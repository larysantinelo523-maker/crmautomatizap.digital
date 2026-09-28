const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { userId, fuso_horario, horas_lead_parado, horarios } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qosgrqdfeqzxnzhmwomv.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseKey) return res.status(500).json({ error: 'Missing SERVICE_ROLE_KEY' });

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const userUpdate = {};
        if (fuso_horario !== undefined) userUpdate.fuso_horario = fuso_horario;
        if (horas_lead_parado !== undefined) userUpdate.horas_lead_parado = horas_lead_parado;
        
        if (Object.keys(userUpdate).length > 0) {
            const { error: errUser } = await supabase.from('usuarios').update(userUpdate).eq('id', userId);
            if (errUser) throw errUser;
        }

        if (horarios && Array.isArray(horarios)) {
            const upsertData = horarios.map(h => ({
                id_empresa: userId,
                dia_semana: h.dia_semana,
                aberto: h.aberto,
                hora_abertura: h.hora_abertura || null,
                hora_fechamento: h.hora_fechamento || null
            }));
            const { error: errHorarios } = await supabase.from('horarios_empresa').upsert(upsertData, { onConflict: 'id_empresa, dia_semana' });
            if (errHorarios) throw errHorarios;
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
