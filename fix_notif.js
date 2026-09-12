const fs = require('fs');
const files = ['leads.html', 'tarefas.html', 'conversas.html', 'relatorios.html', 'configuracoes.html', 'notificacoes.html'];

const emptyNotif = `<div class="notif-list" id="notif-list">
                                <div style="padding: 20px; text-align: center; color: var(--color-text-mut); font-size: 13px;">Nenhuma notificação.</div>
                            </div>
                            <div class="notif-footer">`;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    const regex = /<div class="notif-list"( id="notif-list")?>[\s\S]*?<div class="notif-footer">/;
    content = content.replace(regex, emptyNotif);
    fs.writeFileSync(f, content, 'utf8');
});
