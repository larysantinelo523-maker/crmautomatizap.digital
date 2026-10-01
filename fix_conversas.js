const fs = require('fs');

let html = fs.readFileSync('conversas.html', 'utf8');

// Replace 1
html = html.replace(/async function toggleBotLogic[\s\S]*?\} else \{[\s\S]*?\}[\s\S]*?\}/, `async function toggleBotLogic(newState) {
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
            }`);

// Replace 2
html = html.replace(/\/\/ Descobrir estado do toggle lendo a ultima mensagem de sistema ou humano[\s\S]*?let isBotActive = true;[\s\S]*?break;[\s\S]*?\}/, `// O status do agente agora vem diretamente da coluna status_agente na tabela leads
            let isBotActive = true;
            if (lead.status_agente === 'desativado') {
                isBotActive = false;
            }`);

// Replace 3
html = html.replace(/\/\/ Adiciona a mensagem de sistema UMA ÚNICA VEZ[\s\S]*?if \(isBotActive === false\) \{[\s\S]*?\}/, `// Adiciona a mensagem de sistema UMA ÚNICA VEZ no final, apenas se o bot estiver pausado
            if (isBotActive === false) {
                html += \`<div style="align-self: center; background: #fef08a; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; color: #854d0e; margin-bottom: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); z-index: 2; border: 1px solid #fde047;">⚠️ Agente pausado</div>\`;
            }`);

fs.writeFileSync('conversas.html', html);
console.log('conversas.html atualizado.');
