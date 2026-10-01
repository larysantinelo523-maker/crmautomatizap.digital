const fs = require('fs');

let content = fs.readFileSync('conversas.html', 'utf8');

// 1. Encontrar e substituir o style do Wrapper Geral da Coluna da Direita
const oldWrapper = '<!-- Wrapper Geral da Coluna da Direita -->\r\n                <div style="display: flex; flex-direction: column; height: 100%; overflow: hidden;">';
const newWrapper = '<!-- Wrapper Geral da Coluna da Direita -->\r\n                <div class="chat-right-wrapper" style="display: flex; flex-direction: column; height: 100%; overflow: hidden; background-color: var(--color-bg-main); padding: 16px;">';

if (content.includes(oldWrapper)) {
    content = content.replace(oldWrapper, newWrapper);
} else {
    // maybe unix endings
    const oldWrapperLF = '<!-- Wrapper Geral da Coluna da Direita -->\n                <div style="display: flex; flex-direction: column; height: 100%; overflow: hidden;">';
    const newWrapperLF = '<!-- Wrapper Geral da Coluna da Direita -->\n                <div class="chat-right-wrapper" style="display: flex; flex-direction: column; height: 100%; overflow: hidden; background-color: var(--color-bg-main); padding: 16px;">';
    if (content.includes(oldWrapperLF)) {
        content = content.replace(oldWrapperLF, newWrapperLF);
    }
}

// 2. Modificar o chat-card para ter sombra e remover border
const oldCard = '                    <div class="card chat-card" style="padding: 0; width: 100%; display: flex; flex-direction: column; flex: 1; min-height: 0; border-radius: 12px; overflow: hidden; border: 1px solid var(--color-border); box-shadow: none;">';
const newCard = '                    <div class="card chat-card" style="padding: 0; width: 100%; display: flex; flex-direction: column; flex: 1; min-height: 0; border-radius: 12px; overflow: hidden; border: none; box-shadow: 0 8px 30px rgba(0,0,0,0.08); background-color: var(--color-bg-card);">';

if (content.includes(oldCard)) {
    content = content.replace(oldCard, newCard);
} else {
    console.log("old card not found exactly as string, using regex");
    content = content.replace(/<div class="card chat-card"[^>]*>/, newCard);
}

// Além disso, na lista de conversas, que é a coluna esquerda
// Precisamos garantir que a cor de fundo atrás das colunas também seja bg-main.
// A coluna esquerda (lista de contatos) tem um card sem margin.
// Para ficar bonito, o card da esquerda também poderia ter um leve padding ou ficar como estava.
// O usuário reclamou da direita. "perceba que o background está totalemente branco, deixe também os espaçamentos laterais"

fs.writeFileSync('conversas.html', content);
console.log('done');
