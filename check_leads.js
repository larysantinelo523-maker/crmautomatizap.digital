import { supabase } from './supabase.js';

async function checkLeads() {
    const { data: leads, error } = await supabase.from('leads').select('*');
    if (error) console.error(error);
    else {
        leads.forEach(l => console.log(l.nome, l.telefone, l.id));
    }
}
checkLeads();
