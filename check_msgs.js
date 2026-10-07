import { supabase } from './supabase.js';

async function checkSchema() {
    const { data, error } = await supabase.from('mensagens').select('*').order('criado_em', { ascending: false }).limit(2);
    if (error) {
        console.error("Error:", error);
    } else {
        data.forEach(d => {
            console.log("ID:", d.id);
            console.log("Conteudo:", d.conteudo);
            console.log("Mime Type:", d.mime_type);
            console.log("Base64 Present:", !!d.base64);
            console.log("Base64 length:", d.base64 ? d.base64.length : 0);
            console.log("Media URL:", d.media_url);
        });
    }
}
checkSchema();
