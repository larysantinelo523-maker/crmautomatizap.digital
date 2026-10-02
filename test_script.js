
        let currentLeadId = null;
        let realtimeChannel = null; // canal de realtime ativo

        window.initConversations = async function() {
            if(!window.dbAPI) return;
            const leads = await window.dbAPI.fetchLeads();
            const container = document.getElementById('contact-list-container');
            container.innerHTML = '';

            if(leads.length === 0) {
                container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--color-text-mut);">Nenhum lead encontrado.</div>';
                return;
            }

            // Verifica se tem parâmetro na URL
            const urlParams = new URLSearchParams(window.location.search);
            const leadParam = urlParams.get('lead');

            leads.forEach((lead, index) => {
                const date = new Date(lead.criado_em);
                const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                const safeNome = lead.nome || 'Desconhecido'; const initials = safeNome.charAt(0).toUpperCase();
                const avatarContent = lead.foto_perfil ? `<img src="${lead.foto_perfil}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : initials;
                const avatarStyle = lead.foto_perfil ? 'background: transparent;' : 'background: var(--color-primary); color: white; font-weight: bold;';

                const div = document.createElement('div');
                div.className = 'chat-contact-item';
                div.style = 'padding: 10px 16px; border-bottom: 1px solid var(--color-border); display: flex; gap: 12px; align-items: center; cursor: pointer; transition: background 0.2s;';
                div.innerHTML = `
                    <div class="avatar-placeholder" style="${avatarStyle} width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden;">${avatarContent}</div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <strong style="font-size: 14px;">${safeNome}</strong>
                            <span style="font-size: 11px; color: var(--color-text-mut);">${timeStr}</span>
                        </div>
                        <p style="font-size: 13px; color: var(--color-text-sec); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">Clique para ver as mensagens</p>
                    </div>
                `;
                
                div.onclick = () => {
                    document.querySelectorAll('.chat-contact-item').forEach(el => el.style.background = 'transparent');
                    div.style.background = 'var(--color-bg-main)';
                    carregarMensagens(lead);
                };

                container.appendChild(div);

                // Auto-selecionar o lead passado por parâmetro ou o primeiro
                if((leadParam && lead.id === leadParam) || (!leadParam && index === 0)) {
                    div.click();
                }
            });

            // Configurar botões de envio
            const btnSend = document.getElementById('btn-send-message');
            if(btnSend) btnSend.onclick = enviarMensagemDigitada;
            document.querySelectorAll('.btn-send-enter').forEach(btn => btn.onclick = enviarMensagemDigitada);
            
            // Permitir envio via teclado do dispositivo (clicando no botão enviar)
            // O teclado simulado iOS usa os botões do teclado fake

            // Configurar chave seletora e botões desktop
            const toggles = document.querySelectorAll('.bot-switch-input');
            const btnIntervencao = document.getElementById('btn-intervencao');
            const btnAtivacao = document.getElementById('btn-ativacao');
            
            async function toggleBotLogic(newState) {
                if(currentLeadId) {
                    const toggles = document.querySelectorAll('.bot-switch-input');
                    toggles.forEach(t => t.checked = newState);
                    await window.dbAPI.toggleBotState(currentLeadId, newState);
                    const updatedLead = await window.dbAPI.fetchLeadById(currentLeadId);
                    if (updatedLead) {
                        carregarMensagens(updatedLead);
                    }
                } else {
                    alert('Selecione uma conversa primeiro para alterar o status do agente.');
                }
            }

            toggles.forEach(toggle => { toggle.addEventListener('change', function() { toggleBotLogic(this.checked); }); });
            if(btnIntervencao) {
                btnIntervencao.addEventListener('click', function() {
                    toggleBotLogic(false);
                });
            }
            if(btnAtivacao) {
                btnAtivacao.addEventListener('click', function() {
                    toggleBotLogic(true);
                });
            }
        };

        async function carregarMensagens(lead) {
            currentLeadId = lead.id;
            const container = document.getElementById('chat-messages-container');
            container.innerHTML = '<div style="text-align: center; padding: 20px;">Carregando...</div>';

            // Atualiza cabeçalho do celular
            document.getElementById('chat-header-name').innerText = lead.nome || 'Desconhecido';
            document.getElementById('chat-header-status').innerText = lead.status;
            const avatar = document.getElementById('chat-header-avatar');
            if (lead.foto_perfil) {
                avatar.innerHTML = `<img src="${lead.foto_perfil}" alt="Foto" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                avatar.style.background = 'transparent';
            } else {
                avatar.innerText = (lead.nome || 'Desconhecido').charAt(0).toUpperCase();
                avatar.style.background = 'var(--color-primary)';
            }

            const mensagens = await window.dbAPI.fetchConversations(lead.id);
            container.innerHTML = '';
            
            if(mensagens.length === 0) {
                container.innerHTML = '<div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">Nenhuma mensagem ainda. Envie a primeira!</div>';
            }

            // O status do agente agora vem diretamente da coluna status_agente na tabela leads
            let isBotActive = true;
            if (lead.status_agente === 'desativado') {
                isBotActive = false;
            }
            }
            const toggles = document.querySelectorAll('.bot-switch-input');
            toggles.forEach(t => t.checked = isBotActive);
            
            const btnIntervencao = document.getElementById('btn-intervencao');
            const btnAtivacao = document.getElementById('btn-ativacao');
            const textAtivacao = document.getElementById('text-ativacao');
            
            if (isBotActive) {
                // Bot is active -> Ativação state is active
                if(btnIntervencao) { btnIntervencao.classList.add('inactive'); btnIntervencao.classList.remove('active'); }
                if(btnAtivacao) { 
                    btnAtivacao.classList.add('active'); btnAtivacao.classList.remove('inactive'); 
                    if(textAtivacao) textAtivacao.innerText = 'Agente Ativado';
                }
            } else {
                // Human is active -> Intervenção state is active
                if(btnIntervencao) { btnIntervencao.classList.add('active'); btnIntervencao.classList.remove('inactive'); }
                if(btnAtivacao) { 
                    btnAtivacao.classList.add('inactive'); btnAtivacao.classList.remove('active'); 
                    if(textAtivacao) textAtivacao.innerText = 'Ativar Agente';
                }
            }

            let html = '';
            const initials = lead.nome.substring(0, 2).toUpperCase();
            const avatarHtml = lead.foto_perfil 
                ? `<img src="${lead.foto_perfil}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
                : initials;

            mensagens.forEach(msg => {
                const date = new Date(msg.criado_em);
                const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                if (msg.remetente.toLowerCase() === 'cliente') {
                    html += `
                    <div style="align-self: flex-start; display: flex; gap: 8px; max-width: 90%; margin-bottom: 8px;">
                        <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--color-task-green-light); color: var(--color-task-green-text); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; flex-shrink: 0; margin-top: 4px; overflow: hidden;">${avatarHtml}</div>
                        <div class="msg-bubble-client">
                            <p style="margin: 0; font-size: 13px; color: #111; line-height: 1.35;">${msg.conteudo}</p>
                            <div style="text-align: right; margin-top: 2px; margin-bottom: -2px;">
                                <span style="font-size: 10px; color: #999;">${timeStr}</span>
                            </div>
                        </div>
                    </div>`;
                } else if (msg.remetente.toLowerCase() === 'ia' || msg.remetente.toLowerCase() === 'humano') {
                    html += `
                    <div class="msg-bubble-ia">
                        <p style="margin: 0; font-size: 13px; color: #111; line-height: 1.35;">${msg.conteudo}</p>
                        <div style="text-align: right; margin-top: 2px; margin-bottom: -2px; display: flex; justify-content: flex-end; align-items: center; gap: 4px;">
                            <span style="font-size: 10px; color: #667781;">${timeStr}</span>
                            <i class="ph-fill ph-checks" style="color: #53bdeb; font-size: 14px;"></i>
                        </div>
                    </div>`;
                }
            });
            
            // Adiciona a mensagem de sistema UMA ÚNICA VEZ no final, apenas se o bot estiver pausado
            if (isBotActive === false) {
                html += `<div style="align-self: center; background: #fef08a; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; color: #854d0e; margin-bottom: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); z-index: 2; border: 1px solid #fde047;">⚠️ Agente pausado</div>`;
            }
            
            container.innerHTML += html;
            // Scroll to bottom
            container.scrollTop = container.scrollHeight;

            // --- REALTIME: cancela assinatura anterior e inicia nova ---
            if (window.dbAPI.unsubscribeFromMessages && realtimeChannel) {
                window.dbAPI.unsubscribeFromMessages(realtimeChannel);
                realtimeChannel = null;
            }
            if (window.dbAPI.subscribeToMessages) {
                realtimeChannel = window.dbAPI.subscribeToMessages(lead.id, (novaMensagem) => {
                    adicionarMensagemNaTela(novaMensagem, lead);
                });
            }
        }

        function adicionarMensagemNaTela(msg, lead) {
            const container = document.getElementById('chat-messages-container');
            if (!container) return;

            // Remove aviso de "nenhuma mensagem" se existir
            const emptyMsg = container.querySelector('[data-empty]');
            if (emptyMsg) emptyMsg.remove();

            const initials = lead.nome.substring(0, 2).toUpperCase();
            const avatarHtml = lead.foto_perfil 
                ? `<img src="${lead.foto_perfil}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
                : initials;

            const date = new Date(msg.criado_em);
            const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const remetente = (msg.remetente || '').toLowerCase();

            let novoHtml = '';
            if (remetente === 'cliente') {
                novoHtml = `
                <div style="align-self: flex-start; display: flex; gap: 8px; max-width: 90%; margin-bottom: 8px;">
                    <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--color-task-green-light); color: var(--color-task-green-text); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; flex-shrink: 0; margin-top: 4px; overflow: hidden;">${avatarHtml}</div>
                    <div class="msg-bubble-client">
                        <p style="margin: 0; font-size: 13px; color: #111; line-height: 1.35;">${msg.conteudo}</p>
                        <div style="text-align: right; margin-top: 2px; margin-bottom: -2px;">
                            <span style="font-size: 10px; color: #999;">${timeStr}</span>
                        </div>
                    </div>
                </div>`;
            } else if (remetente === 'ia' || remetente === 'humano') {
                novoHtml = `
                <div class="msg-bubble-ia">
                    <p style="margin: 0; font-size: 13px; color: #111; line-height: 1.35;">${msg.conteudo}</p>
                    <div style="text-align: right; margin-top: 2px; margin-bottom: -2px; display: flex; justify-content: flex-end; align-items: center; gap: 4px;">
                        <span style="font-size: 10px; color: #667781;">${timeStr}</span>
                        <i class="ph-fill ph-checks" style="color: #53bdeb; font-size: 14px;"></i>
                    </div>
                </div>`;
            }

            if (novoHtml) {
                container.insertAdjacentHTML('beforeend', novoHtml);
                container.scrollTop = container.scrollHeight;
            }
        }

        async function enviarMensagemDigitada() {
            if(!currentLeadId) return;
            const typingSpan = document.getElementById('fake-typing-text');
            const realInput = document.getElementById('real-chat-input');
            const text = typingSpan && typingSpan.textContent.trim() !== '' ? typingSpan.textContent.trim() : (realInput ? realInput.value.trim() : '');
            if(!text) return;

            // Limpa o campo
            if(typingSpan) typingSpan.textContent = '';
            if(realInput) realInput.value = '';
            const placeholder = document.getElementById('fake-placeholder');
            if(placeholder) placeholder.style.display = 'inline';
            
            // Mostra otimisticamente
            const container = document.getElementById('chat-messages-container');
            const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            container.innerHTML += `
                <div class="msg-bubble-ia" style="opacity: 0.7;">
                    <p style="margin: 0; font-size: 13px; color: #111; line-height: 1.35;">${text}</p>
                    <div style="text-align: right; margin-top: 2px; margin-bottom: -2px;"><span style="font-size: 10px; color: #667781;">Enviando...</span></div>
                </div>`;
            container.scrollTop = container.scrollHeight;

            await window.dbAPI.sendMessage(currentLeadId, text);
            // Recarrega do banco pra garantir
            carregarMensagens({ id: currentLeadId, nome: document.getElementById('chat-header-name').innerText, status: '' });
        }

        // Envio via Enter no desktop
        const realInputBox = document.getElementById('real-chat-input');
        if (realInputBox) {
            realInputBox.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    enviarMensagemDigitada();
                }
            });
        }
        
        // Inicializa se tiver lead pre-selecionado (pode vir de outra página)
        if (currentLeadId) {
            carregarMensagens({ id: currentLeadId, nome: document.getElementById('chat-header-name').innerText, status: '' });
        }

        // Evento para abrir dossiê
        const btnLeadInfo = document.getElementById('btn-lead-info');
        if (btnLeadInfo) {
            btnLeadInfo.addEventListener('click', () => {
                if (currentLeadId) {
                    window.location.href = `index.html?openLead=${currentLeadId}`;
                }
            });
        }
    </script>
    <script type="module" src="tutorial.js"></script>
    <script type="module" src="script.js?v=1.4">