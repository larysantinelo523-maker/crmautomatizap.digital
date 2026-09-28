require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.VITE_SUPABASE_URL || 'https://qosgrqdfeqzxnzhmwomv.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);
s.from('usuarios').select('segmento,descricao').limit(1).then(r => console.log('Check result:', r.error ? 'Missing columns: ' + r.error.message : 'Columns exist!'));
