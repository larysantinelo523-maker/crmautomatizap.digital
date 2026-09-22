import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qosgrqdfeqzxnzhmwomv.supabase.co';
const supabaseAnonKey = 'sb_publishable_zoJXnL-UHMj20tx_ml0O7A_tXG29lOZ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuery() {
    console.log("Testing query for mensagens...");
    const { data, error } = await supabase
        .from('mensagens')
        .select('*');
    
    console.log("Data:", data);
    if(error) console.log("Error:", error);
}

testQuery();
