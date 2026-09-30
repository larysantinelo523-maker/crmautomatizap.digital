const fs = require('fs');
let sbJs = fs.readFileSync('supabase.js', 'utf8');
const urlMatch = sbJs.match(/supabaseUrl\s*=\s*['"](.*?)['"]/);
const keyMatch = sbJs.match(/supabaseAnonKey\s*=\s*['"](.*?)['"]/);

if (urlMatch && keyMatch) {
    const url = urlMatch[1];
    const key = keyMatch[1];
    
    fetch(`${url}/rest/v1/`, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    }).then(r => r.json()).then(data => {
        if(data && data.paths) {
            console.log('Tables:', Object.keys(data.paths).map(p => p.substring(1)));
        } else {
            console.log('No data paths', data);
        }
    }).catch(e => console.error(e));
}
