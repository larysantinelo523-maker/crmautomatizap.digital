const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

html = html.replace("isBotActive = false;\r\n            }\r\n            }\r\n            const toggles", "isBotActive = false;\r\n            }\r\n            const toggles");

html = html.replace("isBotActive = false;\n            }\n            }\n            const toggles", "isBotActive = false;\n            }\n            const toggles");

html = html.replace("avatar.innerText = lead.nome.charAt(0).toUpperCase();", "avatar.innerText = (lead.nome || 'Desconhecido').charAt(0).toUpperCase();");

fs.writeFileSync('conversas.html', html);
console.log('Fixed syntax error in conversas.html');
