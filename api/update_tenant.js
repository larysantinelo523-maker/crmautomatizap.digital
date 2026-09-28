const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { userId, nome_completo, email, mensalidade, data_vencimento, whatsapp, cnpj_cpf, segmento, descricao, localizacao } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qosgrqdfeqzxnzhmwomv.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseKey) return res.status(500).json({ error: 'Missing SERVICE_ROLE_KEY' });

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        if (email) {
            await supabase.auth.admin.updateUserById(userId, { email, user_metadata: { nome_completo } });
        }
        
        const updateData = {};
        if (nome_completo !== undefined) updateData.nome_completo = nome_completo;
        if (email !== undefined) updateData.email = email;
        if (mensalidade !== undefined) updateData.mensalidade = mensalidade;
        if (data_vencimento !== undefined) updateData.data_vencimento = data_vencimento;
        if (whatsapp !== undefined) updateData.whatsapp = whatsapp;
        if (cnpj_cpf !== undefined) updateData.cnpj_cpf = cnpj_cpf;
        if (segmento !== undefined) updateData.segmento = segmento;
        if (descricao !== undefined) updateData.descricao = descricao;
        if (localizacao !== undefined) updateData.localizacao = localizacao;

        const { error } = await supabase.from('usuarios').update(updateData).eq('id', userId);
        if (error) throw error;
        
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
