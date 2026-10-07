const fs = require('fs');
let text = fs.readFileSync('conversas.html', 'utf8');

const targetStr = `            // Mostra otimisticamente
            const container = document.getElementById('chat-messages-container');
            const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            container.innerHTML += \`
                <div class="msg-bubble-ia" style="opacity: 0.7;">
                    <p style="margin: 0; font-size: 13px; color: #111; line-height: 1.35;">\${text}</p>
                    <div style="text-align: right; margin-top: 2px; margin-bottom: -2px;"><span style="font-size: 10px; color: #667781;">Enviando...</span></div>
                </div>\`;
            container.scrollTop = container.scrollHeight;

            await window.dbAPI.sendMessage(currentLeadId, text);
            // Recarrega do banco pra garantir
            const fullLead = window.localLeadsData ? window.localLeadsData.find(l => l.id === currentLeadId) : null;
            const existingAvatarImg = document.getElementById('chat-header-avatar')?.querySelector('img');
            carregarMensagens(fullLead || { 
                id: currentLeadId, 
                nome: document.getElementById('chat-header-name').innerText, 
                status: '', 
                foto_perfil: existingAvatarImg ? existingAvatarImg.src : null 
            });`;

const replacement = `            // Dispara o envio. A mensagem aparecerá via Realtime (adicionarMensagemNaTela).
            window.dbAPI.sendMessage(currentLeadId, text);`;

// Convert CRLF to LF just in case, for both text and targetStr
text = text.replace(/\\r\\n/g, '\\n');
const t1 = targetStr.replace(/\\r\\n/g, '\\n');

text = text.replace(t1, replacement);

fs.writeFileSync('conversas.html', text);
console.log('Fixed with exact string replace!');
