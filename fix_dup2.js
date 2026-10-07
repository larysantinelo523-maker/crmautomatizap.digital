const fs = require('fs');
let text = fs.readFileSync('conversas.html', 'utf8');

const startIdx = text.indexOf('// Mostra otimisticamente');
const endIdx = text.indexOf('}', startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `// Dispara o envio. A mensagem aparecerá via Realtime (adicionarMensagemNaTela).
            window.dbAPI.sendMessage(currentLeadId, text);
        `;
    
    text = text.slice(0, startIdx) + replacement + text.slice(endIdx + 1);
    fs.writeFileSync('conversas.html', text);
    console.log("Replaced using index!");
} else {
    console.log("Not found!");
}
