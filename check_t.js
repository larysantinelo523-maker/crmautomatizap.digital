import { supabase } from './supabase.js';

async function checkLeadsTyping() {
    const { data, error } = await supabase.from('leads').select('telefone, is_typing, ultima_interacao').order('ultima_interacao', { ascending: false }).limit(5);
    console.log(JSON.stringify(data, null, 2));
}
checkLeadsTyping();
