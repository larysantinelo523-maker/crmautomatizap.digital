import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qosgrqdfeqzxnzhmwomv.supabase.co';
const supabaseAnonKey = 'sb_publishable_zoJXnL-UHMj20tx_ml0O7A_tXG29lOZ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    const { data: userData, error: userError } = await supabase.from('usuarios').select('*').limit(1);
    console.log('Usuarios:', userData);
    
    const { data: faturasData, error: faturasError } = await supabase.from('faturas').select('*').limit(1);
    console.log('Faturas Error:', faturasError?.message);
    if(faturasData) console.log('Faturas:', faturasData);
    
    const { data: pagamentosData, error: pagamentosError } = await supabase.from('pagamentos').select('*').limit(1);
    console.log('Pagamentos Error:', pagamentosError?.message);
    if(pagamentosData) console.log('Pagamentos:', pagamentosData);
}

checkSchema();
