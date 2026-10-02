const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

// 1. Add filter icon
const searchHTML = `<div class="search-input" style="width: 100%;">
                            <i class="ph ph-magnifying-glass"></i>
                            <input type="text" placeholder="Buscar conversa...">
                        </div>`;
const newSearchHTML = `<div style="display: flex; gap: 8px; width: 100%;">
                            <div class="search-input" style="flex: 1;">
                                <i class="ph ph-magnifying-glass"></i>
                                <input type="text" id="chat-search-input" placeholder="Buscar conversa...">
                            </div>
                            <button id="btn-filter-active" style="padding: 0 12px; border: 1px solid var(--color-border); background: var(--color-bg-main); color: var(--color-text-sec); border-radius: 8px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center;" title="Filtrar conversas ativas agora">
                                <i class="ph ph-funnel" id="icon-filter-active" style="font-size: 16px;"></i>
                            </button>
                        </div>`;
html = html.replace(searchHTML, newSearchHTML);

// 2. Add realtime logic and filter logic in initConversations
const initRegex = /const container = document\.getElementById\('contact-list-container'\);/;
const initNew = `const container = document.getElementById('contact-list-container');
            window.activeLeadsFilter = false;
            window.localLeadsData = leads; // Store globally for filter
            
            // Listen to all new messages globally to update the green dot in realtime
            if (window.dbAPI.subscribeToAllMessages && !window.globalMessagesChannel) {
                window.globalMessagesChannel = window.dbAPI.subscribeToAllMessages((msg) => {
                    const leadId = msg.lead_id;
                    const lead = window.localLeadsData.find(l => l.id === leadId);
                    if (lead) {
                        lead.ultima_interacao = msg.criado_em;
                        const dot = document.getElementById('status-dot-' + leadId);
                        if (dot) {
                            dot.style.backgroundColor = '#22c55e'; // Green
                            dot.style.animation = 'pulse-green 2s infinite';
                            dot.title = 'Conversa ativa agora';
                            dot.parentElement.setAttribute('data-active-now', 'true');
                        }
                    }
                });
            }
`;
html = html.replace(initRegex, initNew);

// 3. Render the dots
const renderRegex = /const avatarStyle = lead\.foto_perfil \? 'background: transparent;' : 'background: var\(--color-primary\); color: white; font-weight: bold;';/;
const renderNew = `const avatarStyle = lead.foto_perfil ? 'background: transparent;' : 'background: var(--color-primary); color: white; font-weight: bold;';
                
                // Realtime Dot Logic
                let isActiveNow = false;
                if (lead.ultima_interacao) {
                    const lastMsgDate = new Date(lead.ultima_interacao);
                    const now = new Date();
                    const diffMinutes = (now - lastMsgDate) / (1000 * 60);
                    if (diffMinutes <= 5) isActiveNow = true;
                }
                const dotColor = isActiveNow ? '#22c55e' : '#ef4444';
                const dotAnim = isActiveNow ? 'pulse-green 2s infinite' : 'none';
                const dotTitle = isActiveNow ? 'Conversa ativa agora' : 'Conversa inativa';
`;
html = html.replace(renderRegex, renderNew);

const htmlRegex = /<div style="flex: 1;">\s*<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">\s*<strong style="font-size: 14px;">\$\{safeNome\}<\/strong>\s*<span style="font-size: 11px; color: var\(--color-text-mut\);">\$\{timeStr\}<\/span>\s*<\/div>/;
const htmlNew = `<div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <strong style="font-size: 14px;">\${safeNome}</strong>
                                <div id="status-dot-\${lead.id}" title="\${dotTitle}" style="width: 8px; height: 8px; border-radius: 50%; background-color: \${dotColor}; animation: \${dotAnim}; flex-shrink: 0;"></div>
                            </div>
                            <span style="font-size: 11px; color: var(--color-text-mut);">\${timeStr}</span>
                        </div>`;
html = html.replace(htmlRegex, htmlNew);

const classRegex = /div\.className = 'chat-contact-item';/;
const classNew = `div.className = 'chat-contact-item';
                div.setAttribute('data-active-now', isActiveNow ? 'true' : 'false');
                div.setAttribute('data-lead-name', safeNome.toLowerCase());`;
html = html.replace(classRegex, classNew);

// 4. Add filter event listener outside the loop
const btnRegex = /\/\/ Configurar botões de envio/;
const btnNew = `// Configurar Filtro Ativos
            const btnFilterActive = document.getElementById('btn-filter-active');
            const iconFilterActive = document.getElementById('icon-filter-active');
            const searchInput = document.getElementById('chat-search-input');

            function applyFilters() {
                const term = searchInput ? searchInput.value.toLowerCase() : '';
                const items = document.querySelectorAll('.chat-contact-item');
                items.forEach(item => {
                    const name = item.getAttribute('data-lead-name') || '';
                    const isActive = item.getAttribute('data-active-now') === 'true';
                    let show = name.includes(term);
                    if (window.activeLeadsFilter && !isActive) show = false;
                    item.style.display = show ? 'flex' : 'none';
                });
            }

            if (btnFilterActive) {
                btnFilterActive.onclick = () => {
                    window.activeLeadsFilter = !window.activeLeadsFilter;
                    if (window.activeLeadsFilter) {
                        btnFilterActive.style.backgroundColor = 'var(--color-primary)';
                        btnFilterActive.style.color = 'white';
                    } else {
                        btnFilterActive.style.backgroundColor = 'var(--color-bg-main)';
                        btnFilterActive.style.color = 'var(--color-text-sec)';
                    }
                    applyFilters();
                };
            }
            if (searchInput) {
                searchInput.addEventListener('input', applyFilters);
            }

            // Configurar botões de envio`;
html = html.replace(btnRegex, btnNew);

// 5. Add Keyframes to CSS in conversas.html if it doesn't exist
if (!html.includes('@keyframes pulse-green')) {
    html = html.replace('</style>', `
    @keyframes pulse-green {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
        70% { transform: scale(1); box-shadow: 0 0 0 4px rgba(34, 197, 94, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
    }
</style>`);
}

fs.writeFileSync('conversas.html', html);
