// ===================================================================
// JARVIS WAKE WORD & CIRCLE TO SEARCH SCREEN GLOW ENGINE
// AutomatiZAP CRM - Reconhecimento Contínuo "Fala Jarvis"
// ===================================================================

import { supabase } from './supabase.js';

const ELEVENLABS_API_KEY = 'sk_e7cd40a1ccbc8a532e1c833272570bfec741758f0a63d29b';
const ELEVENLABS_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'; // George (Voz Oficial)
const N8N_WEBHOOK_URL = 'https://talonedlanternfish-n8n.cloudfy.live/webhook/jarvis-crm';

let recognition = null;
let isListening = false;
let isSpeaking = false;
let isConversationActive = false;
let lastSpokeEndTime = 0;
let glowElement = null;
let toastElement = null;
let toastTextElement = null;
let currentAudioPlayer = null;
let silenceTimer = null;
let wakeActive = false;
let resolvedUser = null;

// --- CONTROLE DE SESSÃO CONTÍNUA E SILÊNCIO ---
function startSilenceTimer(durationMs = 25000) {
    clearSilenceTimer();
    silenceTimer = setTimeout(() => {
        if (isConversationActive && !isSpeaking) {
            console.log('⏳ Tempo limite de silêncio atingido (25s). Adormecendo bate-papo...');
            endConversationSession(false);
        }
    }, durationMs);
}

function clearSilenceTimer() {
    if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
    }
}

export async function endConversationSession(withFarewell = true) {
    isConversationActive = false;
    clearSilenceTimer();

    if (withFarewell) {
        const clientName = getClientGreetingName();
        const farewell = `Por nada, ${clientName}! Se precisar de mais alguma coisa, é só me chamar. Até mais!`;
        setJarvisScreenGlow('speaking', 'Encerrando bate-papo...');
        await playJarvisVoice(farewell);
    }

    setJarvisScreenGlow('idle');
}

// --- 1. RESOLUÇÃO INTELIGENTE DO NOME DO USUÁRIO ---
function getClientGreetingName() {
    const custom = localStorage.getItem('jarvis_user_name');
    if (custom && custom.trim()) return formatName(custom);

    if (resolvedUser) {
        if (resolvedUser.nome_cliente && resolvedUser.nome_cliente.trim()) return formatName(resolvedUser.nome_cliente);
        if (resolvedUser.nome_fantasia && resolvedUser.nome_fantasia.trim()) return formatName(resolvedUser.nome_fantasia);
        if (resolvedUser.nome_completo && resolvedUser.nome_completo.trim()) return formatName(resolvedUser.nome_completo);
    }

    const domName = document.querySelector('.user-menu .user-name') || document.querySelector('.user-name');
    if (domName && domName.textContent) {
        const text = domName.textContent.trim();
        if (!text.toLowerCase().includes('automatizap') && !text.toLowerCase().includes('usuário')) {
            return formatName(text);
        }
    }

    return 'seu Geremias';
}

function formatName(name) {
    if (!name) return 'seu Geremias';
    const trimmed = name.trim();
    const matchPrefix = trimmed.match(/^(seu|dona|sr\.|sra\.)\s+\S+/i);
    if (matchPrefix) return matchPrefix[0];
    return trimmed.split(' ')[0];
}

// --- 2. CONTROLE DO EFEITO VISUAL "CIRCLE TO SEARCH" (MOLDURA DE LUZ) ---
function createGlowElements() {
    if (!glowElement && !document.getElementById('jarvis-screen-glow')) {
        glowElement = document.createElement('div');
        glowElement.id = 'jarvis-screen-glow';
        glowElement.className = 'jarvis-screen-glow';
        document.body.appendChild(glowElement);
    } else if (!glowElement) {
        glowElement = document.getElementById('jarvis-screen-glow');
    }

    if (!toastElement && !document.getElementById('jarvis-floating-toast')) {
        toastElement = document.createElement('div');
        toastElement.id = 'jarvis-floating-toast';
        toastElement.className = 'jarvis-floating-toast';
        toastElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="ph-fill ph-waveform" style="color: #00A884; font-size: 18px; animation: spin 3s linear infinite;"></i>
                <span id="jarvis-toast-text">Jarvis ativado</span>
            </div>
            <button id="btn-close-jarvis-session" type="button" title="Encerrar bate-papo" style="background: rgba(255,255,255,0.15); border: none; color: #fff; cursor: pointer; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-left: 8px; transition: all 0.2s;">
                <i class="ph ph-x"></i>
            </button>
        `;
        document.body.appendChild(toastElement);
        toastTextElement = toastElement.querySelector('#jarvis-toast-text');

        toastElement.querySelector('#btn-close-jarvis-session')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            endConversationSession(false);
        });
    } else if (!toastElement) {
        toastElement = document.getElementById('jarvis-floating-toast');
        toastTextElement = toastElement.querySelector('#jarvis-toast-text');
    }
}

export function setJarvisScreenGlow(state, text = '') {
    createGlowElements();
    if (!glowElement) return;

    if (silenceTimer && state !== 'listening') {
        clearSilenceTimer();
    }

    if (state === 'listening') {
        glowElement.classList.remove('speaking', 'closing');
        glowElement.classList.add('active', 'listening');
        if (toastElement) {
            toastTextElement.textContent = text || 'Ouvindo você... (pode falar)';
            toastElement.classList.add('visible');
        }
    } else if (state === 'speaking') {
        glowElement.classList.remove('listening', 'closing');
        glowElement.classList.add('active', 'speaking');
        if (toastElement) {
            toastTextElement.textContent = text || 'Jarvis falando...';
            toastElement.classList.add('visible');
        }
    } else if (state === 'idle') {
        glowElement.classList.remove('listening', 'speaking');
        glowElement.classList.add('closing');
        if (toastElement) {
            toastElement.classList.remove('visible');
        }
        setTimeout(() => {
            if (glowElement.classList.contains('closing')) {
                glowElement.classList.remove('active', 'closing');
            }
        }, 500);
    }
}

// --- 3. SÍNTESE DE VOZ ELEVENLABS E REPRODUÇÃO ---
async function fetchElevenLabsSpeech(text) {
    if (!text || !text.trim()) return null;
    try {
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128`, {
            method: 'POST',
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.50,
                    similarity_boost: 0.75
                }
            })
        });
        if (!res.ok) return null;
        const blob = await res.blob();
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn('Erro ao gerar voz ElevenLabs:', e);
        return null;
    }
}

async function playJarvisVoice(text, audioBase64 = null) {
    return new Promise(async (resolve) => {
        if (currentAudioPlayer) {
            try { currentAudioPlayer.pause(); } catch(e) {}
            currentAudioPlayer = null;
        }

        const cleanText = (text || '')
            .replace(/\*+/g, '')
            .replace(/#{1,6}\s+/g, '')
            .replace(/`/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .trim();

        let src = audioBase64;
        if (!src && cleanText.length > 0) {
            setJarvisScreenGlow('speaking', 'Sintetizando voz...');
            src = await fetchElevenLabsSpeech(cleanText);
        }

        if (src && typeof src === 'string' && src.length > 50) {
            const audio = new Audio(src);
            currentAudioPlayer = audio;

            audio.onplay = () => {
                isSpeaking = true;
                setJarvisScreenGlow('speaking', cleanText.length > 60 ? cleanText.substring(0, 60) + '...' : cleanText);
            };

            audio.onended = () => {
                isSpeaking = false;
                lastSpokeEndTime = Date.now();
                currentAudioPlayer = null;
                resolve();
            };

            audio.onerror = () => {
                isSpeaking = false;
                lastSpokeEndTime = Date.now();
                currentAudioPlayer = null;
                resolve();
            };

            audio.play().catch(err => {
                console.warn('Autoplay bloqueado pelo navegador:', err);
                isSpeaking = false;
                lastSpokeEndTime = Date.now();
                currentAudioPlayer = null;
                resolve();
            });
            return;
        }

        isSpeaking = false;
        lastSpokeEndTime = Date.now();
        resolve();
    });
}

// --- 4. CONSULTA AO WEBHOOK DO AGENTE JARVIS NO N8N ---
async function queryJarvisAgent(userQuestion) {
    clearSilenceTimer();
    setJarvisScreenGlow('speaking', 'Jarvis consultando o sistema...');
    const clientName = getClientGreetingName();

    const payload = {
        message: userQuestion,
        pergunta: userQuestion,
        user_name: clientName,
        nome_cliente: clientName,
        nome_empresa: resolvedUser?.nome_fantasia || resolvedUser?.nome_completo || 'sua empresa',
        user_id: resolvedUser ? resolvedUser.id : null,
        company_id: resolvedUser ? resolvedUser.id : null,
        timestamp: new Date().toISOString()
    };

    try {
        const res = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        let responseText = data.resposta || data.response || data.output || data.message || data.text || '';
        if (typeof data === 'string') responseText = data;
        const audioSrc = data.audio || data.audio_base64 || null;

        await playJarvisVoice(responseText, audioSrc);
    } catch (err) {
        console.warn('Erro ao consultar n8n:', err);
        const fallback = `Desculpe, ${clientName}, tive uma instabilidade momentânea para consultar os dados. Pode repetir?`;
        await playJarvisVoice(fallback);
    } finally {
        // CONVERSA CONTÍNUA:
        // Mantém o Jarvis ouvindo para as próximas perguntas até o usuário se despedir ou pausar!
        if (isConversationActive) {
            setJarvisScreenGlow('listening', 'Estou ouvindo... (pode perguntar)');
            startSilenceTimer(25000); // Aguarda até 25 segundos antes de adormecer
        } else {
            setJarvisScreenGlow('idle');
        }
    }
}

// --- 5. LÓGICA DE RECONHECIMENTO DE FALA E WAKE WORD ---
function setupSpeechEngine() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn('Navegador não suporta SpeechRecognition para Wake Word');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
        isListening = true;
        updatePillUI(true);
    };

    recognition.onresult = async (event) => {
        if (isSpeaking) return; // Não ouve a si mesmo enquanto fala
        if (Date.now() - lastSpokeEndTime < 450) return; // Supressão de eco pós-áudio

        const lastIndex = event.results.length - 1;
        const rawTranscript = (event.results[lastIndex][0].transcript || '').trim();
        if (!rawTranscript) return;

        console.log('🗣️ Voz ouvida:', rawTranscript, '| Conversa ativa:', isConversationActive);

        const wakeRegex = /(fala\s+)?(jarvis|jarbas|iarvis)/i;
        const farewellRegex = /^(obrigad[oa]|valeu|tchau|at[eé]\s+mais|pode\s+fechar|fechar|encerra[r]?|s[oó]\s+isso|falou|at[eé]\s+logo|pode\s+parar|desativa[r]?|nada\s+mais)\b/i;

        // CENÁRIO 1: Sessão de conversa já está ATIVA (usuário fez uma pergunta ou saudação anterior)
        if (isConversationActive) {
            clearSilenceTimer();

            // Usuário pediu para encerrar a conversa ("valeu", "obrigado", "tchau", "pode fechar")
            if (farewellRegex.test(rawTranscript)) {
                await endConversationSession(true);
                return;
            }

            // Próxima pergunta do usuário na mesma sessão (ex: "Me diga quem são esses leads")
            const cleanQuestion = rawTranscript.replace(wakeRegex, '').trim() || rawTranscript;

            if (cleanQuestion.length >= 2) {
                setJarvisScreenGlow('speaking', `"${cleanQuestion}"`);
                await queryJarvisAgent(cleanQuestion);
            }
            return;
        }

        // CENÁRIO 2: Sessão NÃO estava ativa, mas o usuário falou "Fala Jarvis..."
        if (wakeRegex.test(rawTranscript)) {
            isConversationActive = true;
            clearSilenceTimer();

            const clientName = getClientGreetingName();

            // Extrai a pergunta se o usuário já falou tudo na mesma frase (ex: "Fala jarvis, quantos clientes entraram hoje?")
            const cleanCommand = rawTranscript
                .replace(/^(fala\s+)?(jarvis|jarbas|iarvis)[,.?!]?\s*(t[aá]\s+por\s+a[ií][,.]?|tudo\s+bom[,.]?|tudo\s+bem[,.]?|bom\s+dia[,.]?|boa\s+tarde[,.]?|boa\s+noite[,.]?)?\s*/i, '')
                .trim();

            if (cleanCommand.length > 3) {
                // Usuário já fez a pergunta completa!
                setJarvisScreenGlow('speaking', `"${cleanCommand}"`);
                await queryJarvisAgent(cleanCommand);
            } else {
                // Apenas saudou ("Fala Jarvis, tá por aí?" ou "Fala Jarvis, tudo bom?")
                setJarvisScreenGlow('listening', `Fala, ${clientName}!`);

                const hour = (window.getBrasiliaDate ? window.getBrasiliaDate() : new Date()).getHours();
                let timeGreeting = 'Bom dia';
                if (hour >= 12 && hour < 18) timeGreeting = 'Boa tarde';
                else if (hour >= 18 || hour < 5) timeGreeting = 'Boa noite';

                const greetingReply = `Fala, ${clientName}! Tô por aqui sim, ${timeGreeting.toLowerCase()}! Como posso te ajudar?`;
                await playJarvisVoice(greetingReply);

                // Volta para modo de escuta com moldura verde respirando aguardando a pergunta
                setJarvisScreenGlow('listening', 'Estou ouvindo... (pode perguntar)');
                startSilenceTimer(25000);
            }
        }
    };

    recognition.onerror = (e) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
            console.warn('SpeechRecognition aviso:', e.error);
        }
    };

    recognition.onend = () => {
        isListening = false;
        // Reinício contínuo e ininterrupto em segundo plano (SEMPRE ATIVO)
        if (wakeActive) {
            setTimeout(() => {
                if (wakeActive && !isSpeaking) {
                    try { recognition.start(); } catch(e) {}
                }
            }, 250);
        } else {
            updatePillUI(false);
        }
    };
}

export function startWakeWordListening() {
    wakeActive = true;
    localStorage.setItem('jarvis_wake_active', 'true');
    if (!recognition) setupSpeechEngine();
    if (recognition) {
        try {
            recognition.start();
        } catch (e) {
            // Já estava rodando
        }
    }
    updatePillUI(true);
}

export function stopWakeWordListening() {
    wakeActive = false;
    isConversationActive = false;
    clearSilenceTimer();
    localStorage.setItem('jarvis_wake_active', 'false');
    if (recognition) {
        try { recognition.stop(); } catch(e) {}
    }
    setJarvisScreenGlow('idle');
    updatePillUI(false);
}

function toggleWakeWord() {
    if (wakeActive) {
        stopWakeWordListening();
    } else {
        startWakeWordListening();
    }
}

// --- 6. BOTÃO PILL NO HEADER DE TODAS AS PÁGINAS ---
function injectHeaderPill() {
    if (document.getElementById('btn-jarvis-wake-pill')) return;

    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    const pill = document.createElement('button');
    pill.id = 'btn-jarvis-wake-pill';
    pill.type = 'button';
    pill.className = 'btn-jarvis-wake-pill active';
    pill.title = 'Modo Sempre Ativo: fale "Fala Jarvis, tá por aí?" a qualquer momento.';
    pill.innerHTML = `
        <span class="wake-pulse-dot"></span>
        <span class="wake-pill-text">🟢 Ouvindo "Fala Jarvis"</span>
    `;

    pill.addEventListener('click', (e) => {
        e.preventDefault();
        toggleWakeWord();
    });

    headerActions.insertBefore(pill, headerActions.firstChild);
}

function updatePillUI(isActive) {
    const pill = document.getElementById('btn-jarvis-wake-pill');
    if (!pill) return;
    const textEl = pill.querySelector('.wake-pill-text');

    if (isActive) {
        pill.classList.add('active');
        if (textEl) textEl.textContent = '🟢 Ouvindo "Fala Jarvis"';
    } else {
        pill.classList.remove('active');
        if (textEl) textEl.textContent = '🔇 "Fala Jarvis" (Pausado)';
    }
}

// --- 7. INICIALIZAÇÃO AUTOMÁTICA EM QUALQUER PÁGINA (SEMPRE ATIVO) ---
export async function initJarvisWakeWord() {
    // Se estiver na tela exclusiva do Jarvis (jarvis.html), o jarvis.js já controla o áudio e microfone
    if (document.body.classList.contains('jarvis-page') || window.location.pathname.endsWith('jarvis.html')) {
        return;
    }

    createGlowElements();
    injectHeaderPill();
    setupSpeechEngine();

    // Sempre ativo por padrão, a não ser que o usuário tenha explicitamente pausado
    const isMutedByUser = localStorage.getItem('jarvis_wake_active') === 'false';
    if (!isMutedByUser) {
        wakeActive = true;
        // 1. Tenta iniciar imediatamente
        try {
            startWakeWordListening();
        } catch (e) {}

        // 2. Garante o início no primeiro toque/clique em qualquer lugar da tela (política de autoplay dos navegadores)
        const autoUnlockAudioAndMic = () => {
            document.removeEventListener('click', autoUnlockAudioAndMic);
            document.removeEventListener('touchstart', autoUnlockAudioAndMic);
            document.removeEventListener('keydown', autoUnlockAudioAndMic);
            document.removeEventListener('scroll', autoUnlockAudioAndMic);
            startWakeWordListening();
        };
        document.addEventListener('click', autoUnlockAudioAndMic, { once: true, passive: true });
        document.addEventListener('touchstart', autoUnlockAudioAndMic, { once: true, passive: true });
        document.addEventListener('keydown', autoUnlockAudioAndMic, { once: true, passive: true });
        document.addEventListener('scroll', autoUnlockAudioAndMic, { once: true, passive: true });
    }

    // Carrega dados do usuário para saudar pelo nome correto
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
            if (data) resolvedUser = data;
        }
    } catch (e) {
        console.warn('Erro ao carregar usuário em jarvisWakeWord:', e);
    }
}

window.setJarvisScreenGlow = setJarvisScreenGlow;
window.startWakeWordListening = startWakeWordListening;
window.stopWakeWordListening = stopWakeWordListening;

// Auto-inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initJarvisWakeWord);
} else {
    initJarvisWakeWord();
}
