import { supabase } from './supabase.js';

async function main() {
    // We can't alter tables directly from supabase-js unless we use rpc.
    // Let's check if the column exists by selecting it
    const { data, error } = await supabase.from('leads').select('id, is_typing').limit(1);
    console.log("Check column:", error ? error.message : "Column exists!");
}
main();
