const fs = require('fs');
let js = fs.readFileSync('admin.js', 'utf8');

// Find the start of `async function loadAdminNotifications()`
const startStr = 'async function loadAdminNotifications() {';
const startIdx = js.indexOf(startStr);

if (startIdx > -1) {
    // Keep everything before the function
    const jsBefore = js.substring(0, startIdx);
    
    // Create the correct function
    const newFunc = `async function loadAdminNotifications() {
    const listEl = document.getElementById('notif-list');
    const badgeEl = document.getElementById('notif-badge');
    const notifDot = document.querySelector('.notification-dot');
    if (!listEl) return;

    let notifications = [];

    // 1. Puxar "Pagamento Processado"
    globalTenants.forEach(t => {
        if (t.status === 'pago' && t.vencimento && t.vencimento !== 'N/A') {
            const dtVenc = new Date(t.vencimento.split('T')[0]);
            dtVenc.setMonth(dtVenc.getMonth() - 1);
            if (dtVenc > new Date()) dtVenc.setFullYear(dtVenc.getFullYear() - 1); // safety
            
            // Format mensalidade
            let valorNum = parseFloat(t.mensalidade);
            let valor = t.mensalidade ? (isNaN(valorNum) ? t.mensalidade : 'R$ ' + valorNum.toFixed(2).replace('.', ',')) : 'seu plano';
            
            notifications.push({
                type: 'payment',
                date: dtVenc,
                title: 'Pagamento Processado',
                message: \`A assinatura de \${t.nome} no valor de \${valor} foi renovada com sucesso!\`,
                tenantId: t.id_empresa,
                tenantObj: t
            });
        }
    });

    // 2. Puxar "Correção de Agente"
    try {
        const { data: reportes, error } = await supabase.from('reportes_agente').select('*').order('criado_em', { ascending: false }).limit(30);
        if (!error && reportes) {
            reportes.forEach(r => {
                const t = globalTenants.find(ten => ten.id_empresa === r.id_empresa);
                if (t) {
                    notifications.push({
                        type: 'correction',
                        date: new Date(r.criado_em),
                        title: \`Correção de Agente - \${t.nome}\`,
                        message: \`O usuário solicitou uma correção: \${r.motivo_principal || 'Outros'}\`,
                        tenantId: t.id_empresa,
                        tenantObj: t
                    });
                }
            });
        }
    } catch(e) { console.error(e); }

    notifications.sort((a, b) => b.date - a.date);
    notifications = notifications.slice(0, 30);

    if (notifications.length === 0) {
        listEl.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--color-text-mut); font-size: 13px;">Nenhuma notificação.</div>';
        if (badgeEl) badgeEl.style.display = 'none';
        if (notifDot) notifDot.style.display = 'none';
        return;
    }

    if (badgeEl) {
        badgeEl.textContent = notifications.length;
        badgeEl.style.display = 'inline-flex';
    }
    if (notifDot) {
        notifDot.style.display = 'block';
    }

    listEl.innerHTML = '';
    
    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return "Agora mesmo";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return \`Há \${minutes} minuto\${minutes > 1 ? 's' : ''}\`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return \`Há \${hours} hora\${hours > 1 ? 's' : ''}\`;
        const days = Math.floor(hours / 24);
        return \`Há \${days} dia\${days > 1 ? 's' : ''}\`;
    };

    notifications.forEach(n => {
        const item = document.createElement('div');
        item.className = 'notif-item unread';
        item.style.cssText = 'padding: 16px; border-bottom: 1px solid var(--color-border); cursor: pointer; transition: 0.2s;';
        
        let iconHtml = '';
        if (n.type === 'payment') {
            iconHtml = \`
                <div style="width: 32px; height: 32px; border-radius: 50%; background-color: var(--color-task-green-light); color: var(--color-task-green-text); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">
                    <i class="ph ph-currency-dollar"></i>
                </div>
            \`;
        } else {
            iconHtml = \`
                <div style="width: 32px; height: 32px; border-radius: 50%; background-color: var(--color-warning-light); color: #B45309; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">
                    <i class="ph ph-warning-circle"></i>
                </div>
            \`;
        }

        item.innerHTML = \`
            <div style="display: flex; gap: 12px;">
                \${iconHtml}
                <div style="flex: 1;">
                    <p style="margin: 0; font-size: 13.5px; color: var(--color-text-main); font-weight: 500; line-height: 1.3;">\${n.title}</p>
                    <p style="margin: 4px 0 0; font-size: 12px; color: var(--color-text-sec); line-height: 1.4;">\${n.message}</p>
                    <span style="display: block; margin-top: 6px; font-size: 11px; color: var(--color-text-mut);">\${timeAgo(n.date)}</span>
                </div>
            </div>
        \`;
        
        item.addEventListener('click', () => {
            if (typeof openConfiguracoes === 'function' && n.tenantObj) {
                openConfiguracoes(n.tenantObj);
            }
            // Remove dropdown and click
            const drop = document.getElementById('notification-dropdown');
            if (drop) drop.classList.remove('show');
        });
        
        listEl.appendChild(item);
    });
}
`;
    
    fs.writeFileSync('admin.js', jsBefore + newFunc);
    console.log('Fixed admin.js successfully');
} else {
    console.log('Could not find loadAdminNotifications in admin.js');
}
