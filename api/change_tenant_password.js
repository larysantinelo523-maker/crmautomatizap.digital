const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
    // Apenas POST é permitido
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { id_empresa, new_password } = req.body;

    if (!id_empresa || !new_password) {
        return res.status(400).json({ error: 'Faltam dados obrigatórios' });
    }

    // Variáveis de ambiente
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Configuração do Supabase ausente' });
    }

    // Usar a chave de serviço para ter privilégios administrativos
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // Atualiza a senha do usuário
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            id_empresa,
            { password: new_password }
        );

        if (error) {
            console.error('Erro ao atualizar senha:', error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ message: 'Senha atualizada com sucesso', user: data.user });

    } catch (err) {
        console.error('Erro interno:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
