const fs = require('fs');

const files = ['index.html', 'leads.html', 'tarefas.html', 'conversas.html', 'relatorios.html', 'configuracoes.html', 'notificacoes.html'];

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    const regex = /<div class="system-status">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
    
    content = content.replace(regex, '');
    fs.writeFileSync(f, content, 'utf8');
});
