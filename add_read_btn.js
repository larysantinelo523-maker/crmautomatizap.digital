const fs = require('fs');
const files = ['index.html', 'leads.html', 'tarefas.html', 'conversas.html', 'relatorios.html', 'configuracoes.html', 'notificacoes.html'];

const standardHeader = `<div class="notif-header" style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid var(--color-border);">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <h4 style="margin: 0; font-size: 16px; font-weight: 600;">Notificações</h4>
                                    <span class="badge primary-light" id="notif-badge" style="display: none; padding: 2px 8px; border-radius: 12px; font-size: 11px;"></span>
                                </div>
                                <button id="btn-read-all" style="background: none; border: none; font-size: 12px; color: var(--color-primary); cursor: pointer; display: none;">Marcar lidas</button>
                            </div>`;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    const regex = /<div class="notif-header">[\s\S]*?<\/div>/;
    content = content.replace(regex, standardHeader);
    fs.writeFileSync(f, content, 'utf8');
});
