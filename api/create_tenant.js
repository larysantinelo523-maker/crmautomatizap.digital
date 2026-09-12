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
            email_confirm: true
        });

        if (authError) {
            return res.status(400).json({ error: authError.message });
        }

        const userId = authData.user.id;

        // 2. Create Empresa
        const { data: empresa, error: empError } = await supabase
            .from('empresas')
            .insert([{ nome: nome_empresa }])
            .select()
            .single();

        if (empError) {
            // Rollback user creation ideally, but for now just return error
            await supabase.auth.admin.deleteUser(userId);
            return res.status(400).json({ error: 'Erro ao criar empresa: ' + empError.message });
        }

        const empresaId = empresa.id;

        // 3. Create Usuario Profile
        const profileData = {
            id: userId,
            id_empresa: empresaId,
            nome_completo: 'Admin ' + nome_empresa,
            tipo_usuario: 'usuário',
            status_assinatura: 'ativo'
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
            empresa_id: empresaId,
            user_id: userId
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
