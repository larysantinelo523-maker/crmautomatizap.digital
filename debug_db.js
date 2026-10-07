import { supabase } from './supabase.js';

async function checkDatabase() {
    const { data: msgs, error: msgError } = await supabase.from('mensagens').select('conteudo, remetente, lead_id, criado_em').order('criado_em', { ascending: false }).limit(10);
    const { data: leads, error: leadError } = await supabase.from('leads').select('id, nome, telefone');

    if (msgError || leadError) {
        console.error(msgError || leadError);
        return;
    }

    console.log("=== LEADS ===");
    leads.forEach(l => console.log(`${l.id.substring(0,8)} - ${l.nome} - ${l.telefone}`));

    console.log("\n=== MESSAGES ===");
    msgs.forEach(m => {
        const lead = leads.find(l => l.id === m.lead_id);
        console.log(`[${new Date(m.criado_em).toLocaleTimeString()}] ${lead ? lead.nome : m.lead_id} (${m.remetente}): ${m.conteudo}`);
    });
}
checkDatabase();
