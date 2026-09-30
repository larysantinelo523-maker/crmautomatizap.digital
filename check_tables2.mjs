import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qosgrqdfeqzxnzhmwomv.supabase.co';
const supabaseAnonKey = 'sb_publishable_zoJXnL-UHMj20tx_ml0O7A_tXG29lOZ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    const { data: aData, error: aError } = await supabase.from('assinaturas').select('*').limit(1);
    console.log('assinaturas Error:', aError?.message);
    if(aData) console.log('assinaturas:', aData);
    
    const { data: tData, error: tError } = await supabase.from('transacoes').select('*').limit(1);
    console.log('transacoes Error:', tError?.message);
    if(tData) console.log('transacoes:', tData);
}

checkSchema();
