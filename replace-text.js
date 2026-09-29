const fs = require('fs');
let html = fs.readFileSync('teste-agente.html', 'utf8');

// Replace all 'Detalhar <i' with 'Corrigir problema <i'
html = html.replace(/Detalhar <i class="ph ph-caret-right"/g, 'Corrigir problema <i class="ph ph-caret-right"');

fs.writeFileSync('teste-agente.html', html);
console.log('Done!');
