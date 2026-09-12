const fs = require('fs');

const files = ['index.html', 'leads.html', 'tarefas.html', 'conversas.html', 'relatorios.html', 'configuracoes.html', 'notificacoes.html'];

const clockHTML = `<div class="mobile-clock-widget" style="padding: 12px 16px; border-bottom: 1px solid var(--color-border); display: none; align-items: center; gap: 12px; margin-bottom: 4px;">
                                <i class="ph ph-clock" style="font-size: 20px; color: var(--color-primary);"></i>
                                <div>
                                    <div id="mobile-clock-time" style="font-size: 14px; font-weight: 600; color: var(--color-text-main); line-height: 1.2;">00:00</div>
                                    <div id="mobile-clock-date" style="font-size: 11px; color: var(--color-text-mut); margin-top: 2px;">Carregando...</div>
                                </div>
                            </div>`;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    // Evita duplicar
    if (content.includes('mobile-clock-widget')) {
        content = content.replace(/<div class="mobile-clock-widget"[\s\S]*?<\/div>\s*<\/div>/, '');
    }
    
    content = content.replace('<div class="user-dropdown" id="user-dropdown">', '<div class="user-dropdown" id="user-dropdown">\n                            ' + clockHTML);
    fs.writeFileSync(f, content, 'utf8');
});
