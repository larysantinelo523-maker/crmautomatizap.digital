// ===================================================================
// SISTEMA DE NOTIFICAÇÕES NATIVAS, SOM E PWA - AUTOMATIZAP CRM
// ===================================================================

import { supabase } from './supabase.js';

// --- 1. SÍNTESE DE ÁUDIO VIA WEB AUDIO API (SOM LIMPO NATIVO SEM DEPENDÊNCIA DE ARQUIVO) ---
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
    return audioCtx;
}

// Desbloqueia o contexto de áudio na primeira interação do usuário (touch ou click no celular)
function unlockAudioContext() {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
    }
}
['click', 'touchstart', 'touchend', 'keydown'].forEach(evt => {
    document.addEventListener(evt, unlockAudioContext, { once: true, passive: true });
});

export function playChimeSound(type = 'message') {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        const now = ctx.currentTime;

        if (type === 'lead') {
            // Arpeggio comemorativo de 3 notas (Dó5 - Mi5 - Sol5) para novos leads
            const notes = [
                { freq: 523.25, time: now, duration: 0.16 },
                { freq: 659.25, time: now + 0.08, duration: 0.16 },
                { freq: 783.99, time: now + 0.16, duration: 0.40 }
            ];

            notes.forEach(n => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(n.freq, n.time);

                gain.gain.setValueAtTime(0.0001, n.time);
                gain.gain.exponentialRampToValueAtTime(0.35, n.time + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, n.time + n.duration);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(n.time);
                osc.stop(n.time + n.duration + 0.05);
            });
        } else {
            // Som suave de mensagem estilo WhatsApp / Slack (Lá5 -> Mi6)
            // Tom 1
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(880, now); // A5

            gain1.gain.setValueAtTime(0.0001, now);
            gain1.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
            gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.3);

            // Tom 2 (Quinta perfeita superior)
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1318.51, now + 0.09); // E6

            gain2.gain.setValueAtTime(0.0001, now + 0.09);
            gain2.gain.exponentialRampToValueAtTime(0.40, now + 0.11);
            gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.09);
            osc2.stop(now + 0.5);
        }
    } catch (e) {
        console.warn('Erro ao reproduzir som:', e);
    }
}

// Vibração tátil no celular
export function vibrateDevice(pattern = [200, 100, 200]) {
    try {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    } catch (e) {}
}

// --- 2. TOAST ELEGANTE IN-APP ---
let toastContainer = null;

function getToastContainer() {
    if (!toastContainer || !document.body.contains(toastContainer)) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'crm-toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 999999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
            max-width: 380px;
            width: calc(100% - 40px);
        `;
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

export function showInAppToast({ title, body, icon = 'ph-bell-ringing', url = null, duration = 5000, type = 'info' }) {
    const container = getToastContainer();
    const toast = document.createElement('div');
    toast.style.cssText = `
        pointer-events: auto;
        background: var(--color-bg-card, #ffffff);
        color: var(--color-text-main, #1e293b);
        border: 1px solid var(--color-border, #e2e8f0);
        border-left: 4px solid ${type === 'lead' ? '#f59e0b' : '#00a884'};
        border-radius: 10px;
        padding: 14px 16px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        display: flex;
        align-items: flex-start;
        gap: 12px;
        cursor: ${url ? 'pointer' : 'default'};
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        backdrop-filter: blur(8px);
    `;

    toast.innerHTML = `
        <div style="width: 36px; height: 36px; border-radius: 50%; background: ${type === 'lead' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0, 168, 132, 0.15)'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: ${type === 'lead' ? '#d97706' : '#00a884'}; font-size: 18px;">
            <i class="ph ${icon}"></i>
        </div>
        <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; font-size: 13px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--color-text-main, #1e293b);">${title}</div>
            <div style="font-size: 12px; color: var(--color-text-mut, #64748b); line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${body}</div>
        </div>
        <button style="background: none; border: none; color: var(--color-text-mut, #94a3b8); cursor: pointer; padding: 2px; font-size: 16px; line-height: 1;" title="Fechar">
            <i class="ph ph-x"></i>
        </button>
    `;

    const closeBtn = toast.querySelector('button');
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        dismissToast(toast);
    };

    if (url) {
        toast.onclick = () => {
            window.location.href = url;
        };
    }

    container.appendChild(toast);

    // Anima entrada
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    });

    // Auto fechar
    const timer = setTimeout(() => {
        dismissToast(toast);
    }, duration);

    function dismissToast(el) {
        clearTimeout(timer);
        el.style.transform = 'translateX(100%)';
        el.style.opacity = '0';
        setTimeout(() => {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 300);
    }
}

// --- 3. DISPARO DE NOTIFICAÇÃO NATIVA (SERVICE WORKER OU NOTIFICATION API) ---
export async function showSystemNotification({ title, body, icon = '/icon-192.png', url = '/index.html', tag = null, type = 'message' }) {
    // 1. Sempre toca som e vibra
    playChimeSound(type);
    vibrateDevice(type === 'lead' ? [300, 100, 300] : [200, 100, 200]);

    // 2. Sempre mostra o toast in-app (garante que quem está no app vê imediatamente)
    showInAppToast({
        title,
        body,
        icon: type === 'lead' ? 'ph-user-plus' : 'ph-chat-circle-dots',
        url,
        type
    });

    // 3. Se a permissão nativa estiver concedida, dispara o banner do sistema operacional / telefone
    if ('Notification' in window && Notification.permission === 'granted') {
        const notifTag = tag || 'crm-' + Date.now();
        
        try {
            // Prioridade: Service Worker (exibição rica na barra de status e tela de bloqueio do celular)
            if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.ready;
                if (reg && reg.showNotification) {
                    await reg.showNotification(title, {
                        body: body || '',
                        icon: icon,
                        badge: '/icon-192.png',
                        vibrate: [200, 100, 200],
                        tag: notifTag,
                        renotify: true,
                        data: { url: url }
                    });
                    return true;
                }
            }
        } catch (swErr) {
            console.warn('Erro ao disparar notificação via Service Worker:', swErr);
        }

        try {
            // Fallback nativo
            const n = new Notification(title, {
                body: body,
                icon: icon,
                badge: '/icon-192.png',
                tag: notifTag
            });
            n.onclick = () => {
                window.focus();
                if (url) window.location.href = url;
                n.close();
            };
            return true;
        } catch (e) {
            console.warn('Erro ao disparar Notification nativa:', e);
        }
    }

    return false;
}

// --- 4. SOLICITAÇÃO DE PERMISSÃO E GERENCIAMENTO DE STATUS ---
export async function requestNotificationPermission() {
    unlockAudioContext();

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS && !isStandalone) {
        showInAppToast({
            title: 'Instale o App no iPhone',
            body: 'Toque no ícone de Compartilhar no Safari e selecione "Adicionar à Tela de Início" para liberar as notificações no seu iPhone.',
            type: 'lead',
            duration: 9000
        });
        return false;
    }

    if (!('Notification' in window)) {
        showInAppToast({
            title: 'Navegador incompatível',
            body: 'Seu navegador não tem suporte a notificações nativas.',
            type: 'warning'
        });
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        updateNotificationUI();

        if (permission === 'granted') {
            playChimeSound('lead');
            vibrateDevice([200, 100, 200]);

            showInAppToast({
                title: '🔔 Notificações Ativadas!',
                body: 'Você receberá avisos sonoros e notificações na tela sempre que chegar algo novo!',
                type: 'lead'
            });

            // Dispara notificação de boas-vindas para o usuário já ver o banner
            await showSystemNotification({
                title: '🔔 AutomatiZAP Conectado!',
                body: 'Notificações sonoras e nativas ativadas com sucesso.',
                url: '/index.html',
                tag: 'welcome-notification',
                type: 'lead'
            });

            return true;
        } else if (permission === 'denied') {
            showInAppToast({
                title: 'Permissão Bloqueada',
                body: 'Para receber alertas, toque no cadeado ao lado do link do site e permita as Notificações.',
                type: 'warning',
                duration: 8000
            });
            return false;
        }
    } catch (err) {
        console.error('Erro ao pedir permissão:', err);
    }
    return false;
}

// --- MODO DE TESTE AUTOMÁTICO (A CADA 2 MINUTOS) ---
let testLoopInterval = null;
let testLoopCounter = 0;

export function isTestModeActive() {
    return localStorage.getItem('crm_test_notif_active') === 'true';
}

const CLIENT_MOCK_NOTIFICATIONS = [
    { title: '🔥 [TESTE] Novo Lead Recebido!', body: 'Mariana Silva acabou de mandar mensagem! Interesse: Automação WhatsApp', type: 'lead' },
    { title: '💬 [TESTE] Nova Mensagem no WhatsApp', body: 'Lucas Pereira: "Olá! Gostaria de saber os valores dos planos."', type: 'message' },
    { title: '🔥 [TESTE] Novo Lead Qualificado!', body: 'Roberto Costa entrou em contato! Orçamento: R$ 5.000+', type: 'lead' },
    { title: '💬 [TESTE] Nova Mensagem no WhatsApp', body: 'Camila Lima: "Vocês atendem no final de semana?"', type: 'message' },
    { title: '📅 [TESTE] Nova Reunião Agendada!', body: 'Apresentação com Dr. Paulo confirmada para amanhã às 14:00.', type: 'lead' }
];

export function triggerSingleMockNotification() {
    const item = CLIENT_MOCK_NOTIFICATIONS[testLoopCounter % CLIENT_MOCK_NOTIFICATIONS.length];
    testLoopCounter++;

    showSystemNotification({
        title: item.title,
        body: item.body,
        url: '/conversas.html',
        tag: 'test-loop-' + Date.now(),
        type: item.type
    });
}

export function startTestMode(intervalMinutes = 2) {
    localStorage.setItem('crm_test_notif_active', 'true');
    unlockAudioContext();

    // 1. Envia comando ao Service Worker (roda em segundo plano no celular)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
            if (reg.active) {
                reg.active.postMessage({
                    action: 'START_TEST_LOOP',
                    intervalMs: intervalMinutes * 60 * 1000,
                    immediate: true
                });
            }
        }).catch(() => {});
    }

    // 2. Mantém loop local
    if (testLoopInterval) clearInterval(testLoopInterval);
    testLoopInterval = setInterval(() => {
        triggerSingleMockNotification();
    }, intervalMinutes * 60 * 1000);

    triggerSingleMockNotification();

    showInAppToast({
        title: '▶ Teste Automático Iniciado!',
        body: `Você receberá notificações a cada ${intervalMinutes} minutos mesmo fora do app. Toque em Pausar para encerrar.`,
        type: 'lead',
        duration: 7000
    });

    updateNotificationUI();
}

export function stopTestMode() {
    localStorage.setItem('crm_test_notif_active', 'false');

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
            if (reg.active) {
                reg.active.postMessage({
                    action: 'STOP_TEST_LOOP'
                });
            }
        }).catch(() => {});
    }

    if (testLoopInterval) {
        clearInterval(testLoopInterval);
        testLoopInterval = null;
    }

    showInAppToast({
        title: '⏸ Teste Automático Pausado',
        body: 'O envio de notificações de teste foi interrompido.',
        type: 'info',
        duration: 4000
    });

    updateNotificationUI();
}

export function triggerCountdownTest(seconds = 5) {
    unlockAudioContext();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
            if (reg.active) {
                reg.active.postMessage({
                    action: 'TRIGGER_IN_SECONDS',
                    seconds: seconds
                });
            }
        }).catch(() => {});
    }

    showInAppToast({
        title: '⚡ Bloqueie o celular AGORA!',
        body: `A notificação de teste chegará em ${seconds} segundos na tela de bloqueio do seu celular.`,
        type: 'lead',
        duration: 5000
    });

    setTimeout(() => {
        playChimeSound('lead');
        vibrateDevice([300, 100, 300]);
    }, seconds * 1000);
}

// --- 5. ATUALIZAR UI NO DROPDOWN DE NOTIFICAÇÕES ---
export function updateNotificationUI() {
    const dropdown = document.getElementById('notification-dropdown');
    if (!dropdown) return;

    let bar = document.getElementById('crm-notif-permission-bar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'crm-notif-permission-bar';
        const header = dropdown.querySelector('.notif-header');
        if (header && header.nextSibling) {
            dropdown.insertBefore(bar, header.nextSibling);
        } else {
            dropdown.prepend(bar);
        }
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS && !isStandalone) {
        bar.innerHTML = `
            <div style="padding: 12px 16px; background: rgba(0, 168, 132, 0.08); border-bottom: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="ph ph-apple-logo" style="font-size: 16px; color: #00a884;"></i>
                    <div style="font-size: 12px; font-weight: 600; color: var(--color-text-main);">Ativar alertas no iPhone:</div>
                </div>
                <div style="font-size: 11px; color: var(--color-text-mut); line-height: 1.4;">
                    1. Toque em <strong>Compartilhar</strong> (<i class="ph ph-export"></i> no Safari)<br>
                    2. Toque em <strong>"Adicionar à Tela de Início"</strong><br>
                    3. Abra pelo ícone do app na tela do celular!
                </div>
            </div>
        `;
        return;
    }

    const permission = ('Notification' in window) ? Notification.permission : 'unsupported';

    if (permission === 'granted') {
        bar.innerHTML = `
            <div style="padding: 10px 16px; background: rgba(0, 168, 132, 0.05); border-bottom: 1px solid var(--color-border); display: flex; align-items: center; justify-content: space-between;">
                <!-- Status dos Alertas -->
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; display: inline-block; box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);"></span>
                    <span style="font-size: 12px; font-weight: 600; color: #10b981;">Alertas Conectados</span>
                </div>
                <button id="crm-btn-test-sound" style="background: var(--color-bg-card, #fff); border: 1px solid rgba(16, 185, 129, 0.4); color: #10b981; padding: 4px 10px; font-size: 11px; border-radius: 6px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s;">
                    <i class="ph ph-speaker-high"></i> Ouvir som
                </button>
            </div>
        `;

        const testBtn = document.getElementById('crm-btn-test-sound');
        if (testBtn) {
            testBtn.onclick = (e) => {
                e.stopPropagation();
                playChimeSound('message');
                vibrateDevice([150, 80, 150]);
                showInAppToast({
                    title: '🔊 Som do AutomatiZAP',
                    body: 'Som de notificação funcionando perfeitamente!',
                    type: 'info'
                });
            };
        }
    } else if (permission === 'denied') {
        bar.innerHTML = `
            <div style="padding: 10px 16px; background: rgba(239, 68, 68, 0.08); border-bottom: 1px solid var(--color-border); display: flex; align-items: center; gap: 8px;">
                <i class="ph ph-bell-slash" style="font-size: 16px; color: #ef4444; flex-shrink: 0;"></i>
                <div style="font-size: 11px; color: var(--color-text-mut); line-height: 1.3;">
                    Notificações bloqueadas. <span style="color: var(--color-text-main); font-weight: 500;">Clique no cadeado</span> na barra do navegador para ativar.
                </div>
            </div>
        `;
    } else {
        // 'default' ou não solicitado ainda
        bar.innerHTML = `
            <div style="padding: 12px 16px; background: rgba(0, 168, 132, 0.08); border-bottom: 1px solid var(--color-border); display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="ph ph-bell-ringing" style="font-size: 18px; color: #00a884; flex-shrink: 0;"></i>
                    <div style="font-size: 12px; font-weight: 500; color: var(--color-text-main);">Ativar notificações no celular</div>
                </div>
                <button id="crm-btn-activate-notif" class="btn primary" style="padding: 6px 14px; font-size: 11px; border-radius: 6px; font-weight: 600; cursor: pointer; white-space: nowrap; background: #00a884; color: #fff; border: none;">
                    Ativar
                </button>
            </div>
        `;

        const activateBtn = document.getElementById('crm-btn-activate-notif');
        if (activateBtn) {
            activateBtn.onclick = (e) => {
                e.stopPropagation();
                requestNotificationPermission();
            };
        }
    }
}

// --- 6. INTEGRAÇÃO REALTIME COM SUPABASE (MENSAGENS E NOVOS LEADS) ---
let isRealtimeListening = false;

export function initRealtimeNotifications() {
    if (isRealtimeListening || window.__crm_realtime_notifs_active) return;
    window.__crm_realtime_notifs_active = true;
    isRealtimeListening = true;

    // Escuta novas mensagens globais (tabela mensagens)
    supabase
        .channel('crm-realtime-global-mensagens')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'mensagens' },
            async (payload) => {
                const msg = payload.new;
                if (!msg) return;

                // Só notifica se foi uma mensagem recebida do CLIENTE
                if (msg.remetente === 'cliente') {
                    // Se o usuário já está com a tela focada conversando diretamente com este lead, toca apenas o plim suave
                    const isViewingThisLead = window.location.pathname.includes('conversas') && 
                                              document.hasFocus() && 
                                              window.currentLeadId === msg.lead_id;
                    if (isViewingThisLead) {
                        playChimeSound('message');
                        return;
                    }

                    let leadName = 'Cliente';

                    // Tenta achar o nome do lead na memória local
                    if (window.localLeadsData && Array.isArray(window.localLeadsData)) {
                        const found = window.localLeadsData.find(l => l.id === msg.lead_id);
                        if (found && found.nome) leadName = found.nome;
                    } else if (window.dashboardAllLeads && Array.isArray(window.dashboardAllLeads)) {
                        const found = window.dashboardAllLeads.find(l => l.id === msg.lead_id);
                        if (found && found.nome) leadName = found.nome;
                    }

                    // Se não achou na memória, busca no Supabase
                    if (leadName === 'Cliente') {
                        try {
                            const { data: lead } = await supabase.from('leads').select('nome').eq('id', msg.lead_id).single();
                            if (lead && lead.nome) leadName = lead.nome;
                        } catch (e) {}
                    }

                    // Dispara notificação com som
                    showSystemNotification({
                        title: `💬 ${leadName}`,
                        body: msg.conteudo || 'Nova mensagem recebida no WhatsApp',
                        url: `conversas.html?lead=${msg.lead_id}`,
                        tag: `msg-${msg.id}`,
                        type: 'message'
                    });

                    // Atualiza pontinho vermelho na tela
                    const notifDot = document.querySelector('.notification-dot');
                    if (notifDot) notifDot.style.display = 'block';
                }
            }
        )
        .subscribe();

    // Escuta novos leads globais (tabela leads)
    supabase
        .channel('crm-realtime-global-new-leads')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'leads' },
            (payload) => {
                const lead = payload.new;
                if (!lead) return;

                const leadName = lead.nome || 'Novo Lead';
                const interesse = lead.interesse ? ` • ${lead.interesse}` : '';

                // Dispara notificação festiva de lead com som exclusivo
                showSystemNotification({
                    title: `🔥 Novo Lead Recebido!`,
                    body: `${leadName}${interesse} acabou de entrar em contato!`,
                    url: `conversas.html?lead=${lead.id}`,
                    tag: `lead-${lead.id}`,
                    type: 'lead'
                });

                // Atualiza pontinho vermelho na tela
                const notifDot = document.querySelector('.notification-dot');
                if (notifDot) notifDot.style.display = 'block';

                // Se estiver no dashboard da Visão Geral, atualiza tabela suavemente
                if (typeof window.initDashboard === 'function') {
                    window.initDashboard();
                }
            }
        )
        .subscribe();

    console.log('✅ Sistema de Notificações em Tempo Real AutomatiZAP ativo!');
}

// --- 7. REGISTRO DO SERVICE WORKER COM SUPORTE TOTAL A PWA ---
export function registerPwaServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .then((reg) => {
                    console.log('ServiceWorker registrado com sucesso:', reg.scope);
                })
                .catch((err) => {
                    console.log('Falha ao registrar ServiceWorker:', err);
                });
        });
    }
}

// --- 8. PREPARAÇÃO PARA PUSH OFFLINE (ONESIGNAL SDK) ---
// Quando você criar uma conta gratuita na OneSignal, basta definir window.ONESIGNAL_APP_ID no CRM
export function setupOneSignal() {
    const appId = window.ONESIGNAL_APP_ID || localStorage.getItem('onesignal_app_id');
    if (!appId) return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    document.head.appendChild(script);

    window.OneSignalDeferred.push(async function(OneSignal) {
        await OneSignal.init({
            appId: appId,
            notifyButton: {
                enable: false
            }
        });
        console.log('OneSignal Push Inicializado com sucesso!');
    });
}

// Inicializa a UI do dropdown automaticamente quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    updateNotificationUI();
    registerPwaServiceWorker();
    setupOneSignal();

    // Desativa qualquer loop de teste residual
    try {
        localStorage.removeItem('crm_test_notif_active');
        if (testLoopInterval) clearInterval(testLoopInterval);
    } catch(e) {}

    const notifBtn = document.getElementById('notification-btn');
    if (notifBtn) {
        notifBtn.addEventListener('click', () => {
            setTimeout(updateNotificationUI, 50);
        });
    }
});

// Expõe globalmente para fácil acesso
window.crmNotifications = {
    playChimeSound,
    vibrateDevice,
    showInAppToast,
    showSystemNotification,
    requestNotificationPermission,
    updateNotificationUI,
    initRealtimeNotifications,
    startTestMode,
    stopTestMode,
    isTestModeActive,
    triggerCountdownTest
};

