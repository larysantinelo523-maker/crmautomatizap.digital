const fs = require('fs');

let html = fs.readFileSync('conversas.html', 'utf8');

const targetLogic = `async function toggleBotLogic(newState) {
                if(currentLeadId) {
                    await window.dbAPI.toggleBotState(currentLeadId, newState);
                    carregarMensagens({ id: currentLeadId, nome: document.getElementById('chat-header-name').innerText }); // recarrega pra mostrar o aviso
                } else {
                    alert('Selecione uma conversa primeiro para alterar o status do agente.');
                }
            }`;

const newLogic = `async function toggleBotLogic(newState) {
                if(currentLeadId) {
                    const toggle = document.getElementById('bot-switch');
                    if(toggle) toggle.checked = newState;
                    
                    await window.dbAPI.toggleBotState(currentLeadId, newState);
                    
                    const updatedLead = await window.dbAPI.fetchLeadById(currentLeadId);
                    if (updatedLead) {
                        carregarMensagens(updatedLead);
                    }
                } else {
                    alert('Selecione uma conversa primeiro para alterar o status do agente.');
                }
            }`;

html = html.replace(targetLogic, newLogic);
if (!html.includes(newLogic)) {
    console.error('Falha ao substituir toggleBotLogic');
}

const targetMsg = `// Descobrir estado do toggle lendo a ultima mensagem de sistema ou humano
            let isBotActive = true;
            for(let i = mensagens.length - 1; i >= 0; i--) {
                if(mensagens[i].bot_ativo !== null && mensagens[i].bot_ativo !== undefined) {
                    isBotActive = mensagens[i].bot_ativo;
                    break;
                }
            }`;

const newMsg = `// O status do agente agora vem diretamente da coluna status_agente na tabela leads
            let isBotActive = true;
            if (lead.status_agente === 'desativado') {
                isBotActive = false;
            }`;

html = html.replace(targetMsg, newMsg);
if (!html.includes(newMsg)) {
    console.error('Falha ao substituir targetMsg');
}

const targetPausa = `// Adiciona a mensagem de sistema UMA ÚNICA VEZ no final, apenas se o bot estiver pausado
            if (isBotActive === false) {
                html += \`<div style="align-self: center; background: #fef08a; padding: 4px 10px; border-radius: 6px; font-size: 11px; color: #854d0e; margin-bottom: 12px; box-shadow: 0 1px 1px rgba(0,0,0,0.05); z-index: 2;">⚙️ Bot foi pausado pelo administrador.</div>\`;
            }`;

const newPausa = `// Adiciona a mensagem de sistema UMA ÚNICA VEZ no final, apenas se o bot estiver pausado
            if (isBotActive === false) {
                html += \`<div style="align-self: center; background: #fef08a; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; color: #854d0e; margin-bottom: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); z-index: 2; border: 1px solid #fde047;">⚠️ Agente pausado</div>\`;
            }`;

html = html.replace(targetPausa, newPausa);
if (!html.includes(newPausa)) {
    console.error('Falha ao substituir targetPausa');
}

fs.writeFileSync('conversas.html', html);
console.log('conversas.html atualizado com sucesso');
