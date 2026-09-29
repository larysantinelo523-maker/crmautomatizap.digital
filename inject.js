const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

const htmlTarget = `<div class="user-menu" id="user-menu-btn">`;
const htmlReplacement = `                    <div class="notification-wrapper" id="notification-wrapper">
                        <button class="notification-btn" id="notification-btn">
                            <i class="ph ph-bell"></i>
                            <span class="notification-dot" style="display: block;"></span>
                        </button>

                        <div class="notification-dropdown" id="notification-dropdown">
                            <div class="notif-header" style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid var(--color-border);">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <h4 style="margin: 0; font-size: 16px; font-weight: 600;">Notificacoes</h4>
                                    <span class="badge primary-light" id="notif-badge" style="display: inline-flex; padding: 2px 8px; border-radius: 12px; font-size: 11px;">2</span>
                                </div>
                                <button id="btn-read-all" style="background: none; border: none; font-size: 12px; color: var(--color-primary); cursor: pointer; display: block;">Marcar lidas</button>
                            </div>
                            <div class="notif-list" id="notif-list">
                                <div class="notif-item unread" style="padding: 16px; border-bottom: 1px solid var(--color-border); cursor: pointer; transition: 0.2s;" onclick="openConfiguracoes({ id: 'mock-id-geremias', nome: 'SEU GEREMIAS', plano: 'Pago', status: 'Ativo', total_leads: 2, reunioes: 1, email: 'geremias@gmail.com', location: 'Rua dom joao padre nobrega 127', segment: 'Barbearia', desc: 'barbearia que cuida da parte estetica do homem', price: 'R$ 0,01', created: '20/09/2026', vencimento: '10/09/2036' })">
                                    <div style="display: flex; gap: 12px;">
                                        <div style="width: 32px; height: 32px; border-radius: 50%; background-color: var(--color-warning-light); color: #B45309; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">
                                            <i class="ph ph-warning-circle"></i>
                                        </div>
                                        <div style="flex: 1;">
                                            <p style="margin: 0; font-size: 13.5px; color: var(--color-text-main); font-weight: 500; line-height: 1.3;">Correcao de Agente - SEU GEREMIAS</p>
                                            <p style="margin: 4px 0 0; font-size: 12px; color: var(--color-text-sec); line-height: 1.4;">O usuario solicitou uma correcao: O agente respondeu algo errado.</p>
                                            <span style="display: block; margin-top: 6px; font-size: 11px; color: var(--color-text-mut);">Agora mesmo</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="notif-item unread" style="padding: 16px; border-bottom: 1px solid var(--color-border); cursor: pointer; transition: 0.2s;">
                                    <div style="display: flex; gap: 12px;">
                                        <div style="width: 32px; height: 32px; border-radius: 50%; background-color: var(--color-task-green-light); color: var(--color-task-green-text); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">
                                            <i class="ph ph-currency-dollar"></i>
                                        </div>
                                        <div style="flex: 1;">
                                            <p style="margin: 0; font-size: 13.5px; color: var(--color-text-main); font-weight: 500; line-height: 1.3;">Pagamento Processado</p>
                                            <p style="margin: 4px 0 0; font-size: 12px; color: var(--color-text-sec); line-height: 1.4;">A assinatura de Lary Santinelo foi renovada com sucesso.</p>
                                            <span style="display: block; margin-top: 6px; font-size: 11px; color: var(--color-text-mut);">Ha 2 horas</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="notif-footer" style="padding: 12px; text-align: center; border-top: 1px solid var(--color-border); background: #F9FAFB;">
                                <a href="#" style="font-size: 13px; font-weight: 500; color: var(--color-primary); text-decoration: none;">Ver todas</a>
                            </div>
                        </div>
                    </div>

                    <div class="user-menu" id="user-menu-btn">`;
html = html.replace(htmlTarget, htmlReplacement);
fs.writeFileSync('admin.html', html);

let js = fs.readFileSync('admin.js', 'utf8');
const jsTarget1 = `    // Dropdown do perfil
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        document.addEventListener('click', function (e) {
            if (!userMenuBtn.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }`;
const jsReplacement1 = `    // Dropdown do perfil e notificacao
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    const notifBtn = document.getElementById('notification-btn');
    const notifDropdown = document.getElementById('notification-dropdown');

    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (notifDropdown) notifDropdown.classList.remove('show');
            userDropdown.classList.toggle('show');
        });
    }

    if (notifBtn && notifDropdown) {
        notifBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (userDropdown) userDropdown.classList.remove('show');
            notifDropdown.classList.toggle('show');
        });
    }

    document.addEventListener('click', function (e) {
        if (userMenuBtn && !userMenuBtn.contains(e.target) && userDropdown) {
            userDropdown.classList.remove('show');
        }
        if (notifBtn && !notifBtn.contains(e.target) && notifDropdown && !notifDropdown.contains(e.target)) {
            notifDropdown.classList.remove('show');
        }
    });`;

js = js.replace(jsTarget1, jsReplacement1);
fs.writeFileSync('admin.js', js);
console.log("Done");
