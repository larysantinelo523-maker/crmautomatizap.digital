// ===================================================================
// JARVIS AI - COPILOTO DE VOZ COM AI AGENT (N8N + SUPABASE)
// ===================================================================

import { supabase } from './supabase.js';
import { fetchUserData, fetchLeads, fetchAgendamentos } from './data.js';
import { normalizeSpeechPhonetics, getAssistantName, setAssistantName, getContextualPhrases, isQuestionOutOfScope, getRandomOutOfScopeReply } from './jarvisWakeWord.js';

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
    setupTranscriptDropdown();

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

// --- 1. SAUDAÇÃO INICIAL AUTOMÁTICA AO ENTRAR NA TELA (ELEVENLABS) ---
const ELEVENLABS_API_KEY = 'sk_9d8130a1fd315eaf626dfc180968547c688a999e8730c673';
const ELEVENLABS_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'; // George (Voz Oficial de Estúdio)

async function fetchElevenLabsAudio(text) {
    if (!text || !text.trim()) return null;
    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128`, {
            method: 'POST',
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) {
            console.warn('ElevenLabs API retornou erro HTTP:', response.status);
            return null;
        }

        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result); // Base64 data:audio/mp3;base64,...
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn('Erro ao buscar voz ElevenLabs no cliente:', e);
        return null;
    }
}

function getResolvedUserName() {
    // 1. Preferência explícita definida pelo usuário no modal de configurações do Jarvis
    const custom = localStorage.getItem('jarvis_user_name');
    if (custom && custom.trim()) return custom.trim();

    // 2. Do objeto loggedUser retornado pelo Supabase (tabela usuarios: nome_cliente, nome_fantasia, nome_completo ou nome)
    if (loggedUser) {
        if (loggedUser.nome_cliente && loggedUser.nome_cliente.trim()) return loggedUser.nome_cliente.trim();
        if (loggedUser.nome_fantasia && loggedUser.nome_fantasia.trim()) return loggedUser.nome_fantasia.trim();
        if (loggedUser.nome_completo && loggedUser.nome_completo.trim()) return loggedUser.nome_completo.trim();
        if (loggedUser.nome && loggedUser.nome.trim()) return loggedUser.nome.trim();
    }

    // 3. Do elemento .user-name já preenchido na interface pelo script.js
    const domUserEl = document.querySelector('.user-menu-btn .user-name') || document.querySelector('.user-name');
    if (domUserEl && domUserEl.textContent && domUserEl.textContent.trim()) {
        const text = domUserEl.textContent.trim();
        if (!text.toLowerCase().includes('automatizap') && !text.toLowerCase().includes('usuário') && !text.toLowerCase().includes('erro')) {
            return text;
        }
    }

    // 4. Do token de autenticação do Supabase no localStorage (user_metadata)
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('auth-token')) {
                const parsed = JSON.parse(localStorage.getItem(key));
                const user = parsed?.user;
                if (user?.user_metadata?.full_name) return user.user_metadata.full_name.trim();
                if (user?.user_metadata?.name) return user.user_metadata.name.trim();
                if (user?.email) {
                    const nick = user.email.split('@')[0];
                    return nick.charAt(0).toUpperCase() + nick.slice(1);
                }
            }
        }
    } catch(e) {}

    return 'Arthur';
}

function formatGreetingName(name) {
    if (!name) return 'Gestor';
    const trimmed = name.trim();
    // Se começar com prefixos de respeito como "Seu", "Dona", "Sr.", "Sra.", preserva o conjunto (ex: "Seu Geremias", "Dona Maria")
    const matchPrefix = trimmed.match(/^(seu|dona|sr\.|sra\.)\s+\S+/i);
    if (matchPrefix) {
        return matchPrefix[0];
    }
    // Caso contrário, pega o primeiro nome
    return trimmed.split(' ')[0];
}

async function initJarvisGreeting() {
    if (greetingSpoken) return;
    greetingSpoken = true;

    // Limpa cache antigo que continha "gestor"
    try {
        ['dia', 'tarde', 'noite'].forEach(p => {
            localStorage.removeItem(`jarvis_voice_v3_${p}_gestor`);
            localStorage.removeItem(`jarvis_voice_v2_${p}_gestor`);
        });
    } catch(e) {}

    const fullName = getResolvedUserName();
    const salutationName = formatGreetingName(fullName);

    // Saudação dinâmica pelo horário de Brasília
    const now = window.getBrasiliaDate ? window.getBrasiliaDate() : new Date();
    const hour = now.getHours();
    let timeGreeting = 'Bom dia!';
    let periodKey = 'dia';
    if (hour >= 12 && hour < 18) {
        timeGreeting = 'Boa tarde!';
        periodKey = 'tarde';
    } else if (hour >= 18 || hour < 5) {
        timeGreeting = 'Boa noite!';
        periodKey = 'noite';
    }

    const greetingText = `Fala, ${salutationName}! Tudo bom contigo? ${timeGreeting} O que você deseja saber sobre o dia de hoje?`;

    // Adiciona fala ao histórico
    addChatMessage('jarvis', greetingText);

    // Cache local no navegador para reprodução instantânea (0ms e sem gastar cota a cada F5)
    const cacheKey = `jarvis_voice_v4_${periodKey}_${salutationName.toLowerCase().replace(/\s+/g, '_')}`;
    let audioData = null;
    try {
        audioData = localStorage.getItem(cacheKey);
    } catch (e) {}

    if (!audioData) {
        setOrbState('thinking');
        setStatusText('Preparando áudio...');
        audioData = await fetchElevenLabsAudio(greetingText);
        if (audioData) {
            try {
                localStorage.setItem(cacheKey, audioData);
            } catch (e) {}
        }
    }

    // Fala por voz com a voz oficial George (ElevenLabs)
    await speakJarvis(greetingText, audioData);

    // Após terminar a fala, abre o microfone para escutar
    if (!isMuted) {
        setTimeout(startListening, 400);
    }
}

// --- 2. REPRODUÇÃO DE ÁUDIO EXCLUSIVA ELEVENLABS (SEM VOZ ROBÓTICA) ---
let currentAudioPlayer = null;

function speakJarvis(text, audioUrlOrBase64 = null) {
    return new Promise(async (resolve) => {
        if (isMuted) {
            if (currentAudioPlayer) {
                try { currentAudioPlayer.pause(); currentAudioPlayer = null; } catch(e) {}
            }
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            resolve();
            return;
        }

        // Para qualquer áudio anterior
        if (currentAudioPlayer) {
            try { currentAudioPlayer.pause(); currentAudioPlayer = null; } catch(e) {}
        }
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }

        // Limpa formatações para texto
        const cleanText = (text || '')
            .replace(/\*+/g, '')
            .replace(/#{1,6}\s+/g, '')
            .replace(/`/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .trim();

        let finalAudio = audioUrlOrBase64;
        if (!finalAudio && cleanText.length > 0) {
            setOrbState('thinking');
            setStatusText('Preparando resposta...');
            finalAudio = await fetchElevenLabsAudio(cleanText);
        }

        // Toca o Áudio Ultra-Realista do ElevenLabs
        if (finalAudio && typeof finalAudio === 'string' && finalAudio.length > 50) {
            const audio = new Audio(finalAudio);
            currentAudioPlayer = audio;

            audio.onplay = () => {
                isSpeaking = true;
                setOrbState('speaking');
                const asstName = typeof getAssistantName === 'function' ? getAssistantName() : 'Jarvis';
                setStatusText(`${asstName} falando...`);
            };

            audio.onended = () => {
                isSpeaking = false;
                setOrbState('idle');
                setStatusText('Toque no microfone para falar');
                currentAudioPlayer = null;
                resolve();
            };

            audio.onerror = (err) => {
                console.warn('Erro ao reproduzir áudio ElevenLabs:', err);
                currentAudioPlayer = null;
                isSpeaking = false;
                setOrbState('idle');
                setStatusText('Toque no microfone para falar');
                resolve();
            };

            audio.play().catch(err => {
                console.warn('Autoplay bloqueado pelo navegador antes do primeiro clique:', err);
                // NUNCA aciona voz robótica! Registra para tocar com voz ElevenLabs no primeiro clique
                const playOnFirstInteraction = () => {
                    document.removeEventListener('click', playOnFirstInteraction);
                    document.removeEventListener('touchstart', playOnFirstInteraction);
                    audio.play().catch(() => {});
                };
                document.addEventListener('click', playOnFirstInteraction, { once: true });
                document.addEventListener('touchstart', playOnFirstInteraction, { once: true });

                isSpeaking = false;
                setOrbState('idle');
                setStatusText('Toque na tela ou no microfone para ouvir');
                resolve();
            });
            return;
        }

        // Fallback para voz nativa do navegador caso ElevenLabs esteja sem créditos
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'pt-BR';
            utterance.rate = 1.05;
            utterance.pitch = 1.0;

            const voices = window.speechSynthesis.getVoices() || [];
            const ptVoice = voices.find(v => v.lang && v.lang.replace('_', '-').toLowerCase().startsWith('pt-br') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Luciana') || v.name.includes('Felipe') || v.name.includes('Francisca') || v.name.includes('Antonio') || v.name.includes('Yara') || v.name.includes('Daniel') || v.name.includes('Maria')))
                         || voices.find(v => v.lang && v.lang.replace('_', '-').toLowerCase().startsWith('pt-br'))
                         || voices.find(v => v.lang && v.lang.toLowerCase().startsWith('pt'));
            if (ptVoice) utterance.voice = ptVoice;

            utterance.onstart = () => {
                isSpeaking = true;
                setOrbState('speaking');
                const asstName = typeof getAssistantName === 'function' ? getAssistantName() : 'Jarvis';
                setStatusText(`${asstName} falando...`);
            };

            const onFinish = () => {
                isSpeaking = false;
                setOrbState('idle');
                setStatusText('Toque no microfone para falar');
                resolve();
            };

            utterance.onend = onFinish;
            utterance.onerror = onFinish;

            window.speechSynthesis.speak(utterance);
            return;
        }

        isSpeaking = false;
        setOrbState('idle');
        setStatusText('Toque no microfone para falar');
        resolve();
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

    recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && transcript.trim()) {
            const clean = normalizeSpeechPhonetics(transcript.trim());
            const farewellRegex = /^(obrigad[oa]|valeu|tchau|at[eé]\s+mais|pode\s+fechar|fechar|encerra[r]?|s[oó]\s+isso|falou|at[eé]\s+logo|pode\s+parar|desativa[r]?|nada\s+mais)\b/i;
            if (farewellRegex.test(clean)) {
                const rawName = getResolvedUserName();
                const salutationName = formatGreetingName(rawName);
                const farewellMsg = `Por nada, ${salutationName}! Se precisar de mais alguma coisa, é só me chamar. Até mais!`;
                addChatMessage('jarvis', farewellMsg);
                await speakJarvis(farewellMsg);
                stopListening();
                setOrbState('idle');
                setStatusText('Toque no microfone para falar');
                return;
            }
            handleUserMessage(clean);
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
    const normalizedText = normalizeSpeechPhonetics(userText);
    addChatMessage('user', normalizedText);

    const rawName = getResolvedUserName();
    const salutationName = formatGreetingName(rawName);

    // 1. Comando para mudar o nome do assistente (ex: "Quero que você se chame Reinaldo")
    const renameRegex = /(?:quero\s+(?:que\s+(?:voc[eê]|vc)\s+)?(?:se\s+chame|passe\s+a\s+se\s+chamar)|quero\s+te\s+chamar\s+de|mude\s+(?:seu\s+)?nome\s+para|troque\s+(?:seu\s+)?nome\s+para|seu\s+nome\s+agora\s+[eé]|agora\s+(?:seu\s+nome\s+[eé]|(?:voc[eê]|vc)\s+se\s+chama)|vou\s+te\s+chamar\s+de|a\s+partir\s+de\s+agora\s+(?:voc[eê]|vc\s+)?(?:se\s+chama|[eé]))\s+([A-Za-zÀ-ÿ]+)/i;
    const renameMatch = normalizedText.match(renameRegex);
    if (renameMatch && renameMatch[1]) {
        const newName = setAssistantName(renameMatch[1]);
        const confirmMsg = `Entendido, ${salutationName}! A partir de agora meu nome é ${newName}. Pode me chamar de "${newName}" sempre que precisar!`;
        addChatMessage('jarvis', confirmMsg);
        await speakJarvis(confirmMsg);
        return;
    }

    // 2. Pergunta sobre o nome do assistente
    const nameInquiryRegex = /(qual\s+[eé]\s+(o\s+)?seu\s+nome|quem\s+[eé]\s+voc[eê]|como\s+(voc[eê]|vc)\s+se\s+chama)/i;
    if (nameInquiryRegex.test(normalizedText)) {
        const assistant = getAssistantName();
        const reply = `Meu nome é ${assistant}, ${salutationName}! Em que posso te ajudar hoje?`;
        addChatMessage('jarvis', reply);
        await speakJarvis(reply);
        return;
    }

    // 3. Regra de segurança e escopo (Guardrail antidesvio de função)
    if (isQuestionOutOfScope(normalizedText)) {
        console.warn('🛡️ Pergunta fora de escopo bloqueada no chat:', normalizedText);
        const guardrailReply = getRandomOutOfScopeReply(salutationName);
        addChatMessage('jarvis', guardrailReply);
        await speakJarvis(guardrailReply);
        return;
    }

    setOrbState('thinking');

    // Inicia frases contextuais dinâmicas do garçom!
    const phrases = getContextualPhrases(normalizedText);
    let phraseIdx = 0;
    setStatusText(phrases[0]);
    const phraseInterval = setInterval(() => {
        phraseIdx = (phraseIdx + 1) % phrases.length;
        setStatusText(phrases[phraseIdx]);
    }, 1800);

    const empresaName = loggedUser?.nome_fantasia || loggedUser?.nome_completo || 'sua empresa';
    const webhookUrl = getWebhookUrl();

    const payload = {
        message: normalizedText,
        pergunta: normalizedText,
        user_name: salutationName,
        nome_cliente: salutationName,
        nome_empresa: empresaName,
        nome_usuario: rawName,
        user_id: loggedUser ? loggedUser.id : null,
        company_id: loggedUser ? loggedUser.id : null,
        assistant_name: getAssistantName(),
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

        clearInterval(phraseInterval);

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
        const elevenAudio = (data && (data.audio || data.audio_base64)) || (Array.isArray(data) && data[0] && (data[0].audio || data[0].audio_base64)) || null;
        await speakJarvis(aiAnswer, elevenAudio);

    } catch (err) {
        clearInterval(phraseInterval);
        console.warn('Erro ao consultar Webhook do AI Agent:', err);
        
        const fallbackMsg = `Estou pronto para raciocinar via IA Agent! O webhook está configurado para: ${webhookUrl}. Assim que você ativar o fluxo do AI Agent no n8n, responderei com dados em tempo real e raciocínio completo!`;
        
        addChatMessage('jarvis', fallbackMsg);
        await speakJarvis('Estou pronto para conversar! Basta ativar o fluxo do AI Agent no seu n8n para eu consultar o Supabase ao vivo.');
    } finally {
        if (!isMuted) {
            setTimeout(() => {
                if (!isSpeaking && !isListening) {
                    startListening();
                    setStatusText('Ouvindo você... (pode fazer a próxima pergunta)');
                }
            }, 500);
        } else {
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
    if (window.setJarvisScreenGlow) {
        window.setJarvisScreenGlow(state === 'thinking' ? 'listening' : state);
    }
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

// --- 7.1. DROPDOWN DO HISTÓRICO DE CONVERSAS (EXCLUSIVO MOBILE) ---
function setupTranscriptDropdown() {
    const header = document.getElementById('jarvis-transcript-header');
    const card = document.getElementById('jarvis-transcript-card');
    if (!header || !card) return;

    header.addEventListener('click', () => {
        // Ativo apenas na versão mobile (<= 768px)
        if (window.innerWidth <= 768) {
            const isOpen = card.classList.toggle('is-open');
            if (isOpen && chatTimelineElement) {
                setTimeout(() => {
                    chatTimelineElement.scrollTop = chatTimelineElement.scrollHeight;
                }, 80);
            }
        }
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
    const inputName = document.getElementById('input-jarvis-user-name');

    if (!btnConfig || !modal) return;

    btnConfig.onclick = () => {
        if (inputUrl) {
            inputUrl.value = getWebhookUrl();
        }
        if (inputName) {
            inputName.value = getResolvedUserName();
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
            if (inputUrl) {
                const val = inputUrl.value.trim();
                if (val) {
                    localStorage.setItem('jarvis_webhook_url', val);
                }
            }
            if (inputName) {
                const nameVal = inputName.value.trim();
                if (nameVal) {
                    const oldName = localStorage.getItem('jarvis_user_name');
                    if (nameVal !== oldName) {
                        localStorage.setItem('jarvis_user_name', nameVal);
                        // Limpa o cache para forçar a nova voz com o novo nome
                        ['dia', 'tarde', 'noite'].forEach(p => {
                            localStorage.removeItem(`jarvis_voice_v3_${p}_${nameVal.toLowerCase().split(' ')[0]}`);
                        });
                    }
                }
            }
            showJarvisToast('Configurações Salvas', 'Configurações do Jarvis atualizadas!');
            closeModal();
        };
    }

    if (btnReset) {
        btnReset.onclick = () => {
            localStorage.removeItem('jarvis_webhook_url');
            localStorage.removeItem('jarvis_user_name');
            if (inputUrl) inputUrl.value = DEFAULT_WEBHOOK_URL;
            if (inputName) inputName.value = getResolvedUserName();
            showJarvisToast('Restaurado', 'Configurações restauradas para o padrão.');
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
