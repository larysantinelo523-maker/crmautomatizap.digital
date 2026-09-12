const fs = require('fs');
const files = ['index.html', 'leads.html', 'tarefas.html', 'conversas.html', 'relatorios.html', 'configuracoes.html'];
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/<a href="#">Ver todas<\/a>/g, '<a href="notificacoes.html">Ver todas</a>');
    fs.writeFileSync(f, content, 'utf8');
});

// Criando notificacoes.html
let notif = fs.readFileSync('tarefas.html', 'utf8');
notif = notif.replace(/<main class="main-content">[\s\S]*<\/main>/, `<main class="main-content">
    <header class="page-header">
        <div class="header-left">
            <button class="mobile-menu-btn" id="mobile-menu-btn"><i class="ph ph-list"></i></button>
            <h2>Notificações</h2>
        </div>
    </header>
    <div class="content-wrapper">
        <div class="card" style="max-width: 800px; margin: 0 auto;">
            <div class="card-header">
                <h3>Todas as Notificações</h3>
            </div>
            <div class="card-body" id="notif-page-list" style="padding: 0;">
                <div style="padding: 32px; text-align: center; color: var(--color-text-mut);">Nenhuma notificação.</div>
            </div>
        </div>
    </div>
</main>`);
notif = notif.replace(/<title>.*?<\/title>/, '<title>Notificações - AutomatiZAP</title>');
notif = notif.replace(/<a href="tarefas.html" class="nav-item active">/, '<a href="tarefas.html" class="nav-item">'); // remover active do menu de tarefas

fs.writeFileSync('notificacoes.html', notif, 'utf8');
