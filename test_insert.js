import { supabase } from './supabase.js';

async function testInsert() {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'geremias@gmail.com',
        password: 'Geremias123'
    });
    
    const id_empresa = authData.user.id;
    const leadId = 'e89f93a0-c8a1-4d60-a068-86c62456427e';
    
    // Test 'empresa'
    const { data: d1, error: e1 } = await supabase.from('mensagens').insert([{ id_empresa, lead_id: leadId, conteudo: 'test', remetente: 'empresa' }]);
    console.log("empresa error:", e1?.message || "Success");

    // Test 'ia'
    const { data: d2, error: e2 } = await supabase.from('mensagens').insert([{ id_empresa, lead_id: leadId, conteudo: 'test', remetente: 'ia' }]);
    console.log("ia error:", e2?.message || "Success");
}
testInsert();
