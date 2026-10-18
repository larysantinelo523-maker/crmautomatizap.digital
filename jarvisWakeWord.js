// ===================================================================
// JARVIS WAKE WORD & CIRCLE TO SEARCH SCREEN GLOW ENGINE
// AutomatiZAP CRM - Reconhecimento Contínuo "Fala Jarvis"
// ===================================================================

import { supabase } from './supabase.js';

const ELEVENLABS_API_KEY = 'sk_9d8130a1fd315eaf626dfc180968547c688a999e8730c673';
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
let watchdogInterval = null;

// --- GARANTIA ABSOLUTA DE RECONHECIMENTO ATIVO (CICLO DE VIDA BLINDADO) ---
function ensureSpeechRecognitionActive() {
    if (!wakeActive && !isConversationActive) return;
    if (isSpeaking) return;

    if (!recognition) {
        setupSpeechEngine();
    }
    if (!recognition) return;

    try {
        recognition.start();
        isListening = true;
        updatePillUI(true);
    } catch (e) {
        // Se der InvalidStateError ou "already started", significa que já está ativo e operando
        if (e.name === 'InvalidStateError' || (e.message && e.message.includes('already started'))) {
            isListening = true;
        }
    }
}

// --- CONTROLE DE SESSÃO CONTÍNUA E SILÊNCIO ---
function startSilenceTimer(durationMs = 60000) {
    clearSilenceTimer();
    silenceTimer = setTimeout(() => {
        if (isConversationActive && !isSpeaking) {
            console.log('⏳ Tempo limite de silêncio atingido (60s). Encerrando sessão de conversa...');
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

    // Volta imediatamente para o modo sempre ouvindo "Fala Jarvis" de prontidão
    if (wakeActive) {
        setTimeout(ensureSpeechRecognitionActive, 350);
    }
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

// --- SÍNTESE DE VOZ NATIVA DO NAVEGADOR (FALLBACK SE ELEVENLABS ESGOTAR COTA) ---
function speakWithBrowserSynthesis(text) {
    return new Promise((resolve) => {
        if (!('speechSynthesis' in window)) {
            resolve();
            return;
        }
        try {
            window.speechSynthesis.cancel();
        } catch(e) {}

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.05;
        utterance.pitch = 1.0;

        const setVoiceAndSpeak = () => {
            try {
                const voices = window.speechSynthesis.getVoices() || [];
                const ptVoice = voices.find(v => v.lang && v.lang.replace('_', '-').toLowerCase().startsWith('pt-br') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Luciana') || v.name.includes('Felipe') || v.name.includes('Francisca') || v.name.includes('Antonio') || v.name.includes('Yara') || v.name.includes('Daniel') || v.name.includes('Maria')))
                             || voices.find(v => v.lang && v.lang.replace('_', '-').toLowerCase().startsWith('pt-br'))
                             || voices.find(v => v.lang && v.lang.toLowerCase().startsWith('pt'));
                if (ptVoice) {
                    utterance.voice = ptVoice;
                }
            } catch(e) {}

            utterance.onstart = () => {
                isSpeaking = true;
                setJarvisScreenGlow('speaking', text.length > 60 ? text.substring(0, 60) + '...' : text);
            };

            const onFinish = () => {
                isSpeaking = false;
                lastSpokeEndTime = Date.now();
                setTimeout(() => {
                    if (wakeActive || isConversationActive) {
                        ensureSpeechRecognitionActive();
                    }
                }, 250);
                resolve();
            };

            utterance.onend = onFinish;
            utterance.onerror = (err) => {
                console.warn('SpeechSynthesis erro:', err);
                onFinish();
            };

            try {
                window.speechSynthesis.speak(utterance);
            } catch (err) {
                console.warn('Erro ao disparar speechSynthesis:', err);
                onFinish();
            }
        };

        if (window.speechSynthesis.getVoices().length > 0) {
            setVoiceAndSpeak();
        } else {
            let voicesChangedFired = false;
            window.speechSynthesis.onvoiceschanged = () => {
                voicesChangedFired = true;
                window.speechSynthesis.onvoiceschanged = null;
                setVoiceAndSpeak();
            };
            setTimeout(() => {
                if (!voicesChangedFired) setVoiceAndSpeak();
            }, 100);
        }
    });
}

async function playJarvisVoice(text, audioBase64 = null) {
    return new Promise(async (resolve) => {
        if (currentAudioPlayer) {
            try { currentAudioPlayer.pause(); } catch(e) {}
            currentAudioPlayer = null;
        }

        const finishSpeaking = () => {
            isSpeaking = false;
            lastSpokeEndTime = Date.now();
            currentAudioPlayer = null;

            // Retoma escuta ativa imediatamente após terminar a fala
            setTimeout(() => {
                if (wakeActive || isConversationActive) {
                    ensureSpeechRecognitionActive();
                }
            }, 250);

            resolve();
        };

        const cleanText = (text || '')
            .replace(/\*+/g, '')
            .replace(/#{1,6}\s+/g, '')
            .replace(/`/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .trim();

        if (!cleanText) {
            finishSpeaking();
            return;
        }

        let src = audioBase64;
        if (!src && cleanText.length > 0) {
            setJarvisScreenGlow('speaking', 'Sintetizando voz...');
            src = await fetchElevenLabsSpeech(cleanText);
        }

        // 1. Áudio de estúdio do ElevenLabs disponível
        if (src && typeof src === 'string' && src.length > 50) {
            const audio = new Audio(src);
            currentAudioPlayer = audio;

            audio.onplay = () => {
                isSpeaking = true;
                setJarvisScreenGlow('speaking', cleanText.length > 60 ? cleanText.substring(0, 60) + '...' : cleanText);
            };

            audio.onended = finishSpeaking;
            audio.onerror = async (err) => {
                console.warn('Erro ao reproduzir áudio ElevenLabs, usando síntese nativa do navegador:', err);
                currentAudioPlayer = null;
                await speakWithBrowserSynthesis(cleanText);
                resolve();
            };
            audio.onabort = finishSpeaking;

            audio.play().catch(async (err) => {
                console.warn('Autoplay bloqueado pelo navegador, usando síntese nativa:', err);
                currentAudioPlayer = null;
                await speakWithBrowserSynthesis(cleanText);
                resolve();
            });
            return;
        }

        // 2. FALLBACK IMEDIATO: Cota do ElevenLabs excedida ou erro de rede -> Fala pela voz do navegador!
        console.warn('⚠️ ElevenLabs sem áudio (cota de créditos atingida ou erro). Acionando voz nativa do navegador imediatamente!');
        await speakWithBrowserSynthesis(cleanText);
        resolve();
    });
}

// --- 4. CONSULTA AO WEBHOOK DO AGENTE JARVIS NO N8N ---
async function queryJarvisAgent(userQuestion) {
    clearSilenceTimer();
    setJarvisScreenGlow('speaking', 'Jarvis consultando o sistema...');
    const clientName = getClientGreetingName();

    const companyId = resolvedUser ? (resolvedUser.id_empresa || resolvedUser.id) : (localStorage.getItem('jarvis_company_id') || 'jarvis_crm');

    const payload = {
        message: userQuestion,
        pergunta: userQuestion,
        chatInput: userQuestion,
        user_name: clientName,
        nome_cliente: clientName,
        nome_empresa: resolvedUser?.nome_fantasia || resolvedUser?.nome_completo || 'sua empresa',
        user_id: resolvedUser ? resolvedUser.id : null,
        company_id: companyId,
        id_empresa: companyId,
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
            startSilenceTimer(60000); // Aguarda até 60 segundos de silêncio antes de encerrar
            setTimeout(() => {
                ensureSpeechRecognitionActive();
            }, 300);
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

    if (recognition) {
        try { recognition.abort(); } catch(e) {}
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
        isListening = true;
        updatePillUI(true);
    };

    recognition.onspeechstart = () => {
        // Quando o usuário começa a falar, cancela o timer de silêncio para não encerrar a sessão
        if (isConversationActive) {
            clearSilenceTimer();
            setJarvisScreenGlow('listening', 'Ouvindo sua pergunta...');
        }
    };

    recognition.onsoundstart = () => {
        if (isConversationActive && !isSpeaking) {
            clearSilenceTimer();
        }
    };

    recognition.onresult = async (event) => {
        if (isSpeaking) return; // Não ouve a si mesmo enquanto fala

        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
        }
        const rawTranscript = transcript.trim();
        if (!rawTranscript) return;

        // Supressão de eco pós-áudio apenas para ruídos de menos de 5 caracteres
        if (Date.now() - lastSpokeEndTime < 300 && rawTranscript.length < 5) return;

        console.log('🗣️ Voz ouvida:', rawTranscript, '| Conversa ativa:', isConversationActive);

        const wakeRegex = /(fala\s+)?(jarvis|jarbas|iarvis)/i;
        const farewellRegex = /(obrigad[oa]|valeu|tchau|at[eé]\s+mais|pode\s+fechar|^fechar$|^encerra[r]?$|s[oó]\s+isso|falou|at[eé]\s+logo|pode\s+parar|desativa[r]?|nada\s+mais|por\s+hoje\s+[eé]\s+s[oó]|era\s+s[oó]\s+isso)/i;

        // CENÁRIO 1: Sessão de conversa já está ATIVA (usuário fez uma pergunta ou saudação anterior)
        if (isConversationActive) {
            clearSilenceTimer();

            // Usuário pediu para encerrar a conversa ("valeu", "obrigado", "tchau", "pode fechar", "era só isso")
            if (farewellRegex.test(rawTranscript)) {
                await endConversationSession(true);
                return;
            }

            // Próxima pergunta do usuário na mesma sessão (ex: "Quero salvar o numero que não foi salvo como matheus")
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
                startSilenceTimer(60000);
                setTimeout(() => {
                    ensureSpeechRecognitionActive();
                }, 300);
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
        if ((wakeActive || isConversationActive) && !isSpeaking) {
            setTimeout(() => {
                ensureSpeechRecognitionActive();
            }, 200);
        } else if (!wakeActive && !isConversationActive) {
            updatePillUI(false);
        }
    };

    // Watchdog protetor contra congelamento do SpeechRecognition do Chrome
    if (!watchdogInterval) {
        watchdogInterval = setInterval(() => {
            if ((wakeActive || isConversationActive) && !isSpeaking && !isListening) {
                ensureSpeechRecognitionActive();
            }
        }, 2500);
    }
}

export function startWakeWordListening() {
    wakeActive = true;
    localStorage.setItem('jarvis_wake_active', 'true');
    ensureSpeechRecognitionActive();
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
    isListening = false;
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
