import { supabase } from './supabase.js';

async function checkSchema() {
    const { data, error } = await supabase.from('mensagens').select('*').limit(1);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Data:", data);
        if (data && data.length > 0) {
            console.log("Columns:", Object.keys(data[0]));
        }
    }
}
checkSchema();
