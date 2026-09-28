const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { userId, status_assinatura } = req.body;
    if (!userId || !status_assinatura) return res.status(400).json({ error: 'Missing fields' });

    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qosgrqdfeqzxnzhmwomv.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseKey) return res.status(500).json({ error: 'Missing SERVICE_ROLE_KEY' });
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { error } = await supabase.from('usuarios').update({ status_assinatura }).eq('id', userId);
        if (error) throw error;
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
