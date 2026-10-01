const fs = require('fs');

let content = fs.readFileSync('conversas.html', 'utf8');

const startMarker = '<div class="mockup-container"';
const endMarker = '</main>';

let startIndex = content.indexOf(startMarker);
let endIndex = content.indexOf(endMarker, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const replacement = `                    <div class="card chat-card" style="padding: 0; width: 100%; display: flex; flex-direction: column; flex: 1; min-height: 0; border-radius: 12px; overflow: hidden; border: 1px solid var(--color-border); box-shadow: none;">
                        <!-- Cabecalho Chat -->
                        <div style="padding: 16px 24px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; background-color: var(--color-bg-card);">
                            <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
                                <i class="ph ph-arrow-left mobile-only" style="font-size: 20px; cursor: pointer; display: none;" onclick="document.querySelector('.chat-layout').classList.remove('show-chat')"></i>
                                <div id="chat-header-avatar" class="avatar" style="width: 48px; height: 48px; min-width: 48px; background: var(--color-primary); color: white; font-size: 16px; display: flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 50%; overflow: hidden;">--</div>
                                <div style="flex: 1; min-width: 0;">
                                    <h3 id="chat-header-name" style="margin: 0; font-size: 15px; font-weight: 600; color: var(--color-text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Selecione um lead</h3>
                                    <div style="display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--color-text-mut); margin-top: 2px;">
                                        <span style="width: 8px; height: 8px; background-color: #22c55e; border-radius: 50%; display: inline-block;"></span>
                                        <span id="chat-header-status" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;"></span>
                                    </div>
                                </div>
                            </div>
                            <div class="desktop-bot-actions" id="desktop-bot-actions" style="display: flex; gap: 8px;">
                                <button class="btn-intervencao" id="btn-intervencao" style="font-size: 13px; padding: 6px 12px;">
                                    <i class="ph ph-user"></i> <span id="text-intervencao" class="desktop-only">Intervenção Humana</span>
                                </button>
                                <button class="btn-ativacao" id="btn-ativacao" style="font-size: 13px; padding: 6px 12px;">
                                    <i class="ph ph-robot"></i> <span id="text-ativacao" class="desktop-only">Ativar Agente</span>
                                </button>
                                <div class="bot-toggle-container mobile-only" style="display: none; margin-left: 8px;" title="Intervenção Humana (Liga/Desliga Robô)">
                                    <input type="checkbox" id="bot-switch" class="bot-switch-input" checked>
                                    <label for="bot-switch" class="bot-switch-label" style="transform: scale(0.8); transform-origin: right center;">
                                        <i class="ph ph-robot icon-bot"></i><i class="ph ph-user icon-user"></i><div class="bot-switch-ball"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Corpo do Chat -->
                        <div id="chat-messages-container" style="flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; min-height: 0;">
                        </div>

                        <!-- Rodape Chat -->
                        <div style="padding: 16px 24px; border-top: 1px solid var(--color-border); background-color: var(--color-bg-card); display: flex; align-items: center; gap: 12px; border-radius: 0 0 12px 12px;">
                            <div style="flex: 1; display: flex; align-items: center; background-color: var(--color-bg-main); border-radius: 24px; padding: 10px 16px;">
                                <i class="ph ph-smiley" style="font-size: 20px; color: var(--color-text-mut); margin-right: 12px; cursor: pointer;"></i>
                                <span class="typing-text" id="fake-typing-text" style="display: none;"></span>
                                <input type="text" id="real-chat-input" placeholder="Digite uma mensagem..." style="border: none; background: transparent; width: 100%; outline: none; font-size: 14px; color: var(--color-text-main);">
                            </div>
                            <button id="btn-send-message" class="btn btn--primary" style="width: 44px; height: 44px; border-radius: 50%; padding: 0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background-color: var(--color-primary); color: white; border: none; cursor: pointer;">
                                <i class="ph-fill ph-paper-plane-tilt" style="font-size: 20px;"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        \n`;

    content = content.substring(0, startIndex) + replacement + content.substring(endIndex); // Keep </main> because it was endIndex

    const jsOldClient = "if (msg.remetente.toLowerCase() === 'cliente') {\n                    html += `\n                    <div style=\"align-self: flex-start; display: flex; gap: 8px; max-width: 90%; margin-bottom: 8px;\">\n                        <div style=\"width: 28px; height: 28px; border-radius: 50%; background: var(--color-task-green-light); color: var(--color-task-green-text); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; flex-shrink: 0; margin-top: 4px; overflow: hidden;\">${avatarHtml}</div>\n                        <div class=\"msg-bubble-client\">\n                            <p style=\"margin: 0; font-size: 13px; color: #111; line-height: 1.35;\">${msg.conteudo}</p>\n                            <div style=\"text-align: right; margin-top: 2px; margin-bottom: -2px;\">\n                                <span style=\"font-size: 10px; color: #999;\">${timeStr}</span>\n                            </div>\n                        </div>\n                    </div>`;\n                } else if (msg.remetente.toLowerCase() === 'ia' || msg.remetente.toLowerCase() === 'humano') {\n                    html += `\n                    <div class=\"msg-bubble-ia\">\n                        <p style=\"margin: 0; font-size: 13px; color: #111; line-height: 1.35;\">${msg.conteudo}</p>\n                        <div style=\"text-align: right; margin-top: 2px; margin-bottom: -2px; display: flex; justify-content: flex-end; align-items: center; gap: 4px;\">\n                            <span style=\"font-size: 10px; color: #667781;\">${timeStr}</span>\n                            <i class=\"ph-fill ph-checks\" style=\"color: #53bdeb; font-size: 14px;\"></i>\n                        </div>\n                    </div>`;\n                }";

    const jsNewClient = "if (msg.remetente.toLowerCase() === 'cliente') {\n                    html += `\n                    <div style=\"display: flex; justify-content: flex-end; width: 100%; margin-bottom: 8px;\">\n                        <div style=\"background-color: #DCFCE7; color: #065F46; padding: 12px 16px; border-radius: 16px 16px 0 16px; max-width: 75%; position: relative; font-size: 14px; line-height: 1.5;\">\n                            ${msg.conteudo}\n                            <div style=\"display: flex; align-items: center; justify-content: flex-end; gap: 4px; margin-top: 4px; font-size: 10px; color: #16A34A;\">\n                                ${timeStr}\n                            </div>\n                        </div>\n                    </div>`;\n                } else if (msg.remetente.toLowerCase() === 'ia' || msg.remetente.toLowerCase() === 'humano') {\n                    const iaAvatarHtml = msg.remetente.toLowerCase() === 'ia' \n                        ? '<img src=\"robot.gif\" onerror=\"this.src=\\'robot.png\\'\" alt=\"Robot\" style=\"width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0; margin-top: auto; border: 1px solid var(--color-primary); background-color: white;\">'\n                        : '<div style=\"width: 40px; height: 40px; border-radius: 50%; background: #6b7280; color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; margin-top: auto;\"><i class=\"ph ph-user\"></i></div>';\n                    \n                    html += `\n                    <div style=\"display: flex; justify-content: flex-start; width: 100%; gap: 12px; margin-bottom: 8px;\">\n                        ${iaAvatarHtml}\n                        <div style=\"background-color: var(--color-bg-card); color: var(--color-text-main); padding: 12px 16px; border-radius: 16px 16px 16px 0; max-width: 75%; border: 1px solid var(--color-border); font-size: 14px; line-height: 1.5;\">\n                            ${msg.conteudo}\n                            <div style=\"text-align: right; margin-top: 4px; font-size: 10px; color: var(--color-text-mut); display: flex; justify-content: flex-end; align-items: center; gap: 4px;\">\n                                ${timeStr} <i class=\"ph-fill ph-checks\" style=\"color: #16A34A; font-size: 14px;\"></i>\n                            </div>\n                        </div>\n                    </div>`;\n                }";

    content = content.replace(jsOldClient, jsNewClient);
    
    const jsOldClient2 = "if (remetente === 'cliente') {\n                novoHtml = `\n                <div style=\"align-self: flex-start; display: flex; gap: 8px; max-width: 90%; margin-bottom: 8px;\">\n                    <div style=\"width: 28px; height: 28px; border-radius: 50%; background: var(--color-task-green-light); color: var(--color-task-green-text); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; flex-shrink: 0; margin-top: 4px; overflow: hidden;\">${avatarHtml}</div>\n                    <div class=\"msg-bubble-client\">\n                        <p style=\"margin: 0; font-size: 13px; color: #111; line-height: 1.35;\">${msg.conteudo}</p>\n                        <div style=\"text-align: right; margin-top: 2px; margin-bottom: -2px;\">\n                            <span style=\"font-size: 10px; color: #999;\">${timeStr}</span>\n                        </div>\n                    </div>\n                </div>`;\n            } else if (remetente === 'ia' || remetente === 'humano') {\n                novoHtml = `\n                <div class=\"msg-bubble-ia\">\n                    <p style=\"margin: 0; font-size: 13px; color: #111; line-height: 1.35;\">${msg.conteudo}</p>\n                    <div style=\"text-align: right; margin-top: 2px; margin-bottom: -2px; display: flex; justify-content: flex-end; align-items: center; gap: 4px;\">\n                        <span style=\"font-size: 10px; color: #667781;\">${timeStr}</span>\n                        <i class=\"ph-fill ph-checks\" style=\"color: #53bdeb; font-size: 14px;\"></i>\n                    </div>\n                </div>`;\n            }";

    const jsNewClient2 = "if (remetente === 'cliente') {\n                novoHtml = `\n                <div style=\"display: flex; justify-content: flex-end; width: 100%; margin-bottom: 8px;\">\n                    <div style=\"background-color: #DCFCE7; color: #065F46; padding: 12px 16px; border-radius: 16px 16px 0 16px; max-width: 75%; position: relative; font-size: 14px; line-height: 1.5;\">\n                        ${msg.conteudo}\n                        <div style=\"display: flex; align-items: center; justify-content: flex-end; gap: 4px; margin-top: 4px; font-size: 10px; color: #16A34A;\">\n                            ${timeStr}\n                        </div>\n                    </div>\n                </div>`;\n            } else if (remetente === 'ia' || remetente === 'humano') {\n                const iaAvatarHtml = remetente === 'ia' \n                    ? '<img src=\"robot.gif\" onerror=\"this.src=\\'robot.png\\'\" alt=\"Robot\" style=\"width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0; margin-top: auto; border: 1px solid var(--color-primary); background-color: white;\">'\n                    : '<div style=\"width: 40px; height: 40px; border-radius: 50%; background: #6b7280; color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; margin-top: auto;\"><i class=\"ph ph-user\"></i></div>';\n                \n                novoHtml = `\n                <div style=\"display: flex; justify-content: flex-start; width: 100%; gap: 12px; margin-bottom: 8px;\">\n                    ${iaAvatarHtml}\n                    <div style=\"background-color: var(--color-bg-card); color: var(--color-text-main); padding: 12px 16px; border-radius: 16px 16px 16px 0; max-width: 75%; border: 1px solid var(--color-border); font-size: 14px; line-height: 1.5;\">\n                        ${msg.conteudo}\n                        <div style=\"text-align: right; margin-top: 4px; font-size: 10px; color: var(--color-text-mut); display: flex; justify-content: flex-end; align-items: center; gap: 4px;\">\n                            ${timeStr} <i class=\"ph-fill ph-checks\" style=\"color: #16A34A; font-size: 14px;\"></i>\n                        </div>\n                    </div>\n                </div>`;\n            }";

    content = content.replace(jsOldClient2, jsNewClient2);
    
    const jsOldClient3 = "            container.innerHTML += `\n                <div class=\"msg-bubble-ia\" style=\"opacity: 0.7;\">\n                    <p style=\"margin: 0; font-size: 13px; color: #111; line-height: 1.35;\">${text}</p>\n                    <div style=\"text-align: right; margin-top: 2px; margin-bottom: -2px;\"><span style=\"font-size: 10px; color: #667781;\">Enviando...</span></div>\n                </div>`;";
                
    const jsNewClient3 = "            container.innerHTML += `\n                <div style=\"display: flex; justify-content: flex-start; width: 100%; gap: 12px; margin-bottom: 8px; opacity: 0.7;\">\n                    <div style=\"width: 40px; height: 40px; border-radius: 50%; background: #6b7280; color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; margin-top: auto;\"><i class=\"ph ph-user\"></i></div>\n                    <div style=\"background-color: var(--color-bg-card); color: var(--color-text-main); padding: 12px 16px; border-radius: 16px 16px 16px 0; max-width: 75%; border: 1px solid var(--color-border); font-size: 14px; line-height: 1.5;\">\n                        ${text}\n                        <div style=\"text-align: right; margin-top: 4px; font-size: 10px; color: var(--color-text-mut); display: flex; justify-content: flex-end; align-items: center; gap: 4px;\">\n                            Enviando...\n                        </div>\n                    </div>\n                </div>`;";

    content = content.replace(jsOldClient3, jsNewClient3);

    fs.writeFileSync('conversas.html', content);
    console.log('done');
} else {
    console.log('markers not found');
}
