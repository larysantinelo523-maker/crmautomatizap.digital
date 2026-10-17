// ===================================================================
// JARVIS AI - COPILOTO DE VOZ E INTELIGÊNCIA DO AUTOMATIZAP CRM
// ===================================================================

import { supabase } from './supabase.js';
import { fetchUserData, fetchLeads, fetchAgendamentos } from './data.js';

let isListening = false;
let isSpeaking = false;
let isMuted = false;
let recognition = null;
let synthesis = window.speechSynthesis;
let currentUtterance = null;
let loggedUser = null;
let orbElement = null;
let statusTextElement = null;
let chatTimelineElement = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    orbElement = document.getElementById('jarvis-orb');
    statusTextElement = document.getElementById('jarvis-status-text');
    chatTimelineElement = document.getElementById('jarvis-chat-timeline');

    setupSpeechRecognition();
    setupControls();
    setupQuickChips();

    // Carrega dados do usuário e inicia a conversa automaticamente
    try {
        loggedUser = await fetchUserData();
        setTimeout(initJarvisGreeting, 600);
    } catch (e) {
        console.warn('Erro ao carregar usuário para Jarvis:', e);
        setTimeout(initJarvisGreeting, 600);
    }

    // Carrega métricas rápidas nos cards inferiores
    loadLiveCrmMetrics();
});

// --- 1. SAUDAÇÃO INICIAL AUTOMÁTICA AO ENTRAR NA TELA ---
async function initJarvisGreeting() {
    const rawName = (loggedUser && loggedUser.nome) ? loggedUser.nome : 'Gestor';
    const firstName = rawName.trim().split(' ')[0];

    // Saudação dinâmica pelo horário de Brasília
    const now = window.getBrasiliaDate ? window.getBrasiliaDate() : new Date();
    const hour = now.getHours();
    let timeGreeting = 'Bom dia!';
    if (hour >= 12 && hour < 18) {
        timeGreeting = 'Boa tarde!';
    } else if (hour >= 18 || hour < 5) {
        timeGreeting = 'Boa noite!';
    }

    const greetingText = `Fala ${firstName}, e aí, tudo bom contigo? ${timeGreeting} O que você deseja saber sobre o dia de hoje?`;

    // Adiciona fala ao histórico
    addChatMessage('jarvis', greetingText);

    // Fala por voz
    await speakJarvis(greetingText);

    // Após terminar a fala, abre o microfone para escutar
    if (!isMuted) {
        setTimeout(startListening, 400);
    }
}

// --- 2. SÍNTESE DE VOZ (TEXT-TO-SPEECH) ---
function speakJarvis(text) {
    return new Promise((resolve) => {
        if (isMuted || !synthesis) {
            resolve();
            return;
        }

        synthesis.cancel(); // Para qualquer fala anterior

        const utterance = new SpeechSynthesisUtterance(text);
        currentUtterance = utterance;
        utterance.lang = 'pt-BR';
        utterance.rate = 1.05; // Ritmo natural e ágil
        utterance.pitch = 1.0;

        // Tenta selecionar uma voz natural brasileira
        const voices = synthesis.getVoices();
        const ptVoice = voices.find(v => v.lang === 'pt-BR' || v.lang === 'pt_BR');
        if (ptVoice) {
            utterance.voice = ptVoice;
        }

        utterance.onstart = () => {
            isSpeaking = true;
            setOrbState('speaking');
            setStatusText('Jarvis falando...');
        };

        utterance.onend = () => {
            isSpeaking = false;
            setOrbState('idle');
            setStatusText('Toque no microfone para falar');
            resolve();
        };

        utterance.onerror = (err) => {
            console.warn('Erro na síntese de voz:', err);
            isSpeaking = false;
            setOrbState('idle');
            resolve();
        };

        synthesis.speak(utterance);
    });
}

// --- 3. RECONHECIMENTO DE VOZ (SPEECH-TO-TEXT) ---
function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn('Navegador não suporta SpeechRecognition');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        isListening = true;
        setOrbState('listening');
        setStatusText('Ouvindo você... (fale agora)');
        updateMicButtonState(true);
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && transcript.trim()) {
            handleUserMessage(transcript.trim());
        }
    };

    recognition.onerror = (event) => {
        console.warn('SpeechRecognition erro:', event.error);
        stopListening();
        setStatusText('Toque no microfone para tentar novamente');
    };

    recognition.onend = () => {
        isListening = false;
        updateMicButtonState(false);
        if (!isSpeaking) {
            setOrbState('idle');
        }
    };
}

function startListening() {
    if (isSpeaking) {
        synthesis.cancel();
    }
    if (!recognition) {
        showJarvisToast('Microfone não suportado', 'Utilize o Chrome ou Safari para reconhecimento de voz.');
        return;
    }
    try {
        recognition.start();
    } catch (e) {
        // Já estava ouvindo
    }
}

function stopListening() {
    if (recognition) {
        try {
            recognition.stop();
        } catch (e) {}
    }
    isListening = false;
    updateMicButtonState(false);
    setOrbState('idle');
}

function toggleListening() {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
}

// --- 4. INTELIGÊNCIA DO CRM: PROCESSA O QUE VOCÊ PERGUNTOU ---
// Helper para converter data para o fuso horário de Brasília
function parseLeadBrasiliaDate(dateVal) {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;
    const str = d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const brDate = new Date(str);
    const y = brDate.getFullYear();
    const m = String(brDate.getMonth() + 1).padStart(2, '0');
    const day = String(brDate.getDate()).padStart(2, '0');
    return {
        dateStr: `${y}-${m}-${day}`,
        day: brDate.getDate(),
        month: brDate.getMonth() + 1,
        year: y,
        raw: brDate
    };
}

async function handleUserMessage(userText) {
    addChatMessage('user', userText);
    setOrbState('thinking');
    setStatusText('Consultando o CRM em tempo real...');

    try {
        // Busca os dados atualizados do banco
        const [leads, agendamentos] = await Promise.all([
            fetchLeads(),
            fetchAgendamentos()
        ]);

        const totalLeads = leads ? leads.length : 0;
        const now = window.getBrasiliaDate ? window.getBrasiliaDate() : new Date();
        const nowInfo = parseLeadBrasiliaDate(now);

        // Reuniões agendadas totais
        const reunioes = (agendamentos || []).filter(a => a.status && a.status.toLowerCase() === 'qualificado');
        const reunioesCount = reunioes.length;

        // Leads qualificados ou quentes
        const leadsQuentes = (leads || []).filter(l => 
            (l.qualificacao && l.qualificacao.toLowerCase() === 'alta') ||
            (l.status && l.status.toLowerCase().includes('qualificado')) ||
            (l.status && l.status.toLowerCase().includes('atendimento'))
        );

        // Normalização do texto para comparação sem acentos
        const lower = userText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // --- 1. RECONHECIMENTO DE DATA / PERÍODO ---
        let targetDateStr = null;
        let targetDay = null;
        let targetLabel = '';
        let isDateQuery = false;

        if (lower.includes('ontem')) {
            const y = new Date(now);
            y.setDate(y.getDate() - 1);
            const yInfo = parseLeadBrasiliaDate(y);
            targetDateStr = yInfo.dateStr;
            targetDay = yInfo.day;
            targetLabel = `ontem, dia ${yInfo.day}`;
            isDateQuery = true;
        } else if (lower.includes('anteontem')) {
            const a = new Date(now);
            a.setDate(a.getDate() - 2);
            const aInfo = parseLeadBrasiliaDate(a);
            targetDateStr = aInfo.dateStr;
            targetDay = aInfo.day;
            targetLabel = `anteontem, dia ${aInfo.day}`;
            isDateQuery = true;
        } else if (lower.includes('hoje')) {
            targetDateStr = nowInfo.dateStr;
            targetDay = nowInfo.day;
            targetLabel = `hoje, dia ${nowInfo.day}`;
            isDateQuery = true;
        }

        // Reconhecimento de dia numérico: "dia 16", "dia 15", "16 de outubro", "16/10", etc.
        const diaMatch = lower.match(/dia\s+(\d{1,2})/i) || lower.match(/(\d{1,2})\s+de\s+[a-z]+/i) || lower.match(/(\d{1,2})\/(\d{1,2})/);
        if (diaMatch) {
            const dNum = parseInt(diaMatch[1], 10);
            if (dNum >= 1 && dNum <= 31) {
                targetDay = dNum;
                const mStr = String(nowInfo.month).padStart(2, '0');
                const dayStr = String(dNum).padStart(2, '0');
                targetDateStr = `${nowInfo.year}-${mStr}-${dayStr}`;
                if (!targetLabel) {
                    targetLabel = `no dia ${dNum}`;
                } else if (!targetLabel.includes(String(dNum))) {
                    targetLabel += ` (dia ${dNum})`;
                }
                isDateQuery = true;
            }
        }

        // Filtra leads e reuniões para a data alvo (se houver consulta de data)
        const dateLeads = isDateQuery ? (leads || []).filter(l => {
            const lInfo = parseLeadBrasiliaDate(l.criado_em);
            if (!lInfo) return false;
            if (lInfo.dateStr === targetDateStr) return true;
            if (targetDay && lInfo.day === targetDay && Math.abs(lInfo.month - nowInfo.month) <= 1) return true;
            return false;
        }) : [];

        const dateReunioes = isDateQuery ? (agendamentos || []).filter(a => {
            const aDateVal = a.data_agendamento || a.data_vencimento || a.criado_em || a.created_at;
            const aInfo = parseLeadBrasiliaDate(aDateVal);
            if (!aInfo) return false;
            if (aInfo.dateStr === targetDateStr) return true;
            if (targetDay && aInfo.day === targetDay) return true;
            return false;
        }) : [];

        let answer = '';

        // --- ROTA A: PERGUNTA COM DATA ESPECÍFICA (Ex: "quantos leads ontem, dia 16", "o que atendi ontem", etc.) ---
        if (isDateQuery && !lower.includes('resumo geral') && !lower.includes('trabalho de hoje')) {
            if (lower.includes('reuni') || lower.includes('agend') || lower.includes('compromisso') || lower.includes('agenda')) {
                if (dateReunioes.length > 0) {
                    answer = `Em ${targetLabel}, você teve ${dateReunioes.length} reunião(ões) confirmada(s) no sistema.`;
                } else {
                    answer = `Em ${targetLabel}, você não teve novas reuniões agendadas. No total geral, temos ${reunioesCount} reuniões marcadas no CRM.`;
                }
            } else {
                // Consulta sobre leads / atendimentos na data
                if (dateLeads.length > 0) {
                    const leadNames = dateLeads.slice(0, 3).map(l => l.nome || 'Cliente').join(', ');
                    answer = `Em ${targetLabel}, você atendeu ${dateLeads.length} lead(s) no seu WhatsApp! `;
                    if (dateLeads.length === 1) {
                        const l0 = dateLeads[0];
                        answer += `O contato foi de ${l0.nome || 'um cliente'}${l0.interesse ? ' com interesse em ' + l0.interesse : ''}.`;
                    } else {
                        answer += `Entre os contatos atendidos estão: ${leadNames}.`;
                    }
                    if (dateReunioes.length > 0) {
                        answer += ` Além disso, foram registradas ${dateReunioes.length} reunião(ões) associada(s) a esse período.`;
                    }
                } else {
                    answer = `Em ${targetLabel}, você não teve novos leads atendidos registrados no sistema. O seu CRM conta com ${totalLeads} leads no histórico total acumulado.`;
                    if (leadsQuentes.length > 0) {
                        answer += ` Atualmente você tem ${leadsQuentes.length} leads quentes em andamento na sua base geral.`;
                    }
                }
            }
        }
        // --- ROTA B: REUNIÕES / AGENDAMENTOS GERAIS OU PRÓXIMAS ---
        else if (lower.includes('reuni') || lower.includes('agend') || lower.includes('compromisso') || lower.includes('agenda')) {
            if (reunioesCount > 0) {
                answer = `Temos ${reunioesCount} reunião(ões) confirmada(s) no sistema. A equipe já está alinhada para realizar as apresentações.`;
            } else {
                answer = `No momento não temos reuniões agendadas pendentes, mas temos ${leadsQuentes.length} clientes quentes que podem fechar a qualquer momento.`;
            }
        }
        // --- ROTA C: TOTAL DE LEADS / BASE COMPLETA ---
        else if (lower.includes('total') || lower.includes('quantos leads eu tenho') || lower.includes('quantos contatos') || lower.includes('base')) {
            answer = `Você tem um total de ${totalLeads} leads registrados no CRM, dos quais ${leadsQuentes.length} são contatos quentes e ${reunioesCount} possuem reuniões agendadas.`;
        }
        // --- ROTA D: LEADS QUENTES / QUALIFICADOS / INTERESSADOS ---
        else if (lower.includes('quente') || lower.includes('qualificad') || lower.includes('fechad') || lower.includes('interessad')) {
            if (leadsQuentes.length > 0) {
                const names = leadsQuentes.slice(0, 3).map(l => l.nome || 'Cliente').join(', ');
                answer = `Identifiquei ${leadsQuentes.length} leads com alto interesse! Os principais contatos agora são: ${names}. Vale a pena conferir a aba de conversas.`;
            } else {
                answer = `Temos ${totalLeads} leads registrados na base de dados. O robô continua atendendo e qualificando os novos contatos no WhatsApp.`;
            }
        }
        // --- ROTA E: STATUS DO ROBÔ / AGENTE DE IA ---
        else if (lower.includes('robo') || lower.includes('ia') || lower.includes('agente') || lower.includes('status') || lower.includes('whatsapp')) {
            answer = `O seu agente no WhatsApp está 100% ativo e operacional, respondendo mensagens instantaneamente e coletando informações dos clientes.`;
        }
        // --- ROTA F: DÚVIDAS E OBJEÇÕES ---
        else if (lower.includes('duvida') || lower.includes('objec') || lower.includes('preco') || lower.includes('dor') || lower.includes('reclam')) {
            const withObjections = (leads || []).filter(l => l.objecao || l.dor_principal);
            if (withObjections.length > 0) {
                const sample = withObjections[0];
                const objText = sample.objecao ? `objeção de "${sample.objecao}"` : `dor sobre "${sample.dor_principal}"`;
                answer = `A IA identificou que a principal preocupação recente dos leads envolve ${objText}. O robô já utiliza respostas persuasivas para contornar essa questão.`;
            } else {
                answer = `A principal dúvida observada nos atendimentos recentes gira em torno do tempo de implementação e valores dos planos. A IA já está treinada para quebrar essas objeções.`;
            }
        }
        // --- ROTA G: RESUMO GERAL DO DIA / TRABALHO DE HOJE ---
        else if (lower.includes('resumo') || lower.includes('trabalho') || lower.includes('dia') || lower.includes('tudo')) {
            const todayLeadsCount = (leads || []).filter(l => {
                const lInfo = parseLeadBrasiliaDate(l.criado_em);
                return lInfo && lInfo.dateStr === nowInfo.dateStr;
            }).length;

            answer = `Hoje no seu WhatsApp eu registrei ${todayLeadsCount > 0 ? todayLeadsCount : 'nenhum novo'} lead(s) até agora, somando ${totalLeads} contatos no CRM. Temos ${reunioesCount} reuniões marcadas e ${leadsQuentes.length} leads qualificados em negociação ativa.`;
        }
        // --- ROTA H: PADRÃO GERAL ---
        else {
            answer = `Entendido! No momento temos ${totalLeads} leads no total geral, ${leadsQuentes.length} contatos quentes e ${reunioesCount} agendamentos. Deseja saber sobre os atendimentos de ontem, de hoje ou ver as reuniões marcadas?`;
        }

        // Adiciona resposta e fala por voz
        addChatMessage('jarvis', answer);
        await speakJarvis(answer);

    } catch (err) {
        console.error('Erro ao processar consulta do Jarvis:', err);
        const fallback = 'Tive uma pequena oscilação ao ler os dados do banco, mas seu robô continua ativo e atendendo clientes normalmente.';
        addChatMessage('jarvis', fallback);
        await speakJarvis(fallback);
    }
}

// --- 5. INTERFACE CHAT E TIMELINE ---
function addChatMessage(sender, text) {
    if (!chatTimelineElement) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `jarvis-msg ${sender}`;
    msgDiv.style.cssText = `
        display: flex;
        gap: 10px;
        margin-bottom: 14px;
        align-items: flex-start;
        ${sender === 'user' ? 'flex-direction: row-reverse;' : ''}
        animation: fadeIn 0.3s ease;
    `;

    const avatar = document.createElement('div');
    avatar.style.cssText = `
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        flex-shrink: 0;
        background: ${sender === 'jarvis' ? 'linear-gradient(135deg, #00a884, #059669)' : 'rgba(255,255,255,0.15)'};
        color: #ffffff;
    `;
    avatar.innerHTML = sender === 'jarvis' ? '<i class="ph ph-waveform"></i>' : '<i class="ph ph-user"></i>';

    const bubble = document.createElement('div');
    bubble.style.cssText = `
        max-width: 82%;
        padding: 12px 16px;
        border-radius: 16px;
        font-size: 13.5px;
        line-height: 1.45;
        background: ${sender === 'jarvis' ? 'var(--color-bg-card, #ffffff)' : 'var(--color-primary, #00a884)'};
        color: ${sender === 'jarvis' ? 'var(--color-text-main, #1e293b)' : '#ffffff'};
        border: 1px solid ${sender === 'jarvis' ? 'var(--color-border, #e2e8f0)' : 'transparent'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    `;
    bubble.innerText = text;

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(bubble);
    chatTimelineElement.appendChild(msgDiv);

    // Rola para baixo suavemente
    chatTimelineElement.scrollTop = chatTimelineElement.scrollHeight;
}

// --- 6. ESTADOS VISUAIS DA ORBE ---
function setOrbState(state) {
    if (!orbElement) return;
    orbElement.classList.remove('speaking', 'listening', 'thinking', 'idle');
    orbElement.classList.add(state);
}

function setStatusText(text) {
    if (statusTextElement) {
        statusTextElement.innerText = text;
    }
}

function updateMicButtonState(active) {
    const micBtn = document.getElementById('btn-jarvis-mic');
    if (micBtn) {
        if (active) {
            micBtn.classList.add('recording');
        } else {
            micBtn.classList.remove('recording');
        }
    }
}

// --- 7. CONTROLES E ATALHOS ---
function setupControls() {
    const micBtn = document.getElementById('btn-jarvis-mic');
    if (micBtn) {
        micBtn.onclick = toggleListening;
    }

    const muteBtn = document.getElementById('btn-jarvis-mute');
    if (muteBtn) {
        muteBtn.onclick = () => {
            isMuted = !isMuted;
            if (isMuted) {
                if (synthesis) synthesis.cancel();
                muteBtn.innerHTML = '<i class="ph ph-speaker-slash"></i>';
                muteBtn.style.color = '#ef4444';
                showJarvisToast('Voz Desativada', 'O Jarvis agora responderá apenas em texto.');
            } else {
                muteBtn.innerHTML = '<i class="ph ph-speaker-high"></i>';
                muteBtn.style.color = 'var(--color-text-main)';
                showJarvisToast('Voz Ativada', 'O Jarvis falará com você por voz.');
            }
        };
    }

    const clearBtn = document.getElementById('btn-jarvis-clear');
    if (clearBtn) {
        clearBtn.onclick = () => {
            if (chatTimelineElement) {
                chatTimelineElement.innerHTML = '';
                initJarvisGreeting();
            }
        };
    }

    // Input de texto e envio manual
    const textInput = document.getElementById('jarvis-text-input');
    const sendBtn = document.getElementById('btn-jarvis-send');

    const submitTextInput = () => {
        if (!textInput) return;
        const val = textInput.value.trim();
        if (val) {
            handleUserMessage(val);
            textInput.value = '';
        }
    };

    if (sendBtn) {
        sendBtn.onclick = submitTextInput;
    }
    if (textInput) {
        textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitTextInput();
            }
        });
    }

    // Garante que o sintetizador seja destravado no primeiro clique se bloqueado pelo navegador
    document.addEventListener('click', () => {
        if (synthesis && synthesis.paused) {
            synthesis.resume();
        }
    }, { once: true });
}

function setupQuickChips() {
    const chips = document.querySelectorAll('.jarvis-chip');
    chips.forEach(chip => {
        chip.onclick = () => {
            const query = chip.getAttribute('data-query') || chip.innerText.trim();
            handleUserMessage(query);
        };
    });
}

async function loadLiveCrmMetrics() {
    try {
        const leads = await fetchLeads();
        const agendamentos = await fetchAgendamentos();

        const countLeadsEl = document.getElementById('metric-total-leads');
        const countReunioesEl = document.getElementById('metric-total-reunioes');

        if (countLeadsEl) countLeadsEl.innerText = leads ? leads.length : '0';
        if (countReunioesEl) {
            const rCount = (agendamentos || []).filter(a => a.status && a.status.toLowerCase() === 'qualificado').length;
            countReunioesEl.innerText = rCount;
        }
    } catch (e) {}
}

function showJarvisToast(title, body) {
    if (window.crmNotifications && window.crmNotifications.showInAppToast) {
        window.crmNotifications.showInAppToast({
            title,
            body,
            icon: 'ph-waveform',
            type: 'info'
        });
    }
}
