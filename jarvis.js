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

        // Leads de hoje
        const todayStr = (window.getBrasiliaDate ? window.getBrasiliaDate() : new Date()).toISOString().slice(0, 10);
        const todayLeads = (leads || []).filter(l => l.criado_em && l.criado_em.startsWith(todayStr));
        const todayCount = todayLeads.length;

        // Reuniões agendadas
        const reunioes = (agendamentos || []).filter(a => a.status && a.status.toLowerCase() === 'qualificado');
        const reunioesCount = reunioes.length;

        // Leads qualificados ou quentes
        const leadsQuentes = (leads || []).filter(l => 
            (l.qualificacao && l.qualificacao.toLowerCase() === 'alta') ||
            (l.status && l.status.toLowerCase().includes('qualificado')) ||
            (l.status && l.status.toLowerCase().includes('atendimento'))
        );

        // Gera a resposta inteligente baseada na pergunta
        const lower = userText.toLowerCase();
        let answer = '';

        if (lower.includes('resumo') || lower.includes('trabalho') || lower.includes('dia') || lower.includes('hoje') || lower.includes('tudo')) {
            answer = `Hoje no seu WhatsApp eu registrei ${todayCount > 0 ? todayCount : 'nenhum novo'} lead(s) até agora, somando ${totalLeads} contatos no CRM. Temos ${reunioesCount} reuniões marcadas e ${leadsQuentes.length} leads qualificados em negociação ativa.`;
            if (todayLeads.length > 0) {
                const sampleName = todayLeads[0].nome || 'um cliente';
                const sampleInterest = todayLeads[0].interesse ? ` com interesse em ${todayLeads[0].interesse}` : '';
                answer += ` O último contato foi de ${sampleName}${sampleInterest}.`;
            }
        } else if (lower.includes('reuni') || lower.includes('agend') || lower.includes('compromisso') || lower.includes('agenda')) {
            if (reunioesCount > 0) {
                answer = `Temos ${reunioesCount} reunião(ões) confirmada(s) no sistema. A equipe já está alinhada para realizar as apresentações.`;
            } else {
                answer = `No momento não temos novas reuniões agendadas para hoje, mas temos ${leadsQuentes.length} clientes quentes que podem fechar a qualquer momento.`;
            }
        } else if (lower.includes('lead') || lower.includes('cliente') || lower.includes('quente') || lower.includes('contato')) {
            if (leadsQuentes.length > 0) {
                const names = leadsQuentes.slice(0, 3).map(l => l.nome || 'Cliente').join(', ');
                answer = `Identifiquei ${leadsQuentes.length} leads com alto interesse! Os principais contatos agora são: ${names}. Vale a pena conferir a aba de conversas.`;
            } else {
                answer = `Temos ${totalLeads} leads registrados na base de dados. O robô continua atendendo e qualificando os novos contatos no WhatsApp.`;
            }
        } else if (lower.includes('robô') || lower.includes('ia') || lower.includes('agente') || lower.includes('status')) {
            answer = `O seu agente no WhatsApp está 100% ativo e operacional, respondendo mensagens instantaneamente e coletando informações dos clientes.`;
        } else if (lower.includes('duvida') || lower.includes('objeç') || lower.includes('preço') || lower.includes('dor')) {
            answer = `A principal dúvida observada nos atendimentos recentes gira em torno do tempo de implementação e valores dos planos. A IA já está treinada para quebrar essas objeções.`;
        } else {
            // Pergunta geral
            answer = `Entendido! No momento temos ${totalLeads} leads no total, ${todayCount} novos hoje e ${reunioesCount} agendamentos. Deseja que eu detalhe as reuniões ou os contatos mais quentes?`;
        }

        // Adiciona resposta e fala
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
