const fs = require('fs');

let data = fs.readFileSync('data.js', 'utf8');

data = data.replace('}\\n\\nexport', '}\n\nexport');

fs.writeFileSync('data.js', data);
console.log('Fixed data.js syntax error.');
