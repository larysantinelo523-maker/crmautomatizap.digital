const fs = require('fs');

let content = fs.readFileSync('conversas.html', 'utf8');

const targetStr = '<div id="chat-messages-container" style="flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; min-height: 0;">';
const replacementStr = '<div id="chat-messages-container" style="flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; min-height: 0; background-color: var(--color-bg-main);">';

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync('conversas.html', content);
    console.log("Substituido com sucesso");
} else {
    console.log("String nao encontrada, usando regex");
    content = content.replace(/<div id="chat-messages-container"[^>]*>/, replacementStr);
    fs.writeFileSync('conversas.html', content);
}
