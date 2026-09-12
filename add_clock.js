const fs = require('fs');

const files = ['index.html', 'leads.html', 'tarefas.html', 'conversas.html', 'relatorios.html', 'configuracoes.html', 'notificacoes.html'];

const clockHTML = `                <div class="sidebar-clock" id="sidebar-clock" style="margin-bottom: 12px; padding: 12px; background: var(--color-bg-main); border-radius: 8px; border: 1px solid var(--color-border); display: flex; align-items: center; gap: 12px;">
                    <i class="ph ph-clock" style="font-size: 20px; color: var(--color-primary);"></i>
                    <div>
                        <div id="clock-time" style="font-size: 15px; font-weight: 600; color: var(--color-text-main); line-height: 1.2;">00:00</div>
                        <div id="clock-date" style="font-size: 11px; color: var(--color-text-mut); margin-top: 2px;">Carregando...</div>
                    </div>
                </div>
                <div class="system-status">`;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    // Remove if already exists to be idempotent
    content = content.replace(/<div class="sidebar-clock"[\s\S]*?<\/div>\s*<div class="system-status">/, '<div class="system-status">');
    // Inject
    content = content.replace('<div class="system-status">', clockHTML);
    fs.writeFileSync(f, content, 'utf8');
});
