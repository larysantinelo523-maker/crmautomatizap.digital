const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    const { id_empresa, status } = req.body; // status opcional

    if (!id_empresa) return res.status(400).json({ error: 'Faltam dados obrigatórios' });

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) return res.status(500).json({ error: 'Configuração do Supabase ausente' });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const novoStatus = status || 'suspenso';
        
        // Atualizar status na tabela
        const { error: profError } = await supabaseAdmin
            .from('usuarios')
            .update({ status_assinatura: novoStatus })
            .eq('id', id_empresa);

        if (profError) throw profError;

        // Banning or unbanning user (emulating by updating metadata or similar if needed)
        // Se quisermos bloquear totalmente o acesso Auth, poderíamos fazer:
        // const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id_empresa, { ban_duration: novoStatus === 'suspenso' ? '876000h' : 'none' });
        // (Isso depende de como o Auth lida com suspensão).
        
        return res.status(200).json({ message: `Empresa ${novoStatus}` });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
