// ===================================================================
// JARVIS AI - COPILOTO DE VOZ COM AI AGENT (N8N + SUPABASE)
// ===================================================================

import { supabase } from './supabase.js';
import { fetchUserData, fetchLeads, fetchAgendamentos } from './data.js';

const DEFAULT_WEBHOOK_URL = 'https://talonedlanternfish-n8n.cloudfy.live/webhook/jarvis-crm';

function getWebhookUrl() {
    return localStorage.getItem('jarvis_webhook_url') || DEFAULT_WEBHOOK_URL;
}

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
let greetingSpoken = false;

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    orbElement = document.getElementById('jarvis-orb');
    statusTextElement = document.getElementById('jarvis-status-text');
    chatTimelineElement = document.getElementById('jarvis-chat-timeline');

    setupSpeechRecognition();
    setupControls();
    setupQuickChips();
    setupWebhookModal();

    // Carrega dados do usuário e inicia a conversa automaticamente
    try {
        loggedUser = await fetchUserData();
        setTimeout(initJarvisGreeting, 600);
    } catch (e) {
        console.warn('Erro ao carregar usuário para Jarvis:', e);
        setTimeout(initJarvisGreeting, 600);
    }

    // Carrega métricas rápidas nos cards superiores
    loadLiveCrmMetrics();
});

// --- 1. SAUDAÇÃO INICIAL AUTOMÁTICA AO ENTRAR NA TELA ---
async function initJarvisGreeting() {
    if (greetingSpoken) return;
    greetingSpoken = true;

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
        setStatusText('Toque no microfone para falar');
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
        showJarvisToast('Microfone', 'Use o navegador Chrome ou Safari para reconhecimento de voz.');
        return;
    }
    try {
        recognition.start();
    } catch (e) {
        // Já estava ativo
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

// --- 4. DISPARO PARA O WEBHOOK DO AI AGENT (SEM IF/ELSE ENGESSADO) ---
async function handleUserMessage(userText) {
    addChatMessage('user', userText);
    setOrbState('thinking');
    setStatusText('Consultando o AI Agent...');

    const rawName = (loggedUser && loggedUser.nome) ? loggedUser.nome : 'Gestor';
    const firstName = rawName.trim().split(' ')[0];
    const webhookUrl = getWebhookUrl();

    const payload = {
        message: userText,
        pergunta: userText,
        user_name: firstName,
        nome_usuario: rawName,
        user_id: loggedUser ? loggedUser.id : null,
        company_id: loggedUser ? loggedUser.id : null,
        timestamp: (window.getBrasiliaDate ? window.getBrasiliaDate() : new Date()).toISOString()
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // Extrai a resposta textual inteligente do AI Agent
        let aiAnswer = '';
        if (typeof data === 'string') {
            aiAnswer = data;
        } else if (data.resposta) {
            aiAnswer = data.resposta;
        } else if (data.response) {
            aiAnswer = data.response;
        } else if (data.output) {
            aiAnswer = data.output;
        } else if (data.message) {
            aiAnswer = data.message;
        } else if (data.text) {
            aiAnswer = data.text;
        } else if (Array.isArray(data) && data.length > 0) {
            const first = data[0];
            aiAnswer = first.resposta || first.response || first.output || first.text || JSON.stringify(first);
        } else {
            aiAnswer = JSON.stringify(data);
        }

        if (!aiAnswer || aiAnswer.trim() === '') {
            aiAnswer = 'Recebi a confirmação do agente, mas não houve texto de resposta retornado.';
        }

        addChatMessage('jarvis', aiAnswer);
        await speakJarvis(aiAnswer);

    } catch (err) {
        console.warn('Erro ao consultar Webhook do AI Agent:', err);
        
        const fallbackMsg = `Estou pronto para raciocinar via IA Agent! O webhook está configurado para: ${webhookUrl}. Assim que você ativar o fluxo do AI Agent no n8n, responderei com dados em tempo real e raciocínio completo!`;
        
        addChatMessage('jarvis', fallbackMsg);
        await speakJarvis('Estou pronto para conversar! Basta ativar o fluxo do AI Agent no seu n8n para eu consultar o Supabase ao vivo.');
    } finally {
        if (!isSpeaking) {
            setOrbState('idle');
            setStatusText('Toque no microfone para falar');
        }
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

    // Rola suavemente para baixo
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
                showJarvisToast('Voz Desativada', 'O Jarvis responderá apenas por texto.');
            } else {
                muteBtn.innerHTML = '<i class="ph ph-speaker-high"></i>';
                muteBtn.style.color = 'var(--color-text-main)';
                showJarvisToast('Voz Ativada', 'O Jarvis responderá por áudio.');
            }
        };
    }

    const clearBtn = document.getElementById('btn-jarvis-clear');
    if (clearBtn) {
        clearBtn.onclick = () => {
            if (chatTimelineElement) {
                chatTimelineElement.innerHTML = '';
                greetingSpoken = false;
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
        if (!greetingSpoken && loggedUser) {
            initJarvisGreeting();
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

// --- 8. MODAL DE CONFIGURAÇÃO DO WEBHOOK DO AGENTE ---
function setupWebhookModal() {
    const btnConfig = document.getElementById('btn-jarvis-config');
    const modal = document.getElementById('modal-webhook-config');
    const btnClose = document.getElementById('btn-close-webhook-modal');
    const btnSave = document.getElementById('btn-save-webhook');
    const btnReset = document.getElementById('btn-reset-webhook');
    const inputUrl = document.getElementById('input-webhook-url');

    if (!btnConfig || !modal) return;

    btnConfig.onclick = () => {
        if (inputUrl) {
            inputUrl.value = getWebhookUrl();
        }
        modal.style.display = 'flex';
    };

    const closeModal = () => {
        modal.style.display = 'none';
    };

    if (btnClose) btnClose.onclick = closeModal;

    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };

    if (btnSave) {
        btnSave.onclick = () => {
            if (!inputUrl) return;
            const val = inputUrl.value.trim();
            if (val) {
                localStorage.setItem('jarvis_webhook_url', val);
                showJarvisToast('Webhook Salvo', 'URL atualizada com sucesso!');
                closeModal();
            }
        };
    }

    if (btnReset) {
        btnReset.onclick = () => {
            localStorage.removeItem('jarvis_webhook_url');
            if (inputUrl) inputUrl.value = DEFAULT_WEBHOOK_URL;
            showJarvisToast('Webhook Padrão', 'URL restaurada para o padrão.');
            closeModal();
        };
    }
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
