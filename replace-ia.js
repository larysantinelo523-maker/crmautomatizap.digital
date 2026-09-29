const fs = require('fs');
let html = fs.readFileSync('teste-agente.html', 'utf8');

// Replace exactly 'A IA' to 'O AGENTE'
html = html.replace(/A IA /g, 'O AGENTE ');
html = html.replace(/a IA /g, 'o AGENTE ');

// Replace 'pela IA' to 'pelo AGENTE'
html = html.replace(/pela IA/g, 'pelo AGENTE');

// Replace 'Agente de IA' -> 'AGENTE'
html = html.replace(/Agente de IA/g, 'AGENTE');

// Replace remaining 'IA' to 'AGENTE' (if any, like 'Aguardando IA')
html = html.replace(/Aguardando IA /g, 'Aguardando AGENTE ');

// Note: Ensure we don't accidentally replace within words, but in this file 'IA' is standalone.
// Also 'Mensagem IA' -> 'Mensagem AGENTE'
html = html.replace(/Mensagem IA/g, 'Mensagem AGENTE');

fs.writeFileSync('teste-agente.html', html);
console.log('Done!');
