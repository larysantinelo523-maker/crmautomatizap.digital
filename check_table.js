import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qosgrqdfeqzxnzhmwomv.supabase.co';
const supabaseAnonKey = 'sb_publishable_zoJXnL-UHMj20tx_ml0O7A_tXG29lOZ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
    const { data, error } = await supabase.from('horarios_empresa').select('*').limit(1);
    if (error) {
        console.error('ERRO:', error);
    } else {
        console.log('Tabela existe!', data);
    }
}
checkTable();
