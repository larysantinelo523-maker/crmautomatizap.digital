import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qosgrqdfeqzxnzhmwomv.supabase.co';
const supabaseAnonKey = 'sb_publishable_zoJXnL-UHMj20tx_ml0O7A_tXG29lOZ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    const { data, error } = await supabase.from('reportes_agente').select('*').limit(1);
    console.log(error || data);
}
test();
