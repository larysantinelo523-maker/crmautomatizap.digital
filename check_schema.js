import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qosgrqdfeqzxnzhmwomv.supabase.co';
const supabaseAnonKey = 'sb_publishable_zoJXnL-UHMj20tx_ml0O7A_tXG29lOZ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    const { data, error } = await supabase.from('usuarios').select('*').limit(1);
    if (error) {
        console.error('Error fetching usuarios:', error);
    } else if (data && data.length > 0) {
        console.log('Campos na tabela usuarios:', Object.keys(data[0]));
    } else {
        console.log('Tabela usuarios está vazia.');
    }
}

checkSchema();
