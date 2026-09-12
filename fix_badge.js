const fs = require('fs');
const files = ['index.html', 'leads.html', 'tarefas.html', 'conversas.html', 'relatorios.html', 'configuracoes.html', 'notificacoes.html'];

const standardHeader = `<div class="notif-header">
                                <h4>Notificações</h4>
                                <span class="badge primary-light" id="notif-badge" style="display: none;"></span>
                            </div>`;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    const regex = /<div class="notif-header">[\s\S]*?<\/div>/;
    content = content.replace(regex, standardHeader);
    fs.writeFileSync(f, content, 'utf8');
});
