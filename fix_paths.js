const fs = require('fs');

let script = fs.readFileSync('script.js', 'utf8');

script = script.replace(/window\.location\.pathname\.indexOf\('leads\.html'\) > -1/g, "window.location.pathname.includes('leads')");
script = script.replace(/window\.location\.pathname\.indexOf\('conversas\.html'\) > -1/g, "window.location.pathname.includes('conversas')");
script = script.replace(/window\.location\.pathname\.indexOf\('configuracoes\.html'\) > -1/g, "window.location.pathname.includes('configuracoes')");

fs.writeFileSync('script.js', script);
console.log('Fixed path matching');
