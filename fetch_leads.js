const https = require('https');

const options = {
  hostname: 'qosgrqdfeqzxnzhmwomv.supabase.co',
  port: 443,
  path: '/rest/v1/leads',
  method: 'GET',
  headers: {
    'apikey': 'sb_publishable_zoJXnL-UHMj20tx_ml0O7A_tXG29lOZ',
    'Authorization': 'Bearer sb_publishable_zoJXnL-UHMj20tx_ml0O7A_tXG29lOZ'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Leads:", JSON.stringify(JSON.parse(data), null, 2));
  });
});

req.on('error', (e) => { console.error(e); });
req.end();
