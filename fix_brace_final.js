const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

const regex = /isBotActive = false;\s*\}\s*\}/g;
html = html.replace(regex, 'isBotActive = false;\n            }');

fs.writeFileSync('conversas.html', html);
console.log('Fixed extra brace!');
