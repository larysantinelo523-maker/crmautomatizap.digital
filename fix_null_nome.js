const fs = require('fs');

let html = fs.readFileSync('conversas.html', 'utf8');

// Fix null lead.nome in initConversations
html = html.replace(/const initials = lead\.nome\.charAt\(0\)\.toUpperCase\(\);/g, 
"const safeNome = lead.nome || 'Desconhecido'; const initials = safeNome.charAt(0).toUpperCase();");

// Update html where lead.nome was used inside the loop
html = html.replace(/<strong style="font-size: 14px;">\$\{lead\.nome\}<\/strong>/g, 
'<strong style="font-size: 14px;">${safeNome}</strong>');

// Also fix in carregarMensagens
html = html.replace(/document\.getElementById\('chat-header-name'\)\.innerText = lead\.nome;/g,
"document.getElementById('chat-header-name').innerText = lead.nome || 'Desconhecido';");

// Check if there are other lead.nome usages in conversas.html that might throw
// (e.g. initial.charAt could throw if it's not a string)

fs.writeFileSync('conversas.html', html);
console.log('Fixed null pointer on lead.nome');
