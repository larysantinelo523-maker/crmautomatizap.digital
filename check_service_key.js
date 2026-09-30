const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const webhookCode = fs.readFileSync('api/mp_webhook.js', 'utf8');
// wait, the key in mp_webhook is read from process.env.SUPABASE_SERVICE_ROLE_KEY!
// So it's not hardcoded in the file.
