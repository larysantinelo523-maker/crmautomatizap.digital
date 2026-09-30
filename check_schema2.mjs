import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qosgrqdfeqzxnzhmwomv.supabase.co';
const supabaseAnonKey = 'sb_publishable_zoJXnL-UHMj20tx_ml0O7A_tXG29lOZ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    const { data: uData, error: uError } = await supabase.from('usuarios').select('*');
    if (uError) console.error(uError);
    if (uData && uData.length > 0) {
        console.log('usuarios:', Object.keys(uData[0]));
    } else {
        console.log('No user data', uData);
    }
}

checkSchema();
