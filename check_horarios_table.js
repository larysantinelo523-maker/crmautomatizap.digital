import { createClient } from '@supabase/supabase-js';

// Trocando para process.env para segurança, mas como é só um script local:
import * as fs from 'fs';
import * as dotenv from 'dotenv';
const envFile = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if(key) envVars[key.trim()] = value.join('=').trim().replace(/['"]/g, '');
});

const supabaseUrl = envVars.VITE_SUPABASE_URL || 'https://qosgrqdfeqzxnzhmwomv.supabase.co';
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHorarios() {
    const { data, error } = await supabase.from('horarios_empresa').select('*').limit(1);
    if (error) {
        console.log('ERRO:', error.message);
    } else {
        console.log('Tabela Existe! Retornou dados:', data);
    }
}

checkHorarios();
