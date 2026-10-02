const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

// 1. Remove the old inline warning at the end of messages
const oldWarningRegex = /if \(lead\.bot_ativo === false\) \{\s*html \+= `<div style="align-self: center; background: #fef08a; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; color: #854d0e; margin-bottom: 16px; box-shadow: 0 2px 4px rgba\(0,0,0,0\.05\); z-index: 2; border: 1px solid #fde047;">⚠️ Agente pausado<\/div>`;\s*\}/g;

html = html.replace(oldWarningRegex, '');

// 2. Add logic to show/hide the banner inside carregarMensagens right after rendering messages
const renderMessagesEndRegex = /chatContainer\.innerHTML = html;\s*chatContainer\.scrollTop = chatContainer\.scrollHeight;/;

const newLogic = `chatContainer.innerHTML = html;
                
                // Show or hide the Agent Paused banner
                const pausedBanner = document.getElementById('agente-pausado-banner');
                if (pausedBanner) {
                    if (lead.bot_ativo === false) {
                        pausedBanner.style.display = 'block';
                    } else {
                        pausedBanner.style.display = 'none';
                    }
                }

                chatContainer.scrollTop = chatContainer.scrollHeight;`;

html = html.replace(renderMessagesEndRegex, newLogic);

fs.writeFileSync('conversas.html', html);
console.log('Fixed Agent Paused banner logic');
