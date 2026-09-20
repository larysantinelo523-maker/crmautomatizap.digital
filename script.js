// --- Verificação de Autenticação Global ---
import { fetchUserData } from './data.js';

window.getBrasiliaDate = function() {
    const str = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    return new Date(str);
};

// --- Recarregamento Automático à Meia-Noite ---
function scheduleMidnightReload() {
    const now = window.getBrasiliaDate();
    const tomorrow = window.getBrasiliaDate();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 2, 0); // Meia-noite e 2 segundos
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
        window.location.reload();
    }, msUntilMidnight);
}
scheduleMidnightReload();
// ---------------------------------------------

window.parseExactDate = function(baseDateStr) {
    if (!baseDateStr || baseDateStr === 'N/A') return null;
    const parts = baseDateStr.split('-');
    if (parts.length !== 3) return null;
    let year = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1; // 0-11
    let day = parseInt(parts[2], 10);
    return new Date(year, month, day, 0, 0, 0, 0);
};

window.calculateNextDueDate = function(baseDateStr) {
    if (!baseDateStr || baseDateStr === 'N/A') return null;
    const parts = baseDateStr.split('-');
    if (parts.length !== 3) return null;
    let year = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1; // 0-11
    let day = parseInt(parts[2], 10);
    
    let targetMonth = month + 1;
    let targetYear = year;
    if (targetMonth > 11) {
        targetMonth = 0;
        targetYear++;
    }
    
    // Pega o maximo de dias do mes alvo para evitar overflow (ex: 31 Jan -> 28 Fev)
    let maxDaysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    let targetDay = Math.min(day, maxDaysInTargetMonth);
    
    return new Date(targetYear, targetMonth, targetDay, 0, 0, 0, 0);
};

window.simulatePaymentAndUnlock = async function(userId) {
    // Para simular o Mercado Pago webhook: Avança a data +1 mes no banco
    if (!window.tenantVencDateStr) return;
    
    const nextDate = window.calculateNextDueDate(window.tenantVencDateStr);
    const newDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth()+1).padStart(2,'0')}-${String(nextDate.getDate()).padStart(2,'0')}`;
    
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
    const supabaseUrl = 'https://tvkntfytymxyivtqndqf.supabase.co'; // Deve ser pego do data.js mas pra simplificar aqui.
    // Como não temos import do supabase direto aqui sem init, vamos dar reload pro usuario ver se funciona:
    
    // Update local storage logic will fail here since we need the supabase client. 
    // Wait, script.js already has `import { fetchUserData } from './data.js';`
};

let tenantVencDate = null;
window.tenantVencDateStr = null;

fetchUserData().then(user => {
    // Bem-vindo logic
    if (user && !localStorage.getItem('welcome_seen')) {
        const welcomePopup = document.createElement('div');
        welcomePopup.id = 'welcome-popup';
        welcomePopup.style.position = 'fixed';
        welcomePopup.style.inset = '0';
        welcomePopup.style.zIndex = '999999999';
        welcomePopup.style.backdropFilter = 'blur(4px)';
        welcomePopup.style.backgroundColor = 'rgba(0,0,0,0.5)';
        welcomePopup.style.display = 'flex';
        welcomePopup.style.justifyContent = 'center';
        welcomePopup.style.alignItems = 'center';
        welcomePopup.innerHTML = `
            <div style="background: white; padding: 32px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 400px; width: 90%; text-align: center; position: relative; animation: scaleIn 0.3s ease-out forwards;">
                <button id="close-welcome" style="position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 20px; color: #6b7280; cursor: pointer; padding: 4px;"><i class="ph ph-x"></i></button>
                <div style="width: 56px; height: 56px; background: #e8feef; color: #10b981; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 16px; font-size: 28px;">
                    <i class="ph ph-hand-waving"></i>
                </div>
                <h2 style="font-size: 20px; color: #1f2937; margin-bottom: 12px; font-weight: 700;">Olá, ${user.nome_completo ? user.nome_completo.split(' ')[0] : 'Parceiro'}!</h2>
                <p style="color: #4b5563; font-size: 14px; margin-bottom: 20px; line-height: 1.5;">Parabéns por virar um parceiro da AutomatiZAP. Preparamos um breve tutorial para você conhecer todas as funcionalidades do sistema.</p>
                <button id="btn-start-tutorial-welcome" class="btn btn--primary" style="width: 100%; justify-content: center; border-radius: 8px;">
                    Iniciar Tutorial
                </button>
            </div>
            <style>
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            </style>
        `;
        document.body.appendChild(welcomePopup);
        document.body.classList.add('no-scroll');
        
        document.getElementById('close-welcome').addEventListener('click', () => {
            welcomePopup.remove();
            document.body.classList.remove('no-scroll');
            localStorage.setItem('welcome_seen', 'true');
        });
        
        document.getElementById('btn-start-tutorial-welcome').addEventListener('click', () => {
            welcomePopup.remove();
            document.body.classList.remove('no-scroll');
            localStorage.setItem('welcome_seen', 'true');
            if (typeof window.startPageTutorial === 'function') {
                window.startPageTutorial();
            }
        });
    }

    if (user && user.data_vencimento && user.data_vencimento !== 'N/A') {
        window.tenantVencDateStr = user.data_vencimento;
        tenantVencDate = window.parseExactDate(user.data_vencimento);
        window.dispatchEvent(new Event('tenantDateLoaded'));
        
        // Verificação do Bloqueio Inadimplência!
        if (tenantVencDate) {
            const todayBRT = window.getBrasiliaDate();
            todayBRT.setHours(0,0,0,0);
            
            const diffTime = tenantVencDate.getTime() - todayBRT.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                localStorage.setItem('was_inadimplente', 'true');
                // Bloqueia o CRM inteiro
                const blocker = document.createElement('div');
                blocker.id = 'inadimplente-blocker';
                blocker.style.position = 'fixed';
                blocker.style.inset = '0';
                blocker.style.zIndex = '999999999';
                blocker.style.backdropFilter = 'blur(12px)';
                blocker.style.backgroundColor = 'rgba(255,255,255,0.4)';
                blocker.style.display = 'flex';
                blocker.style.justifyContent = 'center';
                blocker.style.alignItems = 'center';
                blocker.innerHTML = `
                    <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; width: 90%; text-align: center; border: 2px solid #ef4444;">
                        <div style="width: 60px; height: 60px; background: #fee2e2; color: #ef4444; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 20px; font-size: 28px;">
                            <i class="ph ph-warning-circle"></i>
                        </div>
                        <h2 style="font-size: 22px; color: #1f2937; margin-bottom: 12px; font-weight: 700;">Acesso Bloqueado</h2>
                        <p style="color: #4b5563; font-size: 15px; margin-bottom: 16px; line-height: 1.5;">Sua assinatura do <strong>AutomatiZAP CRM</strong> venceu no dia <strong>${tenantVencDate.toLocaleDateString('pt-BR')}</strong>.</p>
                        
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: left;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span style="color: #64748b; font-size: 14px;">Plano Mensal</span>
                                <span style="color: #0f172a; font-weight: 600; font-size: 14px;">R$ ${Number(user.mensalidade || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #e2e8f0;">
                                <span style="color: #0f172a; font-weight: 700; font-size: 16px;">Total a pagar</span>
                                <span style="color: #10b981; font-weight: 700; font-size: 16px;">R$ ${Number(user.mensalidade || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                        </div>

                        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px dashed #cbd5e1; margin-bottom: 20px;" id="pix-container">
                            <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
                                <i class="ph ph-spinner ph-spin" style="font-size: 24px; color: #10b981;"></i>
                                <span style="font-size: 14px; color: #64748b;">Gerando PIX Mercado Pago...</span>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <i class="ph ph-shield-check" style="color: #10b981; font-size: 18px;"></i>
                            <span style="font-size: 12px; color: #64748b;">Pagamento 100% seguro processado pelo <strong>Mercado Pago</strong></span>
                        </div>
                    </div>
                `;
                document.body.appendChild(blocker);
                document.body.classList.add('no-scroll');
                
                // Fetch PIX real
                let currentPixString = '';
                fetch('/api/create_pix', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ email: user.email, userId: user.id, nome: user.nome_completo, mensalidade: Number(user.mensalidade || 0) })
                }).then(res => res.json()).then(data => {
                    if(data.qr_code_base64) {
                        currentPixString = data.qr_code;
                        document.getElementById('pix-container').innerHTML = `
                            <img src="data:image/png;base64,${data.qr_code_base64}" style="width: 160px; height: 160px; margin: 0 auto; display: block; border-radius: 8px; border: 1px solid #e2e8f0;" />
                            <button id="btn-blocker-pix" class="btn btn--primary" style="width: 100%; justify-content: center; margin-top: 16px; border-radius: 8px;">
                                <i class="ph ph-copy"></i> Copiar Código PIX
                            </button>
                        `;
                        
                        document.getElementById('btn-blocker-pix').addEventListener('click', (e) => {
                            navigator.clipboard.writeText(currentPixString);
                            e.target.innerHTML = '<i class="ph ph-check"></i> Código Copiado!';
                            e.target.style.background = '#166534';
                            setTimeout(() => {
                                e.target.innerHTML = '<i class="ph ph-copy"></i> Copiar Código PIX';
                                e.target.style.background = '';
                            }, 2000);
                        });
                    } else {
                        document.getElementById('pix-container').innerHTML = '<p style="color:red; font-size:12px;">Erro ao gerar PIX.</p>';
                    }
                }).catch(err => {
                    document.getElementById('pix-container').innerHTML = '<p style="color:red; font-size:12px;">Erro de conexão com Mercado Pago.</p>';
                });
                
                // Polling para desbloqueio imediato (webhook já atualizou BD)
                let isPaid = false;
                setInterval(async () => {
                    if (isPaid) return;
                    try {
                        const { supabase } = await import('./supabase.js');
                        const { data } = await supabase.from('usuarios').select('data_vencimento').eq('id', user.id).single();
                        if (data && data.data_vencimento && data.data_vencimento !== window.tenantVencDateStr) {
                            isPaid = true;
                            
                            // Remove o bloqueio vermelho suavemente e mostra sucesso
                            const blockOverlay = document.getElementById('inadimplente-blocker');
                            if (blockOverlay) {
                                localStorage.removeItem('was_inadimplente'); // Evita o segundo popup após o reload
                                blockOverlay.innerHTML = `
                                    <style>
                                    @keyframes popCheck {
                                        0% { transform: scale(0.5); opacity: 0; }
                                        50% { transform: scale(1.2); opacity: 1; }
                                        100% { transform: scale(1); opacity: 1; }
                                    }
                                    @keyframes pulseGlow {
                                        0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
                                        70% { box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); }
                                        100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                                    }
                                    </style>
                                    <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; width: 90%; text-align: center; border: 2px solid #22c55e;">
                                        <div style="width: 70px; height: 70px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 24px; font-size: 36px; animation: popCheck 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, pulseGlow 2s infinite; position: relative;">
                                            <i class="ph ph-check-circle"></i>
                                        </div>
                                        <h2 style="font-size: 24px; color: #1f2937; margin-bottom: 12px; font-weight: 700;">Pagamento Aprovado!</h2>
                                        <p style="color: #4b5563; font-size: 15px; margin-bottom: 24px; line-height: 1.5;">Processamos o seu pagamento pelo Mercado Pago com sucesso. Agradecemos pela confiança!</p>
                                        
                                        <div style="background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px dashed #cbd5e1; margin-bottom: 10px;">
                                            <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
                                                <i class="ph ph-spinner-gap ph-spin" style="font-size: 24px; color: #10b981;"></i>
                                                <span style="font-size: 14px; color: #64748b; font-weight: 500;">Redirecionando ao CRM...</span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                                
                                // Injetar script de confetti
                                const script = document.createElement('script');
                                script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
                                script.onload = () => {
                                    confetti({
                                        particleCount: 150,
                                        spread: 70,
                                        origin: { y: 0.6 },
                                        zIndex: 9999999999
                                    });
                                };
                                document.head.appendChild(script);
                            }
                            
                            setTimeout(() => {
                                window.location.reload();
                            }, 5000);
                        }
                    } catch(e) {}
                }, 4000);
            } else if (diffDays >= 0 && diffDays <= 3 && !window.location.href.includes('configuracoes')) {
                const warningPopup = document.createElement('div');
                warningPopup.id = 'aviso-previo-popup';
                warningPopup.style.position = 'fixed';
                warningPopup.style.inset = '0';
                warningPopup.style.zIndex = '999999999';
                warningPopup.style.backdropFilter = 'blur(4px)';
                warningPopup.style.backgroundColor = 'rgba(0,0,0,0.3)';
                warningPopup.style.display = 'flex';
                warningPopup.style.justifyContent = 'center';
                warningPopup.style.alignItems = 'center';
                warningPopup.innerHTML = `
                    <div style="background: white; padding: 32px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 400px; width: 90%; text-align: center; border: 2px solid #f59e0b; position: relative; animation: scaleIn 0.3s ease-out forwards;">
                        <button id="close-warning" style="position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 20px; color: #6b7280; cursor: pointer; padding: 4px;"><i class="ph ph-x"></i></button>
                        <div style="width: 56px; height: 56px; background: #fef3c7; color: #d97706; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 16px; font-size: 28px;">
                            <i class="ph ph-warning"></i>
                        </div>
                        <h2 style="font-size: 20px; color: #1f2937; margin-bottom: 12px; font-weight: 700;">Aviso de Vencimento</h2>
                        <p style="color: #4b5563; font-size: 14px; margin-bottom: 20px; line-height: 1.5;">Sua mensalidade vence em <strong>${diffDays === 0 ? 'hoje' : diffDays + ' dia(s)'}</strong>. Para garantir que seu CRM e suas automações continuem funcionando sem interrupções, realize o pagamento via PIX acessando suas configurações.</p>
                        
                        <button id="btn-pay-warning" style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 12px; background: #f59e0b; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s;">
                            Pagar agora <i class="ph ph-arrow-right"></i>
                        </button>
                    </div>
                    <style>
                        @keyframes scaleIn {
                            from { transform: scale(0.95); opacity: 0; }
                            to { transform: scale(1); opacity: 1; }
                        }
                    </style>
                `;
                document.body.appendChild(warningPopup);
                document.body.classList.add('no-scroll');
                
                document.getElementById('close-warning').addEventListener('click', () => {
                    warningPopup.remove();
                    document.body.classList.remove('no-scroll');
                });
                
                document.getElementById('btn-pay-warning').addEventListener('click', () => {
                    warningPopup.remove();
                    document.body.classList.remove('no-scroll');
                    window.location.href = 'configuracoes.html?tab=assinatura';
                });
            } else {
                if (localStorage.getItem('was_inadimplente') === 'true') {
                    localStorage.removeItem('was_inadimplente');
                    
                    const successBlocker = document.createElement('div');
                    successBlocker.id = 'success-blocker-reload';
                    successBlocker.style.position = 'fixed';
                    successBlocker.style.inset = '0';
                    successBlocker.style.zIndex = '999999999';
                    successBlocker.style.backdropFilter = 'blur(12px)';
                    successBlocker.style.backgroundColor = 'rgba(255,255,255,0.4)';
                    successBlocker.style.display = 'flex';
                    successBlocker.style.justifyContent = 'center';
                    successBlocker.style.alignItems = 'center';
                    successBlocker.innerHTML = `
                        <style>
                        @keyframes popCheck {
                            0% { transform: scale(0.5); opacity: 0; }
                            50% { transform: scale(1.2); opacity: 1; }
                            100% { transform: scale(1); opacity: 1; }
                        }
                        @keyframes pulseGlow {
                            0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
                            70% { box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); }
                            100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                        }
                        </style>
                        <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; width: 90%; text-align: center; border: 2px solid #22c55e;">
                            <div style="width: 70px; height: 70px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 24px; font-size: 36px; animation: popCheck 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, pulseGlow 2s infinite; position: relative;">
                                <i class="ph ph-check-circle"></i>
                            </div>
                            <h2 style="font-size: 24px; color: #1f2937; margin-bottom: 12px; font-weight: 700;">Pagamento Aprovado!</h2>
                            <p style="color: #4b5563; font-size: 15px; margin-bottom: 24px; line-height: 1.5;">Processamos o seu pagamento pelo Mercado Pago com sucesso. Agradecemos pela confiança!</p>
                            
                            <div style="background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px dashed #cbd5e1; margin-bottom: 10px;">
                                <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
                                    <i class="ph ph-spinner-gap ph-spin" style="font-size: 24px; color: #10b981;"></i>
                                    <span style="font-size: 14px; color: #64748b; font-weight: 500;">Entrando no sistema...</span>
                                </div>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(successBlocker);
                    document.body.classList.add('no-scroll');

                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
                    script.onload = () => {
                        confetti({
                            particleCount: 150,
                            spread: 70,
                            origin: { y: 0.6 },
                            zIndex: 9999999999
                        });
                    };
                    document.head.appendChild(script);

                    setTimeout(() => {
                        successBlocker.remove();
                        document.body.classList.remove('no-scroll');
                    }, 5000);
                }
            }
        }
    }
});

// --- Relógio da Sidebar em Tempo Real ---
function updateSidebarClock() {
    const brDate = window.getBrasiliaDate();
    const h = String(brDate.getHours()).padStart(2, '0');
    const m = String(brDate.getMinutes()).padStart(2, '0');
    const options = { weekday: 'short', day: '2-digit', month: 'long' };
    let dateStr = brDate.toLocaleDateString('pt-BR', options);
    dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

    // Desktop/Sidebar Clock
    const clockTime = document.getElementById('clock-time');
    const clockDate = document.getElementById('clock-date');
    if (clockTime && clockDate) {
        clockTime.textContent = `${h}:${m} (Brasília)`;
        clockDate.textContent = dateStr;
    }

    // Mobile/Dropdown Clock
    const mClockTime = document.getElementById('mobile-clock-time');
    const mClockDate = document.getElementById('mobile-clock-date');
    if (mClockTime && mClockDate) {
        mClockTime.textContent = `${h}:${m} (Brasília)`;
        mClockDate.textContent = dateStr;
    }
}
// Atualiza a cada segundo
setInterval(updateSidebarClock, 1000);
document.addEventListener('DOMContentLoaded', updateSidebarClock);

if (window.location.pathname.indexOf('login.html') === -1) {
    import('./supabase.js').then(({ supabase }) => {
        supabase.auth.getSession().then(async ({ data }) => {
            if (!data.session) {
                window.location.href = 'login.html';
            } else {
                let currentUserData = null;
                // Busca os dados adicionais do usuário logado na tabela 'usuarios'
                try {
                    const userId = data.session.user.id;
                    const { data: userData, error } = await supabase
                        .from('usuarios')
                        .select('nome_completo, tipo_usuario, avatar_url, status_assinatura, data_vencimento, mensalidade')
                        .eq('id', userId)
                        .single();

                    if (userData && !error) {
                        currentUserData = userData;

                        // -- Avaliação Dinâmica do Status (Sincroniza com a data de vencimento) --
                        if (userData.tipo_usuario !== 'administrador' && userData.data_vencimento && userData.data_vencimento !== 'N/A') {
                            const vencDate = window.parseExactDate(userData.data_vencimento);
                            if (vencDate) {
                                const today = window.getBrasiliaDate();
                                today.setHours(0, 0, 0, 0);
                                const diffDays = Math.ceil((vencDate - today) / (1000 * 3600 * 24));
                                
                                let dynamicStatus = userData.status_assinatura;
                                if (diffDays < 0) {
                                    dynamicStatus = 'vencido';
                                } else if (diffDays >= 0 && diffDays <= 3) {
                                    dynamicStatus = 'Aviso prévio';
                                } else if (diffDays > 3) {
                                    dynamicStatus = 'pago';
                                }

                                if (dynamicStatus !== userData.status_assinatura) {
                                    userData.status_assinatura = dynamicStatus;
                                    // Sincroniza em background
                                    supabase.from('usuarios').update({ status_assinatura: dynamicStatus }).eq('id', userId).then();
                                }
                            }
                        }
                        // ------------------------------------------------------------------------

                        const userName = userData.nome_completo || 'Usuário';
                        const userRole = userData.tipo_usuario || 'usuário';

                        // Redireciona Master Admin para o painel admin
                        if (userRole === 'administrador' && window.location.pathname.indexOf('admin.html') === -1) {
                            window.location.href = 'admin.html';
                            return;
                        }

                        // Bloqueio por falta de pagamento
                        if ((userData.status_assinatura === 'inadimplente' || userData.status_assinatura === 'vencido') && window.location.pathname.indexOf('configuracoes.html') === -1) {
                            window.location.href = 'configuracoes.html?tab=assinatura';
                            return;
                        }

                        document.querySelectorAll('.user-info .user-name').forEach(el => el.textContent = userName);
                        document.querySelectorAll('.user-info .user-role').forEach(el => el.textContent = userRole);

                        document.querySelectorAll('.user-menu .avatar').forEach(el => {
                            if (userData.avatar_url) {
                                el.innerHTML = `<img src="${userData.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
                            } else {
                                el.textContent = userName.substring(0, 2).toUpperCase();
                            }
                        });
                    } else {
                        // Fallback: se der erro (ex: RLS bloqueando), usa o e-mail da sessão
                        const fallbackEmail = data.session.user.email;
                        document.querySelectorAll('.user-info .user-name').forEach(el => el.textContent = fallbackEmail);
                        document.querySelectorAll('.user-info .user-role').forEach(el => el.textContent = 'Erro de Permissão');
                        document.querySelectorAll('.user-menu .avatar').forEach(el => {
                            el.textContent = fallbackEmail.substring(0, 2).toUpperCase();
                        });
                        console.error('Erro ao ler tabela usuarios (RLS?):', error);
                    }
                } catch (e) {
                    console.error("Erro ao carregar perfil do usuário:", e);
                }

                // Se estiver logado, carrega o módulo de dados
                import('./data.js').then(async (module) => {
                    // Inicializa os dados da página específica
                    if (window.location.pathname.indexOf('index.html') > -1 || window.location.pathname.endsWith('/')) {
                        if (window.initDashboard) window.initDashboard();
                    } else if (window.location.pathname.indexOf('leads.html') > -1) {
                        if (window.initLeads) window.initLeads();
                    } else if (window.location.pathname.indexOf('conversas.html') > -1) {
                        if (window.initConversations) window.initConversations();
                    } else if (window.location.pathname.indexOf('configuracoes.html') > -1) {
                        if (window.initSettings) window.initSettings();
                    }
                    
                    // --- Lógica de Notificações Inteligentes ---
                    async function loadNotifications() {
                        const notifList = document.getElementById('notif-list');
                        const notifDot = document.querySelector('.notification-dot');
                        if (!notifList) return;

                        let html = '';
                        let notifCount = 0;

                        // 1. Verificar Vencimento da Mensalidade
                        if (currentUserData && currentUserData.data_vencimento && currentUserData.data_vencimento !== 'N/A') {
                            const vencDate = window.parseExactDate(currentUserData.data_vencimento);
                            if (vencDate) {
                                const now = window.getBrasiliaDate();
                                now.setHours(0, 0, 0, 0);
                                const diffTime = vencDate.getTime() - now.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                
                                let notifText = '';
                                let isExpired = false;
                                let isRenewed = false;

                                if (diffDays < 0) {
                                    isExpired = true;
                                    if (diffDays === -1) notifText = "Sua assinatura venceu ontem. Renove agora para evitar o bloqueio.";
                                    else notifText = `Sua assinatura venceu há ${Math.abs(diffDays)} dias. Renove agora para evitar o bloqueio.`;
                                } else if (diffDays === 0) {
                                    notifText = "Sua assinatura vence hoje! Renove agora para evitar a suspensão.";
                                } else if (diffDays === 1) {
                                    notifText = "Atenção: Falta 1 dia para o vencimento da sua assinatura.";
                                } else if (diffDays <= 3) {
                                    notifText = `Atenção: Faltam ${diffDays} dias para o vencimento da sua assinatura.`;
                                } else if (diffDays > 3) {
                                    isRenewed = true;
                                    let paidValue = '97,00';
                                    if (currentUserData.mensalidade !== undefined && currentUserData.mensalidade !== null) {
                                        paidValue = Number(currentUserData.mensalidade).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                                    }
                                    notifText = `Sua assinatura foi renovada no valor de R$ ${paidValue}`;
                                }

                                if (notifText) {
                                    html += `<div style="padding: 12px; border-bottom: 1px solid var(--color-border); cursor: pointer;" onclick="window.location.href='configuracoes.html?tab=assinatura'">
                                        <div style="font-weight: 600; font-size: 13px; color: ${isExpired ? 'var(--color-danger)' : (isRenewed ? '#10b981' : 'var(--color-warning)')}; margin-bottom: 4px;"><i class="ph ${isExpired ? 'ph-warning-circle' : (isRenewed ? 'ph-check-circle' : 'ph-warning')}"></i> ${isExpired ? 'Assinatura Vencida' : (isRenewed ? 'Você renovou sua assinatura' : 'Aviso Prévio')}</div>
                                        <div style="font-size: 12px; color: var(--color-text-mut);">${notifText}</div>
                                    </div>`;
                                    notifCount++;
                                }
                            }
                        }

                        // 2. Verificar Novos Leads nas últimas 24h
                        const leads = await module.fetchLeads();
                        const nowLeads = window.getBrasiliaDate();
                        const newLeads = leads.filter(l => {
                            const leadDate = new Date(l.criado_em);
                            const diff = (nowLeads - leadDate) / (1000 * 60 * 60); // horas
                            return diff <= 24;
                        });

                        newLeads.forEach(l => {
                            html += `<div style="padding: 12px; border-bottom: 1px solid var(--color-border); cursor: pointer;" onclick="window.location.href='leads.html'">
                                <div style="font-weight: 600; font-size: 13px; color: var(--color-text); margin-bottom: 4px;"><i class="ph ph-user-plus text-primary"></i> Novo Lead</div>
                                <div style="font-size: 12px; color: var(--color-text-mut);">Você recebeu um novo lead: ${l.nome}</div>
                            </div>`;
                            notifCount++;
                        });

                        // 3. Verificar Tarefas Pendentes para hoje
                        const tarefas = await module.fetchTasks();
                        
                        // Forçar formatação YYYY-MM-DD segura no horário de Brasília
                        const brDate = window.getBrasiliaDate();
                        const y = brDate.getFullYear();
                        const m = String(brDate.getMonth() + 1).padStart(2, '0');
                        const d = String(brDate.getDate()).padStart(2, '0');
                        const todayStr = `${y}-${m}-${d}`;
                        
                        const pendingTasks = tarefas.filter(t => t.status === 'pendente' && t.data_vencimento && t.data_vencimento.startsWith(todayStr));
                        
                        pendingTasks.forEach(t => {
                            html += `<div style="padding: 12px; border-bottom: 1px solid var(--color-border); cursor: pointer;" onclick="window.location.href='tarefas.html'">
                                <div style="font-weight: 600; font-size: 13px; color: var(--color-text); margin-bottom: 4px;"><i class="ph ph-check-square text-success"></i> Tarefa de Hoje</div>
                                <div style="font-size: 12px; color: var(--color-text-mut);">${t.titulo}</div>
                            </div>`;
                            notifCount++;
                        });

                        let hiddenCount = parseInt(localStorage.getItem('notifs_hidden_until_count')) || 0;
                        if (hiddenCount > notifCount) {
                            hiddenCount = notifCount;
                            localStorage.setItem('notifs_hidden_until_count', hiddenCount);
                        }
                        const newCount = notifCount - hiddenCount;

                        const badge = document.getElementById('notif-badge');
                        const btnReadAll = document.getElementById('btn-read-all');
                        
                        if (btnReadAll && !btnReadAll.dataset.listener) {
                            btnReadAll.dataset.listener = "true";
                            btnReadAll.addEventListener('click', (e) => {
                                e.stopPropagation();
                                localStorage.setItem('notifs_hidden_until_count', notifCount);
                                loadNotifications();
                            });
                        }

                        if (notifCount > 0) {
                            notifList.innerHTML = html;
                            
                            if (newCount > 0) {
                                if (notifDot) notifDot.style.display = 'block';
                                if (badge) {
                                    badge.textContent = newCount === 1 ? '1 nova' : `${newCount} novas`;
                                    badge.style.display = 'inline-block';
                                }
                                if (btnReadAll) btnReadAll.style.display = 'inline-block';
                            } else {
                                if (notifDot) notifDot.style.display = 'none';
                                if (badge) badge.style.display = 'none';
                                if (btnReadAll) btnReadAll.style.display = 'none';
                            }
                            
                            const notifPageList = document.getElementById('notif-page-list');
                            if (notifPageList) notifPageList.innerHTML = html;
                        } else {
                            notifList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--color-text-mut); font-size: 13px;">Nenhuma notificação.</div>';
                            if (notifDot) notifDot.style.display = 'none';
                            if (badge) badge.style.display = 'none';
                            if (btnReadAll) btnReadAll.style.display = 'none';
                            
                            const notifPageList = document.getElementById('notif-page-list');
                            if (notifPageList) notifPageList.innerHTML = '<div style="padding: 32px; text-align: center; color: var(--color-text-mut);">Nenhuma notificação.</div>';
                        }
                    }

                    // Aguardar um momento para garantir que a UI foi renderizada
                    setTimeout(loadNotifications, 500);
                });
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Lógica de Sidebar e Overlay originais
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    // --- Lógica do Modo Escuro (Dark Mode) ---
    const themeCheckbox = document.getElementById('theme-toggle-checkbox');

    function getUserThemeKey() {
        let themeKey = 'theme';
        try {
            const tokenStr = localStorage.getItem('sb-qosgrqdfeqzxnzhmwomv-auth-token');
            if (tokenStr) {
                const token = JSON.parse(tokenStr);
                if (token && token.user && token.user.id) {
                    themeKey = 'theme_' + token.user.id;
                }
            }
        } catch(e) {}
        return themeKey;
    }
    const currentThemeKey = getUserThemeKey();

    // Verifica preferência salva
    if (localStorage.getItem(currentThemeKey) === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeCheckbox) themeCheckbox.checked = true;
    }

    if (themeCheckbox) {
        const themeText = document.querySelector('.theme-item span');

        // Função para atualizar o texto do tema
        const updateThemeText = (isDark) => {
            if (themeText) {
                if (isDark) {
                    themeText.innerHTML = '<i class="ph ph-moon"></i> Modo Escuro';
                } else {
                    themeText.innerHTML = '<i class="ph ph-sun"></i> Modo Claro';
                }
            }
        };

        // Aplica o texto correto na inicialização
        updateThemeText(themeCheckbox.checked);

        themeCheckbox.addEventListener('change', (e) => {
            const isDark = e.target.checked;
            updateThemeText(isDark);

            if (isDark) {
                document.body.classList.add('dark-mode');
                localStorage.setItem(currentThemeKey, 'dark');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem(currentThemeKey, 'light');
            }
        });
    }

    // --- Lógica do Dropdown de Usuário ---
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');

    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede o fechamento ao clicar no próprio menu
            userDropdown.classList.toggle('show');
        });

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }

    // --- Lógica de Logout ---
    const logoutBtn = document.querySelector('.ph-sign-out')?.closest('.dropdown-item');
    if (logoutBtn) {
        logoutBtn.style.cursor = 'pointer';
        logoutBtn.addEventListener('click', () => {
            import('./supabase.js').then(({ supabase }) => {
                supabase.auth.signOut().then(() => {
                    window.location.href = 'login.html';
                });
            });
        });
    }

    // --- Lógica do Dropdown de Notificações ---
    const notifBtn = document.getElementById('notification-btn');
    const notifDropdown = document.getElementById('notification-dropdown');

    if (notifBtn && notifDropdown) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifDropdown.classList.toggle('show');
            
            // Leitura automática: se o dropdown acabou de ser aberto, marca como lido
            if (notifDropdown.classList.contains('show')) {
                const btnReadAll = document.getElementById('btn-read-all');
                if (btnReadAll && btnReadAll.style.display !== 'none') {
                    btnReadAll.click();
                }
            }

            // Fecha o user dropdown se estiver aberto
            if (userDropdown) userDropdown.classList.remove('show');
        });

        document.addEventListener('click', (e) => {
            if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
                notifDropdown.classList.remove('show');
            }
        });
    }

    // Toggle sidebar
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Close sidebar when clicking outside (on mobile)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024) {
            if (sidebar && sidebar.classList.contains('open')) {
                // Se clicou fora da sidebar E fora do botão de menu
                if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        }
    });

    // Handle resizing - remove open class if resizing back to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024 && sidebar) {
            sidebar.classList.remove('open');
        }
    });

    // --- Live Search ---
    const searchInputs = document.querySelectorAll('.search-input input');

    searchInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();

            // Procura a tabela de dados mais próxima, ou assume a principal da página
            const tableRows = document.querySelectorAll('.data-table tbody tr');

            tableRows.forEach(row => {
                const textContent = row.textContent.toLowerCase();
                if (textContent.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    });


    // --- Lead Table Row Click to Update Sidebar ---
    const tableRows = document.querySelectorAll('.data-table tbody tr');
    const highlightSidebar = document.querySelector('.lead-highlight');

    if (tableRows.length > 0 && highlightSidebar) {
        tableRows.forEach(row => {
            row.style.cursor = 'pointer'; // Adiciona cursor de clique

            row.addEventListener('click', () => {
                // 1. Coleta os dados da linha clicada
                const nameEl = row.querySelector('.font-medium');
                const name = nameEl ? nameEl.textContent.trim() : 'Nome não informado';

                const initialsEl = row.querySelector('.avatar');
                const initials = initialsEl ? initialsEl.textContent.trim() : '--';

                const cells = row.querySelectorAll('td');
                const origin = cells.length > 1 ? cells[1].textContent.trim() : 'Desconhecida';
                const interest = cells.length > 2 ? cells[2].textContent.trim() : 'Não informado';
                const statusHtml = cells.length > 3 ? cells[3].innerHTML : '';

                // 2. Atualiza a barra lateral (Perfil)
                const hlName = highlightSidebar.querySelector('.profile-info h3');
                if (hlName) hlName.textContent = name;

                const hlAvatar = highlightSidebar.querySelector('.highlight-profile .avatar');
                if (hlAvatar) {
                    hlAvatar.textContent = initials;
                    // Opcional: remover cores antigas e sortear uma nova baseada no nome
                }

                const hlOrigin = highlightSidebar.querySelector('.origin-info span');
                if (hlOrigin) hlOrigin.textContent = 'Origem: ' + origin;

                // 3. Atualiza os detalhes
                const detailValues = highlightSidebar.querySelectorAll('.detail-value');
                if (detailValues.length >= 4) {
                    detailValues[0].textContent = interest; // Interesse
                    // Mantém o orçamento fixo por agora, ou muda se houver na tabela
                    // detailValues[1] é Orçamento
                    // detailValues[2] é Qualificação
                    detailValues[3].innerHTML = statusHtml; // Status
                }

                // Adiciona um efeito visual de destaque na linha clicada
                tableRows.forEach(r => r.style.backgroundColor = '');
                row.style.backgroundColor = 'rgba(0, 168, 132, 0.05)'; // Verde sutil

                // Se estiver no mobile, rolar a tela para a barra lateral
                if (window.innerWidth <= 1024) {
                    highlightSidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    // --- Modal Factory (Filtros e Data) ---
    function createModal(title, contentHtml, onApply) {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
        overlay.style.backdropFilter = 'blur(4px)';
        overlay.style.zIndex = '2000';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.2s';

        const modal = document.createElement('div');
        modal.className = 'card'; // Herda estilos base de card do tema
        modal.style.width = '90%';
        modal.style.maxWidth = '400px';
        modal.style.transform = 'scale(0.95)';
        modal.style.transition = 'transform 0.2s';

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="font-size: 18px; margin: 0;">${title}</h3>
                <button class="btn-icon xs close-modal"><i class="ph ph-x"></i></button>
            </div>
            <div style="margin-bottom: 24px;">
                ${contentHtml}
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button class="btn btn--outline close-modal">Cancelar</button>
                <button class="btn btn--primary apply-modal">Aplicar</button>
            </div>
        `;
        modal.innerHTML = html;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Animate in
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        });

        const close = () => {
            overlay.style.opacity = '0';
            modal.style.transform = 'scale(0.95)';
            setTimeout(() => overlay.remove(), 200);
        };

        overlay.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', close));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        overlay.querySelector('.apply-modal').addEventListener('click', () => {
            onApply(modal);
            close();
        });
    }

    // --- Lógica do Botão de Data (Dropdown) ---
    const dateBtn = document.getElementById('date-filter-btn');
    const dateDropdown = document.getElementById('date-dropdown');

    if (dateBtn && dateDropdown) {
        dateBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dateDropdown.classList.toggle('show');

            // Fecha outros dropdowns se estiverem abertos
            const userDropdown = document.getElementById('user-dropdown');
            const notifDropdown = document.getElementById('notification-dropdown');
            if (userDropdown) userDropdown.classList.remove('show');
            if (notifDropdown) notifDropdown.classList.remove('show');
        });

        document.addEventListener('click', (e) => {
            if (!dateBtn.contains(e.target) && !dateDropdown.contains(e.target)) {
                dateDropdown.classList.remove('show');
            }
        });

        // --- Lógica do Calendário ---
        const calendarGrid = document.getElementById('calendar-grid');
        const monthYearTxt = document.getElementById('cal-month-year');
        const selectionTxt = document.getElementById('cal-selection-text');
        const prevBtn = document.getElementById('cal-prev');
        const nextBtn = document.getElementById('cal-next');
        let currentDate = new Date();
        
        // Cache logic
        let rangeStart = null;
        let rangeEnd = null;
        
        const cachedStart = localStorage.getItem('calendar_filter_start');
        const cachedEnd = localStorage.getItem('calendar_filter_end');
        
        if (cachedStart && cachedEnd) {
            rangeStart = new Date(cachedStart);
            rangeEnd = new Date(cachedEnd);
        } else {
            rangeStart = null;
            rangeEnd = null;
        }
        window._calendarRangeStart = rangeStart;
        window._calendarRangeEnd = rangeEnd;
        
        function updateMainFilterText() {
            const dateText = document.getElementById('date-filter-text');
            if (!dateText) return;
            if (rangeStart && rangeEnd) {
                const startStr = `${rangeStart.getDate().toString().padStart(2, '0')}/${(rangeStart.getMonth() + 1).toString().padStart(2, '0')}/${rangeStart.getFullYear()}`;
                const endStr = `${rangeEnd.getDate().toString().padStart(2, '0')}/${(rangeEnd.getMonth() + 1).toString().padStart(2, '0')}/${rangeEnd.getFullYear()}`;
                dateText.textContent = `${startStr} - ${endStr}`;
            } else {
                const now = new Date();
                const startM = new Date(now.getFullYear(), now.getMonth(), 1);
                const endM = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                const startStr = `${startM.getDate().toString().padStart(2, '0')}/${(startM.getMonth() + 1).toString().padStart(2, '0')}/${startM.getFullYear()}`;
                const endStr = `${endM.getDate().toString().padStart(2, '0')}/${(endM.getMonth() + 1).toString().padStart(2, '0')}/${endM.getFullYear()}`;
                dateText.textContent = `${startStr} - ${endStr}`;
            }
        }
        // Update on load
        updateMainFilterText();
        
        // Inject Limpar Filtros button dynamically
        const dateDropdownHeader = document.querySelector('.date-dropdown-header');
        if (dateDropdownHeader && !document.getElementById('btn-clear-filters')) {
            dateDropdownHeader.style.display = 'flex';
            dateDropdownHeader.style.justifyContent = 'space-between';
            dateDropdownHeader.style.alignItems = 'center';
            
            const clearBtn = document.createElement('button');
            clearBtn.id = 'btn-clear-filters';
            clearBtn.textContent = 'Limpar filtros';
            clearBtn.style.background = 'none';
            clearBtn.style.border = 'none';
            clearBtn.style.color = 'var(--color-text-mut)';
            clearBtn.style.fontSize = '11px';
            clearBtn.style.cursor = 'pointer';
            clearBtn.style.textDecoration = 'underline';
            
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                rangeStart = null;
                rangeEnd = null;
                window._calendarRangeStart = rangeStart;
                window._calendarRangeEnd = rangeEnd;
                
                if (selectionTxt) selectionTxt.textContent = `Nenhum período selecionado`;
                
                localStorage.removeItem('calendar_filter_start');
                localStorage.removeItem('calendar_filter_end');
                
                updateMainFilterText();
                renderCalendar();
                window.dispatchEvent(new Event('calendarFilterChanged'));
                
                // Forçar atualização direta caso o event listener falhe
                if (typeof window.initDashboard === 'function') window.initDashboard();
                if (typeof window.initLeads === 'function') window.initLeads();
                if (typeof window.initRelatorios === 'function') window.initRelatorios();
            });
            dateDropdownHeader.appendChild(clearBtn);
        }

        function renderCalendar() {
            if (!calendarGrid) return;

            // Limpa dias anteriores (mantém os span dos nomes da semana)
            const days = calendarGrid.querySelectorAll('.cal-day');
            days.forEach(d => d.remove());
            const empties = calendarGrid.querySelectorAll('.empty');
            empties.forEach(e => e.remove());

            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
            if (monthYearTxt) monthYearTxt.textContent = `${monthNames[month]} ${year}`;

            const firstDay = new Date(year, month, 1).getDay(); // 0 (Dom) a 6 (Sab)
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            // Espaços vazios antes do dia 1
            for (let i = 0; i < firstDay; i++) {
                const empty = document.createElement('div');
                empty.className = 'cal-day empty';
                calendarGrid.appendChild(empty);
            }

            // Dias do mês
            for (let i = 1; i <= daysInMonth; i++) {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'cal-day';
                dayDiv.textContent = i;

                const thisDate = new Date(year, month, i);
                
                // Highlight current day (today)
                const brDate = typeof window.getBrasiliaDate === 'function' ? window.getBrasiliaDate() : new Date();
                if (thisDate.getFullYear() === brDate.getFullYear() &&
                    thisDate.getMonth() === brDate.getMonth() &&
                    thisDate.getDate() === brDate.getDate()) {
                    dayDiv.classList.add('today-date');
                }

                // Classes de range
                if (rangeStart && rangeEnd) {
                    if (thisDate.getTime() === rangeStart.getTime()) {
                        dayDiv.classList.add('start-range');
                    }
                    if (thisDate.getTime() === rangeEnd.getTime()) {
                        dayDiv.classList.add('end-range');
                    }
                    if (thisDate > rangeStart && thisDate < rangeEnd) {
                        dayDiv.classList.add('in-range');
                    }
                } else if (rangeStart && thisDate.getTime() === rangeStart.getTime()) {
                    dayDiv.classList.add('selected');
                }

                if (tenantVencDate) {
                    const thisTime = thisDate.getTime();
                    const targetDay = tenantVencDate.getDate();
                    
                    // Cria datas de vencimento para o mês atual e para o próximo mês
                    // Isso garante que a transição de meses (ex: vencimento dia 2, e estamos no dia 30) funcione
                    const vencThisMonth = new Date(year, month, targetDay);
                    const vencNextMonth = new Date(year, month + 1, targetDay);
                    
                    const diffThis = Math.round((vencThisMonth.getTime() - thisTime) / (1000 * 60 * 60 * 24));
                    const diffNext = Math.round((vencNextMonth.getTime() - thisTime) / (1000 * 60 * 60 * 24));

                    if (diffThis === 0 || diffNext === 0) {
                        dayDiv.classList.add('due-date-danger');
                    } else if ((diffThis > 0 && diffThis <= 3) || (diffNext > 0 && diffNext <= 3)) {
                        dayDiv.classList.add('due-date-warning');
                    }
                }

                dayDiv.addEventListener('click', (e) => {
                    e.stopPropagation(); // Previne fechamento do menu ao recriar DOM
                    if (!rangeStart || (rangeStart && rangeEnd)) {
                        rangeStart = thisDate;
                        rangeEnd = null;
                        if (selectionTxt) selectionTxt.textContent = `De: ${i} de ${monthNames[month]} - Selecione o fim`;
                    } else if (rangeStart && !rangeEnd) {
                        if (thisDate < rangeStart) {
                            rangeEnd = rangeStart;
                            rangeStart = thisDate;
                        } else {
                            rangeEnd = thisDate;
                        }
                        if (selectionTxt) selectionTxt.textContent = `Período selecionado: ${rangeStart.getDate().toString().padStart(2, '0')}/${(rangeStart.getMonth() + 1).toString().padStart(2, '0')} até ${rangeEnd.getDate().toString().padStart(2, '0')}/${(rangeEnd.getMonth() + 1).toString().padStart(2, '0')}`;
                    }
                    window._calendarRangeStart = rangeStart;
                    window._calendarRangeEnd = rangeEnd;
                    renderCalendar();
                });

                calendarGrid.appendChild(dayDiv);
            }
        }

        if (prevBtn) prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });

        if (nextBtn) nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });

        // Primeiro render
        window.addEventListener('tenantDateLoaded', () => {
            if (typeof renderCalendar === 'function') {
                renderCalendar();
            }
        });

        renderCalendar();

        const applyBtn = document.getElementById('btn-apply-date');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                if (rangeStart && rangeEnd) {
                    localStorage.setItem('calendar_filter_start', rangeStart.toISOString());
                    localStorage.setItem('calendar_filter_end', rangeEnd.toISOString());
                } else if (rangeStart) {
                    localStorage.setItem('calendar_filter_start', rangeStart.toISOString());
                    localStorage.removeItem('calendar_filter_end');
                } else {
                    localStorage.removeItem('calendar_filter_start');
                    localStorage.removeItem('calendar_filter_end');
                }
                
                updateMainFilterText();
                dateDropdown.classList.remove('show');
                window.dispatchEvent(new Event('calendarFilterChanged'));
                
                // Forçar atualização direta caso o event listener falhe
                if (typeof window.initDashboard === 'function') window.initDashboard();
                if (typeof window.initLeads === 'function') window.initLeads();
                if (typeof window.initRelatorios === 'function') window.initRelatorios();
            });
        }
    }

    // --- Lógica do Botão de Filtro da Tabela (.ph-funnel) ---
    // Procura por botões de filtro nas table-controls
    const filterBtns = document.querySelectorAll('.table-controls .btn-icon');
    filterBtns.forEach(btn => {
        // Verifica se é o botão com funil
        if (btn.querySelector('.ph-funnel')) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                if (window.innerWidth <= 768) {
                    // Lógica para Mobile: Modal Pop-up com Calendário e Status
                    let mobileModal = document.getElementById('mobile-filter-modal');
                    
                    if (!mobileModal) {
                        // Criação do overlay do modal
                        mobileModal = document.createElement('div');
                        mobileModal.id = 'mobile-filter-modal';
                        mobileModal.style.position = 'fixed';
                        mobileModal.style.top = '0';
                        mobileModal.style.left = '0';
                        mobileModal.style.width = '100vw';
                        mobileModal.style.height = '100vh';
                        mobileModal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                        mobileModal.style.backdropFilter = 'blur(4px)';
                        mobileModal.style.zIndex = '99999';
                        mobileModal.style.display = 'flex';
                        mobileModal.style.alignItems = 'center';
                        mobileModal.style.justifyContent = 'center';
                        mobileModal.style.opacity = '0';
                        mobileModal.style.visibility = 'hidden';
                        mobileModal.style.transition = 'all 0.3s ease';

                        // Container principal do modal
                        const modalContent = document.createElement('div');
                        modalContent.style.backgroundColor = 'var(--color-bg-card)';
                        modalContent.style.width = '90%';
                        modalContent.style.maxWidth = '360px';
                        modalContent.style.borderRadius = 'var(--radius-lg)';
                        modalContent.style.padding = '20px';
                        modalContent.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
                        modalContent.style.maxHeight = '90vh';
                        modalContent.style.overflowY = 'auto';
                        modalContent.style.display = 'flex';
                        modalContent.style.flexDirection = 'column';
                        modalContent.style.gap = '16px';

                        // Título e botão fechar
                        const headerDiv = document.createElement('div');
                        headerDiv.style.display = 'flex';
                        headerDiv.style.justifyContent = 'space-between';
                        headerDiv.style.alignItems = 'center';
                        headerDiv.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <h3 style="font-size: 16px; margin: 0; color: var(--color-text-main);">Filtros</h3>
                                <div class="card-tooltip-container mobile-only-tooltip" style="position: relative; cursor: pointer; top: auto; right: auto; margin-top: 2px;" onclick="this.classList.toggle('show')">
                                    <div class="tooltip-icon-btn" style="width: 20px; height: 20px; font-size: 12px;"><i class="ph ph-question"></i></div>
                                    <div class="tooltip-box-content" style="left: 0; right: auto; width: 230px; font-weight: 400; text-align: left;">
                                        <div style="margin-bottom: 6px;"><strong style="color: #eab308;">Datas em Amarelo:</strong> Faltam 3 dias ou menos para o vencimento do lead.</div>
                                        <div><strong style="color: #ef4444;">Datas em Vermelho:</strong> Assinatura vencida.</div>
                                    </div>
                                </div>
                            </div>
                            <button id="close-mobile-modal" style="background: none; border: none; font-size: 20px; color: var(--color-text-mut); cursor: pointer;"><i class="ph ph-x"></i></button>
                        `;
                        modalContent.appendChild(headerDiv);

                        // Move o calendário existente para dentro do modal apenas visualmente
                        const originalDateDropdown = document.getElementById('date-dropdown');
                        let calendarClone = null;
                        
                        // Para não quebrar o calendário original, vamos usar o original e devolvê-lo depois?
                        // Ou melhor: O DateDropdown atual já é perfeito. Vamos apenas movê-lo para o modal no mobile!
                        const dateDropdownWrapper = document.createElement('div');
                        dateDropdownWrapper.id = 'mobile-calendar-wrapper';
                        dateDropdownWrapper.style.border = '1px solid var(--color-border)';
                        dateDropdownWrapper.style.borderRadius = 'var(--radius-md)';
                        dateDropdownWrapper.style.overflow = 'hidden';
                        modalContent.appendChild(dateDropdownWrapper);

                        // Sanfona de Status
                        const statusAccordion = document.createElement('div');
                        statusAccordion.style.border = '1px solid var(--color-border)';
                        statusAccordion.style.borderRadius = 'var(--radius-md)';
                        statusAccordion.style.overflow = 'hidden';
                        
                        const statusHeader = document.createElement('div');
                        statusHeader.style.padding = '12px 16px';
                        statusHeader.style.display = 'flex';
                        statusHeader.style.justifyContent = 'space-between';
                        statusHeader.style.alignItems = 'center';
                        statusHeader.style.backgroundColor = 'rgba(0,0,0,0.02)';
                        statusHeader.style.fontWeight = '500';
                        statusHeader.style.fontSize = '14px';
                        statusHeader.innerHTML = `<span>Status do Lead</span> <i class="ph ph-caret-down" style="transition: transform 0.3s"></i>`;
                        
                        const statusBody = document.createElement('div');
                        statusBody.style.padding = '12px 16px';
                        statusBody.style.display = 'none';
                        statusBody.style.flexDirection = 'column';
                        statusBody.style.gap = '8px';
                        statusBody.innerHTML = `
                            <div class="custom-option selected mobile-opt" data-value="Todos" style="padding: 10px; border-radius: 6px; cursor: pointer; font-size: 13px;">Todos os status</div>
                            <div class="custom-option mobile-opt" data-value="Em atendimento" style="padding: 10px; border-radius: 6px; cursor: pointer; font-size: 13px;">Em atendimento</div>
                            <div class="custom-option mobile-opt" data-value="Aguardando vendedor" style="padding: 10px; border-radius: 6px; cursor: pointer; font-size: 13px;">Aguardando vendedor</div>
                            <div class="custom-option mobile-opt" data-value="Em negociação" style="padding: 10px; border-radius: 6px; cursor: pointer; font-size: 13px;">Em negociação</div>
                            <div class="custom-option mobile-opt" data-value="Qualificado" style="padding: 10px; border-radius: 6px; cursor: pointer; font-size: 13px;">Qualificado</div>
                        `;

                        statusHeader.addEventListener('click', () => {
                            const isHidden = statusBody.style.display === 'none';
                            statusBody.style.display = isHidden ? 'flex' : 'none';
                            statusHeader.querySelector('i').style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
                        });

                        statusAccordion.appendChild(statusHeader);
                        statusAccordion.appendChild(statusBody);
                        modalContent.appendChild(statusAccordion);

                        // Botão Aplicar
                        const applyBtn = document.createElement('button');
                        applyBtn.className = 'btn primary full-width';
                        applyBtn.style.marginTop = '8px';
                        applyBtn.textContent = 'Aplicar Filtros';
                        modalContent.appendChild(applyBtn);

                        mobileModal.appendChild(modalContent);
                        document.body.appendChild(mobileModal);

                        // Funcionalidade de seleção de status no mobile
                        const mobileOpts = modalContent.querySelectorAll('.mobile-opt');
                        let selectedMobileStatus = 'Todos';
                        
                        mobileOpts.forEach(opt => {
                            opt.addEventListener('click', (ev) => {
                                mobileOpts.forEach(o => {
                                    o.classList.remove('selected');
                                    o.style.backgroundColor = '';
                                    o.style.color = '';
                                    o.style.fontWeight = '';
                                });
                                opt.classList.add('selected');
                                opt.style.backgroundColor = '#22c55e33';
                                opt.style.color = '#15803d';
                                opt.style.fontWeight = '600';
                                selectedMobileStatus = opt.getAttribute('data-value');
                            });
                        });

                        // Eventos para fechar o modal
                        const closeModal = () => {
                            mobileModal.style.opacity = '0';
                            mobileModal.style.visibility = 'hidden';
                            document.body.classList.remove('no-scroll');
                            
                            // Devolver o date-dropdown ao pai original
                            const origDateDropdown = document.getElementById('date-dropdown');
                            const dateWrapper = document.querySelector('.date-wrapper');
                            if (origDateDropdown && dateWrapper) {
                                origDateDropdown.style.position = 'absolute';
                                origDateDropdown.style.width = '340px';
                                origDateDropdown.style.opacity = '0';
                                origDateDropdown.style.visibility = 'hidden';
                                origDateDropdown.style.transform = 'translateY(-12px)';
                                origDateDropdown.classList.remove('show');
                                dateWrapper.appendChild(origDateDropdown);
                            }
                        };

                        headerDiv.querySelector('#close-mobile-modal').addEventListener('click', closeModal);
                        mobileModal.addEventListener('click', (ev) => {
                            if (ev.target === mobileModal) closeModal();
                        });

                        // Lógica do botão Aplicar
                        applyBtn.addEventListener('click', () => {
                            // Salva as datas selecionadas no local storage
                            if (window._calendarRangeStart && window._calendarRangeEnd) {
                                localStorage.setItem('calendar_filter_start', window._calendarRangeStart.toISOString());
                                localStorage.setItem('calendar_filter_end', window._calendarRangeEnd.toISOString());
                            } else if (window._calendarRangeStart) {
                                localStorage.setItem('calendar_filter_start', window._calendarRangeStart.toISOString());
                                localStorage.removeItem('calendar_filter_end');
                            } else {
                                localStorage.removeItem('calendar_filter_start');
                                localStorage.removeItem('calendar_filter_end');
                            }
                            
                            if (selectedMobileStatus === 'Todos') {
                                btn.classList.remove('filter-active');
                            } else {
                                btn.classList.add('filter-active');
                            }
                            
                            const tableRows = document.querySelectorAll('.data-table tbody tr');
                            tableRows.forEach(row => {
                                if (selectedMobileStatus === 'Todos') {
                                    row.style.display = '';
                                } else {
                                    const cells = row.querySelectorAll('td');
                                    if (cells.length > 3) {
                                        const badge = cells[3].querySelector('.badge');
                                        const rowStatus = badge ? badge.textContent.trim().toLowerCase() : cells[3].textContent.trim().toLowerCase();
                                        if (rowStatus === selectedMobileStatus.toLowerCase()) {
                                            row.style.display = '';
                                        } else {
                                            row.style.display = 'none';
                                        }
                                    }
                                }
                            });
                            
                            // Dispara atualização geral para as datas
                            window.dispatchEvent(new Event('calendarFilterChanged'));
                            if (typeof window.initDashboard === 'function') window.initDashboard();
                            if (typeof window.initLeads === 'function') window.initLeads();
                            if (typeof window.initRelatorios === 'function') window.initRelatorios();
                            
                            closeModal();
                        });
                    }

                    // Prepara e exibe o modal
                    const origDateDropdown = document.getElementById('date-dropdown');
                    if (origDateDropdown) {
                        origDateDropdown.style.position = 'static';
                        origDateDropdown.style.width = '100%';
                        origDateDropdown.style.boxShadow = 'none';
                        origDateDropdown.style.opacity = '1';
                        origDateDropdown.style.visibility = 'visible';
                        origDateDropdown.style.transform = 'none';
                        
                        // Esconder o botão de fechar original do calendário se existir, ou o footer
                        const calFooter = origDateDropdown.querySelector('.date-dropdown-footer');
                        if (calFooter) calFooter.style.display = 'none'; // Esconde para o modal (pois temos o botão aplicar lá embaixo)

                        document.getElementById('mobile-calendar-wrapper').appendChild(origDateDropdown);
                    }
                    
                    mobileModal.style.opacity = '1';
                    mobileModal.style.visibility = 'visible';
                    document.body.classList.add('no-scroll');
                    
                } else {
                    // Lógica Desktop Original
                    let dropdown = btn.querySelector('.status-filter-dropdown');
                    
                    if (!dropdown) {
                        dropdown = document.createElement('div');
                        dropdown.className = 'status-filter-dropdown card';
                        dropdown.style.position = 'absolute';
                        dropdown.style.top = '100%';
                        dropdown.style.right = '0';
                        dropdown.style.marginTop = '8px';
                        dropdown.style.minWidth = '200px';
                        dropdown.style.zIndex = '1000';
                        dropdown.style.padding = '12px';
                        dropdown.style.display = 'flex';
                        dropdown.style.flexDirection = 'column';
                        dropdown.style.gap = '8px';
                        dropdown.style.cursor = 'default';
                        
                        dropdown.innerHTML = `
                            <label style="font-weight: 500; font-size: 14px; margin-bottom: 8px; text-align: left; display: block; color: var(--color-text-main);">Status do Lead</label>
                            <div class="custom-select-container" style="display: flex; flex-direction: column; gap: 4px;">
                                <div class="custom-option selected" data-value="Todos">Todos os status</div>
                                <div class="custom-option" data-value="Em atendimento">Em atendimento</div>
                                <div class="custom-option" data-value="Aguardando vendedor">Aguardando vendedor</div>
                                <div class="custom-option" data-value="Em negociação">Em negociação</div>
                                <div class="custom-option" data-value="Qualificado">Qualificado</div>
                            </div>
                        `;
                        
                        btn.style.position = 'relative';
                        btn.appendChild(dropdown);
                        
                        dropdown.addEventListener('click', (ev) => ev.stopPropagation());
                        
                        const options = dropdown.querySelectorAll('.custom-option');
                        options.forEach(opt => {
                            opt.addEventListener('click', (ev) => {
                                options.forEach(o => o.classList.remove('selected'));
                                opt.classList.add('selected');
                                
                                const statusVal = opt.getAttribute('data-value');
                                
                                if (statusVal === 'Todos') {
                                    btn.classList.remove('filter-active');
                                } else {
                                    btn.classList.add('filter-active');
                                }
                                
                                const tableRows = document.querySelectorAll('.data-table tbody tr');
                                tableRows.forEach(row => {
                                    if (statusVal === 'Todos') {
                                        row.style.display = '';
                                    } else {
                                        const cells = row.querySelectorAll('td');
                                        if (cells.length > 3) {
                                            const badge = cells[3].querySelector('.badge');
                                            const rowStatus = badge ? badge.textContent.trim().toLowerCase() : cells[3].textContent.trim().toLowerCase();
                                            if (rowStatus === statusVal.toLowerCase()) {
                                                row.style.display = '';
                                            } else {
                                                row.style.display = 'none';
                                            }
                                        }
                                    }
                                });
                                
                                setTimeout(() => {
                                    if (dropdown) dropdown.style.display = 'none';
                                }, 250);
                            });
                        });
                        
                        const closeDropdown = (ev) => {
                            if (!btn.contains(ev.target)) {
                                dropdown.style.display = 'none';
                            }
                        };
                        document.addEventListener('click', closeDropdown);
                    } else {
                        dropdown.style.display = dropdown.style.display === 'none' ? 'flex' : 'none';
                    }
                }
            });
        }
    });
});

// Toggle Bot / Humano
const botSwitch = document.getElementById('bot-switch');
if (botSwitch) {
    botSwitch.addEventListener('change', (e) => {
        if (e.target.checked) {
            console.log("Robô Ativado - Automação em andamento");
            // Disparar Webhook para o n8n ligar o robô
        } else {
            console.log("Intervenção Humana - Robô Pausado");
            // Disparar Webhook para o n8n pausar o robô
        }
    });
}

// Dossiê Lateral
const taskItems = document.querySelectorAll('.task-item');
const dossierDrawer = document.getElementById('dossier-drawer');
const dossierOverlay = document.getElementById('dossier-overlay');
const dossierClose = document.getElementById('dossier-close');

function openDossier(title) {
    if (dossierDrawer && dossierOverlay) {
        document.getElementById('dossier-name').innerText = title;
        dossierDrawer.classList.add('open');
        dossierOverlay.classList.add('open');
        document.body.classList.add('no-scroll');
    }
}

function closeDossier() {
    if (dossierDrawer && dossierOverlay) {
        dossierDrawer.classList.remove('open');
        dossierOverlay.classList.remove('open');
        document.body.classList.remove('no-scroll');
    }
}

if (taskItems) {
    taskItems.forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', (e) => {
            // Não abrir se clicou no checkbox ou botões
            if (e.target.tagName.toLowerCase() === 'input' || e.target.closest('button')) {
                return;
            }
            const title = item.querySelector('.task-title').innerText;
            openDossier(title);
        });
    });
}

if (dossierClose) dossierClose.addEventListener('click', closeDossier);
if (dossierOverlay) dossierOverlay.addEventListener('click', closeDossier);

// ==========================================================================
//   Lógica do Teclado iOS Simulado e Chat Input
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const fakeInput = document.getElementById('fake-chat-input');
    const fakeTypingText = document.getElementById('fake-typing-text');
    const iosKeyboard = document.getElementById('ios-keyboard');
    const btnSend = document.getElementById('btn-send-message');
    const messagesContainer = document.getElementById('chat-messages-container');

    if (!fakeInput || !iosKeyboard || !btnSend || !messagesContainer) return;

    let currentText = '';

    // Mostra o teclado ao focar no input fake
    fakeInput.addEventListener('click', (e) => {
        e.stopPropagation();
        fakeInput.classList.add('active');
        if (window.innerWidth <= 768) {
            iosKeyboard.classList.add('show');
            // Rolar para o final do chat suavemente enquanto o teclado abre
            setTimeout(() => {
                messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
            }, 150);
        }
    });

    // Oculta teclado ao clicar fora
    document.addEventListener('click', (e) => {
        if (!fakeInput.contains(e.target) && !iosKeyboard.contains(e.target)) {
            fakeInput.classList.remove('active');
            iosKeyboard.classList.remove('show');
        }
    });

    function updateInput() {
        fakeTypingText.innerText = currentText;
        if (currentText.length > 0) {
            fakeInput.classList.add('has-text');
        } else {
            fakeInput.classList.remove('has-text');
        }
        // Auto-scroll para acompanhar a digitação
        fakeTypingText.scrollTop = fakeTypingText.scrollHeight;
        
        if (isShifted) {
            iosKeyboard.classList.remove('lowercase');
        } else {
            iosKeyboard.classList.add('lowercase');
        }
    }

    // --- Suporte a Teclado Físico (Desktop) ---
    document.addEventListener('keydown', (e) => {
        if (!fakeInput.classList.contains('active')) return;

        if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta' || e.key === 'CapsLock' || e.key === 'Tab') return;

        if (e.key === 'Backspace') {
            currentText = currentText.slice(0, -1);
            if (currentText.length === 0) isShifted = true;
            updateInput();
            e.preventDefault(); // Evitar voltar página no navegador
        } else if (e.key === 'Enter') {
            btnSend.click();
            e.preventDefault();
        } else if (e.key.length === 1) { // Letra normal ou número/símbolo
            currentText += e.key;
            isShifted = false;
            updateInput();
            e.preventDefault();
        }
    });

    // --- Lógica do Teclado Virtual ---
    const keys = iosKeyboard.querySelectorAll('.key:not(.special)');
    let isShifted = true; // Primeira letra Maiúscula

    function triggerHaptic() {
        if (navigator.vibrate) {
            navigator.vibrate(15);
        }
    }
    function checkAutocorrect() {
        const bar = document.getElementById('autocorrect-bar');
        const suggestionElement = document.getElementById('autocorrect-suggestion');
        if (!bar || !suggestionElement) return;

        const words = currentText.split(/\s+/);
        const lastWord = words[words.length - 1].toLowerCase();

        const corrections = {
            'tido': 'tudo',
            'cmo': 'como',
            'ta': 'tá',
            'sinhor': 'senhor',
            'sihnor': 'senhor',
            'senho': 'senhor',
            'vc': 'você',
            'vcs': 'vocês',
            'pq': 'porque',
            'tb': 'também',
            'tbm': 'também',
            'obg': 'obrigado',
            'nd': 'nada',
            'qdo': 'quando',
            'mto': 'muito',
            'muitu': 'muito',
            'td': 'tudo',
            'bomd': 'bom dia',
            'boad': 'boa tarde',
            'boan': 'boa noite',
            'comigu': 'comigo',
            'vdd': 'verdade',
            'q': 'que',
            'nao': 'não',
            'n': 'não',
            'ola': 'olá',
            'eh': 'é',
            'p/': 'para',
            'pra': 'para',
            'agr': 'agora',
            'cmg': 'comigo',
            'ctz': 'certeza',
            'vlw': 'valeu',
            'att': 'atenciosamente',
            'fds': 'fim de semana',
            'blz': 'beleza',
            'qm': 'quem',
            'oq': 'o que',
            'aki': 'aqui',
            'sin': 'sim',
        };

        if (corrections[lastWord]) {
            suggestionElement.innerText = corrections[lastWord];
            bar.style.display = 'flex';

            suggestionElement.onclick = (e) => {
                e.stopPropagation();
                triggerHaptic();
                words[words.length - 1] = corrections[lastWord];
                currentText = words.join(' ') + ' '; // Adiciona espaço após corrigir
                updateInput();
                bar.style.display = 'none';
                fakeInput.classList.add('active');
            };
        } else {
            bar.style.display = 'none';
        }
    }

    const accentsMap = {
        'A': ['A', 'Á', 'À', 'Â', 'Ã'],
        'E': ['E', 'É', 'Ê', 'È'],
        'I': ['I', 'Í', 'Ì'],
        'O': ['O', 'Ó', 'Ô', 'Õ', 'Ò'],
        'U': ['U', 'Ú', 'Ü', 'Ù'],
        'C': ['C', 'Ç'],
        'N': ['N', 'Ñ']
    };
    let activePopup = null;

    // Fechar popup se clicar fora dele
    document.addEventListener('touchstart', (e) => {
        if (activePopup && !activePopup.contains(e.target) && !e.target.closest('.key')) {
            activePopup.remove();
            activePopup = null;
        }
    }, { passive: true });
    
    document.addEventListener('click', (e) => {
        if (activePopup && !activePopup.contains(e.target) && !e.target.closest('.key')) {
            activePopup.remove();
            activePopup = null;
        }
    });

    keys.forEach(key => {
        let pressTimeout;
        let isLongPress = false;
        
        const startPress = (e) => {
            if (activePopup && !activePopup.contains(e.target)) {
                activePopup.remove();
                activePopup = null;
            }
            
            isLongPress = false;
            let char = key.dataset.char || key.innerText.trim();
            if (!key.dataset.char) key.dataset.char = char;
            
            if (accentsMap[char]) {
                pressTimeout = setTimeout(() => {
                    isLongPress = true;
                    triggerHaptic();
                    
                    if (activePopup) activePopup.remove();
                    
                    const popup = document.createElement('div');
                    popup.className = 'accent-popup';
                    popup.style.position = 'absolute';
                    popup.style.bottom = '115%';
                    popup.style.left = '50%';
                    popup.style.transform = 'translateX(-50%)';
                    popup.style.background = '#3a3a3c'; // Cinza escuro
                    popup.style.borderRadius = '8px';
                    popup.style.padding = '6px';
                    popup.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                    popup.style.display = 'flex';
                    popup.style.gap = '2px';
                    popup.style.zIndex = '1000';
                    
                    const arrow = document.createElement('div');
                    arrow.style.position = 'absolute';
                    arrow.style.bottom = '-5px';
                    arrow.style.left = '50%';
                    arrow.style.transform = 'translateX(-50%) rotate(45deg)';
                    arrow.style.width = '14px';
                    arrow.style.height = '14px';
                    arrow.style.background = '#3a3a3c';
                    arrow.style.zIndex = '-1';
                    arrow.style.borderRadius = '2px';
                    popup.appendChild(arrow);
                    
                    accentsMap[char].forEach(opt => {
                        const btn = document.createElement('button');
                        const displayChar = (!isShifted) ? opt.toLowerCase() : opt;
                        btn.innerText = displayChar;
                        btn.style.width = '36px';
                        btn.style.height = '46px';
                        btn.style.border = 'none';
                        btn.style.background = 'transparent';
                        btn.style.fontSize = '22px';
                        btn.style.fontFamily = "'Inter', sans-serif";
                        btn.style.borderRadius = '6px';
                        btn.style.color = '#ffffff'; 
                        btn.style.cursor = 'pointer';
                        btn.style.textTransform = 'none'; // Evita herdar uppercase do botão pai
                        
                        btn.addEventListener('touchstart', (ev) => {
                            ev.stopPropagation();
                            btn.style.background = '#5a5a5e';
                        });
                        btn.addEventListener('touchend', (ev) => {
                            ev.stopPropagation();
                            ev.preventDefault();
                            currentText += displayChar;
                            if (displayChar.match(/[a-zA-ZÀ-ÿ]/)) isShifted = false;
                            updateInput();
                            checkAutocorrect();
                            triggerHaptic();
                            fakeInput.classList.add('active');
                            popup.remove();
                            activePopup = null;
                        });
                        btn.addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            ev.preventDefault();
                            currentText += displayChar;
                            if (displayChar.match(/[a-zA-ZÀ-ÿ]/)) isShifted = false;
                            updateInput();
                            checkAutocorrect();
                            triggerHaptic();
                            fakeInput.classList.add('active');
                            popup.remove();
                            activePopup = null;
                        });
                        popup.appendChild(btn);
                    });
                    
                    key.style.position = 'relative';
                    key.appendChild(popup);
                    
                    // Ajuste caso vaze pelas bordas da tela
                    const rect = popup.getBoundingClientRect();
                    if (rect.left < 8) {
                        popup.style.left = '0';
                        popup.style.transform = 'none';
                        arrow.style.left = '18px'; // move seta para alinhar com tecla
                        arrow.style.transform = 'rotate(45deg)';
                    } else if (rect.right > window.innerWidth - 8) {
                        popup.style.left = 'auto';
                        popup.style.right = '0';
                        popup.style.transform = 'none';
                        arrow.style.left = 'auto';
                        arrow.style.right = '18px';
                        arrow.style.transform = 'rotate(45deg)';
                    }
                    
                    activePopup = popup;
                    
                }, 400); // 400ms para considerar long press
            }
        };
        
        const cancelPress = () => {
            clearTimeout(pressTimeout);
        };
        
        key.addEventListener('contextmenu', (e) => e.preventDefault()); // Evita menu nativo no mobile
        
        key.addEventListener('mousedown', startPress);
        key.addEventListener('touchstart', startPress, { passive: true });
        
        key.addEventListener('mouseup', cancelPress);
        key.addEventListener('mouseleave', cancelPress);
        key.addEventListener('touchend', cancelPress);
        key.addEventListener('touchcancel', cancelPress);

        key.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isLongPress) {
                e.preventDefault();
                return;
            }
            
            let char = key.dataset.char || key.innerText.trim();
            if (!key.dataset.char) key.dataset.char = char;
            
            if (key.classList.contains('space')) {
                char = ' ';
            } else {
                if (!isShifted && char.match(/[a-zA-Z]/)) char = char.toLowerCase();
                if (char.match(/[a-zA-Z]/)) isShifted = false;
            }

            currentText += char;
            updateInput();
            checkAutocorrect();
            triggerHaptic();
            fakeInput.classList.add('active');
        });
    });

    // Teclas Backspace Contínuo
    const backspaces = document.querySelectorAll('.key-backspace');
    backspaces.forEach(btn => {
        let backspaceInterval;
        let backspaceTimeout;

        const startBackspace = (e) => {
            e.stopPropagation();
            e.preventDefault(); // Evitar comportamento padrão
            triggerHaptic();

            const apagarChar = () => {
                if (currentText.length > 0) {
                    currentText = currentText.slice(0, -1);
                    if (currentText.length === 0) isShifted = true;
                    updateInput();
                    checkAutocorrect();
                    fakeInput.classList.add('active');
                }
            };

            // Apaga o primeiro char imediatamente
            apagarChar();

            // Espera um pouco antes de apagar continuamente
            backspaceTimeout = setTimeout(() => {
                backspaceInterval = setInterval(() => {
                    apagarChar();
                    triggerHaptic();
                }, 50); // Apaga a cada 50ms
            }, 400); // Demora 400ms para iniciar o modo contínuo
        };

        const stopBackspace = () => {
            clearTimeout(backspaceTimeout);
            clearInterval(backspaceInterval);
        };

        btn.addEventListener('mousedown', startBackspace);
        btn.addEventListener('touchstart', startBackspace, { passive: false });

        btn.addEventListener('mouseup', stopBackspace);
        btn.addEventListener('mouseleave', stopBackspace);
        btn.addEventListener('touchend', stopBackspace);
        btn.addEventListener('touchcancel', stopBackspace);
    });

    // Alternar Layouts (ABC / 123)
    const kbLetters = document.getElementById('keyboard-letters');
    const kbNumbers = document.getElementById('keyboard-numbers');

    const btnNum = document.querySelector('.key-toggle-num');
    const btnAbc = document.querySelector('.key-toggle-abc');

    if (btnNum && kbLetters && kbNumbers) {
        btnNum.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerHaptic();
            kbLetters.style.display = 'none';
            kbNumbers.style.display = 'flex';
            fakeInput.classList.add('active');
        });
    }

    if (btnAbc && kbLetters && kbNumbers) {
        btnAbc.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerHaptic();
            kbNumbers.style.display = 'none';
            kbLetters.style.display = 'flex';
            fakeInput.classList.add('active');
        });
    }

    // Botão Enter/Retorno
    const btnEnters = document.querySelectorAll('.btn-send-enter');
    btnEnters.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentText += '\n';
            updateInput();
            fakeInput.classList.add('active');
        });
    });

    // Botão de Enviar
    btnSend.addEventListener('click', () => {
        if (currentText.trim() === '') return; // Não envia vazio

        const now = new Date();
        const timeString = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

        // Cria o balão verde
        const msgDiv = document.createElement('div');
        msgDiv.style.alignSelf = 'flex-end';
        msgDiv.style.background = '#d9fdd3';
        msgDiv.style.padding = '6px 10px';
        msgDiv.style.borderRadius = '8px 0 8px 8px';
        msgDiv.style.maxWidth = '90%';
        msgDiv.style.boxShadow = '0 1px 1px rgba(0,0,0,0.1)';
        msgDiv.style.position = 'relative';
        msgDiv.style.zIndex = '2';
        msgDiv.style.marginBottom = '12px';

        msgDiv.innerHTML = `
            <div style="position: absolute; top: 0; right: -6px; width: 0; height: 0; border-top: 0px solid transparent; border-left: 6px solid #d9fdd3; border-bottom: 6px solid transparent;"></div>
            <p style="margin: 0; font-size: 13px; color: #111; line-height: 1.35; word-wrap: break-word;">${currentText}</p>
            <div style="text-align: right; margin-top: 2px; margin-bottom: -2px; display: flex; justify-content: flex-end; align-items: center; gap: 4px;">
                <span style="font-size: 10px; color: #667781;">${timeString}</span>
                <i class="ph-fill ph-check" style="color: #667781; font-size: 14px;"></i>
            </div>
        `;

        messagesContainer.appendChild(msgDiv);

        // Rola para baixo suavemente
        messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });

        // Limpa input e reseta teclado
        currentText = '';
        isShifted = true;
        updateInput();

        if (kbLetters && kbNumbers) {
            kbNumbers.style.display = 'none';
            kbLetters.style.display = 'flex';
        }

        // Ocultar teclado
        fakeInput.classList.remove('active');
        iosKeyboard.classList.remove('show');
    });
});

// --- Lógica da Lista em Acordeão (Accordion) ---
document.addEventListener('DOMContentLoaded', () => {
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const currentItem = header.parentElement;
            const isCurrentlyActive = currentItem.classList.contains('active');

            // Fecha todos os outros acordeões
            document.querySelectorAll('.accordion-item').forEach(item => {
                item.classList.remove('active');
            });

            // Se não estava ativo antes, abre ele (comportamento de toggle)
            if (!isCurrentlyActive) {
                currentItem.classList.add('active');
            }
        });
    });
});
