const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password, nome_empresa, data_vencimento } = req.body;
    
    if (!email || !password || !nome_empresa) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qosgrqdfeqzxnzhmwomv.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseKey) {
        return res.status(500).json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY in Vercel environment' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // 1. Create User in Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                tipo_usuario: 'usuário',
                nome_completo: nome_empresa
            }
        });

        if (authError) {
            return res.status(400).json({ error: authError.message });
        }

        const userId = authData.user.id;

        // 2. Create/Update Usuario Profile
        const profileData = {
            id: userId,
            nome_completo: nome_empresa,
            tipo_usuario: 'usuário',
            status_assinatura: 'ativo',
            email: email
        };

        if (data_vencimento) {
            profileData.data_vencimento = data_vencimento;
        }

        const { error: profError } = await supabase
            .from('usuarios')
            .upsert([profileData]);

        if (profError) {
            return res.status(400).json({ error: 'Erro ao criar perfil de usuário: ' + profError.message });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Cliente criado com sucesso!',
            user_id: userId
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
