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
let modalOverlayElement = null;
let modalContainerElement = null;
let modalOrbElement = null;
let modalCaptionElement = null;
let modalBadgeElement = null;
let modalExitTimeout = null;
let currentAudioPlayer = null;
let silenceTimer = null;
let wakeActive = false;
let resolvedUser = null;
let watchdogInterval = null;
let hasUserInteracted = false;
const markGlobalInteraction = () => {
    hasUserInteracted = true;
};
if (typeof window !== 'undefined') {
    window.addEventListener('click', markGlobalInteraction, { passive: true });
    window.addEventListener('touchstart', markGlobalInteraction, { passive: true });
    window.addEventListener('keydown', markGlobalInteraction, { passive: true });
    window.addEventListener('scroll', markGlobalInteraction, { passive: true });
}

// --- NORMALIZAÇÃO FONÉTICA INTELIGENTE DE TERMOS DE VOZ (LEADS) ---
export function normalizeSpeechPhonetics(rawText) {
    if (!rawText || typeof rawText !== 'string') return rawText;
    let normalized = rawText;

    // Normaliza variações fonéticas onde pt-BR confunde "leads" com "litros", "lides", "leds", "lids", "lidis"
    normalized = normalized
        .replace(/\b(quantos?|quais|total de|todos os|novos?|meus?|esses?|aqueles?|filtrar|ver|listar|buscar|mostrar|cadastrar|salvar|chamou|entrou|entraram)\s+(litros?|lides?|ledes?|lids?|lidis?)\b/gi, '$1 leads')
        .replace(/\b(litros|lides|ledes|lids|lidis)\b/gi, (match) => {
            return match.toLowerCase().endsWith('s') ? 'leads' : 'lead';
        })
        .replace(/\b(um|o|novo|esse|aquele)\s+litro\b/gi, '$1 lead');

    return normalized;
}

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
        const farewell = `Por nada, ${clientName}! Se precisar de mais alguma coisa, estou à disposição. Até logo!`;
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

// --- 1.1 CONTROLE DE NOME PERSONALIZADO DO ASSISTENTE ---
export function getAssistantName() {
    const custom = localStorage.getItem('jarvis_assistant_custom_name');
    if (custom && custom.trim()) return custom.trim();
    return 'Jarvis';
}

export function setAssistantName(newName) {
    if (!newName || !newName.trim()) return 'Jarvis';
    const clean = newName.trim().charAt(0).toUpperCase() + newName.trim().slice(1).toLowerCase();
    localStorage.setItem('jarvis_assistant_custom_name', clean);
    updateAssistantNameUI(clean);
    return clean;
}

export function updateAssistantNameUI(name = null) {
    const assistant = name || getAssistantName();
    document.querySelectorAll('.jarvis-assistant-name-display').forEach(el => {
        el.textContent = assistant;
    });
}

function getWakeRegex() {
    const assistant = getAssistantName();
    const escaped = assistant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:fala\\s+)?(?:${escaped}|jarvis|jarbas|iarvis)`, 'i');
}

function stripWakeWord(text) {
    const assistant = getAssistantName();
    const escaped = assistant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^(?:fala\\s+)?(?:${escaped}|jarvis|jarbas|iarvis)[,.?!]?\\s*(?:t[aá]\\s+por\\s+a[ií][,.]?|tudo\\s+bom[,.]?|tudo\\s+bem[,.]?|bom\\s+dia[,.]?|boa\\s+tarde[,.]?|boa\\s+noite[,.]?)?\\s*`, 'i');
    return text.replace(pattern, '').trim();
}

// --- 1.2 FRASES CONTEXTUAIS DINÂMICAS ENQUANTO CONSULTA (ANALOGIA DO GARÇOM) ---
export function getContextualPhrases(question = '') {
    const q = (question || '').toLowerCase();

    // 1. Agendamentos / Agenda / Reuniões / Horários / Calendário / Tarefas
    if (/(agend|agenda|reuni|hor[aá]ri|amanh[aã]|calend[aá]ri|compromiss|tarefa)/i.test(q)) {
        return [
            'Abrindo sua agenda...',
            'Olhando os horários de amanhã...',
            'Contando os agendamentos...',
            'Conferindo os nomes dos clientes...',
            'Organizando tudo pra você...',
            'Finalizando consulta da agenda...'
        ];
    }

    // 2. Leads / Clientes / Contatos / Novos / Entraram / Chamaram / Números
    if (/(lead|cliente|contat|entrou|entraram|chamou|chamaram|novo|novos|cadastr|recuperar|n[uú]mero)/i.test(q)) {
        return [
            'Fazendo pesquisa...',
            'Analisando histórico de leads...',
            'Reunindo dados...',
            'Coletando os últimos contatos...',
            'Organizando tudo pra você...',
            'Quase pronto...'
        ];
    }

    // 3. Conversas / Mensagens / WhatsApp / Falou / Disse / Áudios
    if (/(conversa|whatsapp|zap|mensag|falou|disse|[aá]udio|texto|bate-papo)/i.test(q)) {
        return [
            'Acessando conversas do WhatsApp...',
            'Localizando as últimas mensagens...',
            'Lendo o histórico dos diálogos...',
            'Entendendo o assunto...',
            'Organizando o resumo...'
        ];
    }

    // 4. Relatórios / Métricas / Gráficos / Faturamento / Conversão / Vendas / Desempenho
    if (/(relat|m[eé]tric|gr[aá]fic|fatur|convers|venda|desempenh|taxa|total|porcent)/i.test(q)) {
        return [
            'Consultando painel de métricas...',
            'Calculando taxas e números...',
            'Comparando desempenho...',
            'Gerando resumo dos resultados...',
            'Quase pronto...'
        ];
    }

    // 5. Configurações / Empresa / Assinatura / Plano / Pix / Conta
    if (/(config|empresa|assinatur|plano|pix|conta|perfil|pagamento)/i.test(q)) {
        return [
            'Acessando suas configurações...',
            'Verificando dados da empresa...',
            'Conferindo informações...',
            'Organizando os detalhes...'
        ];
    }

    // 6. Genérico / Outras perguntas (Analogia do Garçom)
    return [
        'Já anotei sua pergunta...',
        'Consultando a base de dados...',
        'Analisando as informações...',
        'Reunindo tudo pra você...',
        'Já está saindo a resposta...'
    ];
}

// --- 1.3 REGRA DE SEGURANÇA E ESCOPO (GUARDRAIL ANTIDESVIO DE FUNÇÃO) ---
export function isQuestionOutOfScope(question) {
    if (!question || typeof question !== 'string') return false;
    const q = question.toLowerCase().trim();

    // 1. Saudações, despedidas e comandos do assistente NUNCA estão fora de escopo
    if (/^(oi|ol[aá]|bom\s+dia|boa\s+tarde|boa\s+noite|tudo\s+bem|tudo\s+bom|opa|e\s+a[ií]|t[aá]\s+por\s+a[ií]|valeu|obrigad[oa]|tchau|at[eé]\s+mais|fechar|encerrar|parar|desativar)\b/i.test(q)) {
        return false;
    }
    // Perguntas sobre a identidade do assistente
    if (/(qual\s+[eé]\s+(o\s+)?seu\s+nome|quem\s+[eé]\s+voc[eê]|como\s+(voc[eê]|vc)\s+se\s+chama|o\s+que\s+(voc[eê]|vc)\s+faz|como\s+(voc[eê]|vc)\s+funciona|ajuda|quem\s+[eé]\s+o\s+jarvis)/i.test(q)) {
        return false;
    }
    // Comandos de alteração de nome do assistente
    if (/(?:mude|troque|chame|passar\s+a\s+se\s+chamar|vou\s+te\s+chamar)\s+(?:de|para)?/i.test(q)) {
        return false;
    }

    // 2. Perguntas expressamente fora de escopo (Matemática, receitas, trivia, curiosidades, piadas, etc.)
    const explicitOutOfScopeRegex = /(?:raiz\s+(?:quadrada|c[uú]bica)|quanto\s+[eé]\s+\d+|calcule\s+\d+|seno\s+de|cosseno\s+de|tabuada|soma\s+de|subtra[cç][aã]o|equa[cç][aã]o|capital\s+d[eao]|quem\s+(?:foi|descobriu|inventou|ganhou|escreveu|pintou|criou\s+o\s+mundo)|em\s+que\s+ano|quantos\s+planetas|presidente\s+d[eao]|hist[oó]ria\s+d[eao]|receita\s+de|como\s+(?:fazer|cozinhar|preparar)\s+(?:bolo|arroz|comida|doce|torta|caf[eé]|carne|almo[cç]o)|ingredientes\s+d[eao]|conte\s+uma?\s+piada|canta|letra\s+da\s+m[uú]sica|filme|futebol|quem\s+venceu\s+o\s+jogo|previs[aã]o\s+do\s+tempo|vai\s+chover|rem[eé]dio\s+pra?|sintomas\s+de|como\s+curar|c[oó]digo\s+em\s+python|programa\s+em|escreva\s+um\s+script|fa[cç]a\s+um\s+poema|escreva\s+uma\s+reda[cç][aã]o|conte\s+uma\s+hist[oó]ria)/i;

    if (explicitOutOfScopeRegex.test(q)) {
        return true;
    }

    // 3. Palavras-chave essenciais das operações de WhatsApp, CRM, Atendimento e Negócio
    const allowedContextRegex = /(lead|cliente|contat|n[uú]mero|telefone|pessoa|atendid|atendimento|chamou|chamaram|entrou|entraram|quente|frio|recuperar|cadastr|conversa|whatsapp|zap|mensag|disse|falou|[aá]udio|texto|di[aá]log|bate-papo|agenda|agend|reuni|hor[aá]ri|compromiss|tarefa|calend[aá]ri|amanh[aã]|hoje|ontem|semana|m[eê]s|madrugada|noite|dia|tarde|relat|m[eé]tric|gr[aá]fic|taxa|convers|venda|fatur|desempenh|resultad|total|quantos?|quais|quanto|valor|pre[cç]o|plano|mensalidade|venciment|pagament|pix|assinatur|empresa|configura[cç]|perfil|conta|ajuda|status|rob[oô]|ia|bot|secret[aá]ri|operador|victor|geremias)/i;

    // Se NÃO contém nenhuma menção nem intenção ligada ao CRM/WhatsApp:
    if (!allowedContextRegex.test(q)) {
        // Frases muito curtas de diálogo natural ("sim", "não", "como assim", "repita", "ok") são permitidas
        if (q.split(/\s+/).length <= 2 && /(sim|n[aã]o|como|que|fala|ok|beleza|certo|entendi|repita)/i.test(q)) {
            return false;
        }
        return true;
    }

    return false;
}

export const OUT_OF_SCOPE_RESPONSES = [
    (clientName) => `Desculpe, ${clientName}, eu cuido do atendimento aos seus clientes e das informações do WhatsApp da empresa. Quer que eu verifique quantos novos contatos entraram hoje?`,

    (clientName) => `Desculpe, ${clientName}, meu trabalho aqui é acompanhar os clientes e o fluxo de mensagens do seu WhatsApp. Qual informação do seu atendimento você gostaria de consultar?`,

    (clientName) => `${clientName}, estou à sua disposição para o atendimento aos seus clientes e o acompanhamento do WhatsApp da empresa. Deseja saber quantos clientes foram atendidos no dia de ontem?`,

    (clientName) => `Desculpe, ${clientName}, consigo te ajudar com os dados e as conversas dos seus clientes no sistema. Gostaria de saber quem foi atendido recentemente?`
];

let lastOutOfScopeIndex = -1;

export function getRandomOutOfScopeReply(clientName) {
    let index;
    do {
        index = Math.floor(Math.random() * OUT_OF_SCOPE_RESPONSES.length);
    } while (index === lastOutOfScopeIndex && OUT_OF_SCOPE_RESPONSES.length > 1);

    lastOutOfScopeIndex = index;
    return OUT_OF_SCOPE_RESPONSES[index](clientName);
}

let thinkingPhrasesInterval = null;

function startThinkingPhrases(question) {
    stopThinkingPhrases();
    if (!modalCaptionElement) return;

    const phrases = getContextualPhrases(question);
    let index = 0;

    // Exibe a primeira frase imediatamente
    setCaptionWithFade(phrases[0]);

    // Troca suavemente com fade a cada 1.8 segundos
    thinkingPhrasesInterval = setInterval(() => {
        index = (index + 1) % phrases.length;
        setCaptionWithFade(phrases[index]);
    }, 1800);
}

function stopThinkingPhrases() {
    if (thinkingPhrasesInterval) {
        clearInterval(thinkingPhrasesInterval);
        thinkingPhrasesInterval = null;
    }
}

function setCaptionWithFade(newText) {
    if (!modalCaptionElement) return;
    if (modalCaptionElement.textContent === newText) return;

    modalCaptionElement.classList.add('fade-out');
    setTimeout(() => {
        modalCaptionElement.textContent = newText;
        modalCaptionElement.classList.remove('fade-out');
        modalCaptionElement.classList.add('fade-in');
        setTimeout(() => {
            modalCaptionElement.classList.remove('fade-in');
        }, 50);
    }, 240);
}

// --- 2. CONTROLE DO MODAL CENTRAL COM ORBE 3D E ESPELHO DESFOCADO ---
function createGlowElements() {
    if (!glowElement && !document.getElementById('jarvis-screen-glow')) {
        glowElement = document.createElement('div');
        glowElement.id = 'jarvis-screen-glow';
        glowElement.className = 'jarvis-screen-glow';
        document.body.appendChild(glowElement);
    } else if (!glowElement) {
        glowElement = document.getElementById('jarvis-screen-glow');
    }

    if (!modalOverlayElement && !document.getElementById('jarvis-wake-overlay')) {
        modalOverlayElement = document.createElement('div');
        modalOverlayElement.id = 'jarvis-wake-overlay';
        modalOverlayElement.className = 'jarvis-wake-overlay';
        modalOverlayElement.innerHTML = `
            <div class="jarvis-wake-modal" id="jarvis-wake-modal">
                <div class="jarvis-wake-siri-wrapper">
                    <div class="siri" id="jarvis-wake-orb">
                        <div class="blob b1"></div>
                        <div class="blob b2"></div>
                        <div class="blob b3"></div>
                        <div class="blob b4"></div>
                        <div class="brilho"></div>
                    </div>
                </div>

                <!-- Subtítulo flutuante minimalista sem card gigante -->
                <div class="jarvis-wake-caption-wrapper">
                    <div class="jarvis-wake-caption-text" id="jarvis-wake-caption">Estou te ouvindo</div>
                    <div class="jarvis-wake-hint-text">Diga "valeu" ou clique fora para encerrar</div>
                </div>
            </div>

            <!-- Botão fechar discreto no canto superior da tela -->
            <button id="btn-close-jarvis-modal" class="jarvis-wake-screen-close" type="button" title="Fechar (Esc)">
                <i class="ph ph-x"></i>
            </button>
        `;
        document.body.appendChild(modalOverlayElement);

        modalContainerElement = modalOverlayElement.querySelector('#jarvis-wake-modal');
        modalOrbElement = modalOverlayElement.querySelector('#jarvis-wake-orb');
        modalCaptionElement = modalOverlayElement.querySelector('#jarvis-wake-caption');

        // Botão de fechar modal
        modalOverlayElement.querySelector('#btn-close-jarvis-modal')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            endConversationSession(false);
        });

        // Fechar ao clicar no fundo desfocado (fora do modal)
        modalOverlayElement.addEventListener('click', (e) => {
            if (e.target === modalOverlayElement) {
                endConversationSession(false);
            }
        });

        // Fechar ao teclar Esc
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isConversationActive) {
                endConversationSession(false);
            }
        });
    } else if (!modalOverlayElement) {
        modalOverlayElement = document.getElementById('jarvis-wake-overlay');
        modalContainerElement = document.getElementById('jarvis-wake-modal');
        modalOrbElement = document.getElementById('jarvis-wake-orb');
        modalCaptionElement = document.getElementById('jarvis-wake-caption');
    }
}

export function setJarvisScreenGlow(state, text = '') {
    createGlowElements();
    if (!glowElement || !modalOverlayElement) return;

    if (modalExitTimeout) {
        clearTimeout(modalExitTimeout);
        modalExitTimeout = null;
    }

    if (silenceTimer && state !== 'listening') {
        clearSilenceTimer();
    }

    if (state === 'listening') {
        stopThinkingPhrases();
        glowElement.classList.remove('speaking', 'closing');
        glowElement.classList.add('active', 'listening');

        modalOverlayElement.classList.remove('exiting');
        modalOverlayElement.classList.add('visible');

        if (modalOrbElement) {
            modalOrbElement.classList.remove('speaking', 'thinking');
            modalOrbElement.classList.add('listening');
        }
        setCaptionWithFade(text || 'Estou te ouvindo');
    } else if (state === 'speaking') {
        stopThinkingPhrases();
        glowElement.classList.remove('listening', 'closing');
        glowElement.classList.add('active', 'speaking');

        modalOverlayElement.classList.remove('exiting');
        modalOverlayElement.classList.add('visible');

        if (modalOrbElement) {
            modalOrbElement.classList.remove('listening', 'thinking');
            modalOrbElement.classList.add('speaking');
        }
        // Remove a resposta em texto debaixo da orbe (conforme solicitado pelo usuário)
        setCaptionWithFade('');
    } else if (state === 'thinking') {
        glowElement.classList.remove('listening', 'closing');
        glowElement.classList.add('active', 'speaking');

        modalOverlayElement.classList.remove('exiting');
        modalOverlayElement.classList.add('visible');

        if (modalOrbElement) {
            modalOrbElement.classList.remove('listening', 'speaking');
            modalOrbElement.classList.add('thinking');
        }
        if (text) {
            setCaptionWithFade(text);
        }
    } else if (state === 'idle') {
        stopThinkingPhrases();
        glowElement.classList.remove('listening', 'speaking');
        glowElement.classList.add('closing');

        // Animação de saída de cima/meio para baixo
        if (modalOverlayElement.classList.contains('visible')) {
            modalOverlayElement.classList.add('exiting');
            modalOverlayElement.classList.remove('visible');

            modalExitTimeout = setTimeout(() => {
                modalOverlayElement.classList.remove('exiting');
                if (modalOrbElement) {
                    modalOrbElement.classList.remove('listening', 'speaking', 'thinking');
                }
                modalExitTimeout = null;
            }, 450);
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
                setJarvisScreenGlow('speaking');
            };

            const onFinish = () => {
                isSpeaking = false;
                lastSpokeEndTime = Date.now();
                if (isConversationActive) {
                    setJarvisScreenGlow('listening', 'Estou te ouvindo');
                }
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

            if (isConversationActive) {
                setJarvisScreenGlow('listening', 'Estou te ouvindo');
            }

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
            setJarvisScreenGlow('thinking', 'Preparando resposta...');
            src = await fetchElevenLabsSpeech(cleanText);
        }

        // 1. Áudio de estúdio do ElevenLabs disponível
        if (src && typeof src === 'string' && src.length > 50) {
            const audio = new Audio(src);
            currentAudioPlayer = audio;

            audio.onplay = () => {
                isSpeaking = true;
                setJarvisScreenGlow('speaking');
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
    const cleanUserQuestion = normalizeSpeechPhonetics(userQuestion);
    const clientName = getClientGreetingName();

    // 0. GUARDRAIL ANTIDESVIO DE FUNÇÃO
    if (isQuestionOutOfScope(cleanUserQuestion)) {
        console.warn('🛡️ Pergunta fora de escopo bloqueada:', cleanUserQuestion);
        const guardrailReply = getRandomOutOfScopeReply(clientName);
        setJarvisScreenGlow('speaking');
        await playJarvisVoice(guardrailReply);
        setJarvisScreenGlow('listening', 'Estou te ouvindo');
        startSilenceTimer(60000);
        setTimeout(() => {
            ensureSpeechRecognitionActive();
        }, 300);
        return;
    }

    const assistantName = getAssistantName();

    // Ativa a orbe em modo thinking e inicia as frases contextuais do garçom!
    setJarvisScreenGlow('thinking');
    startThinkingPhrases(cleanUserQuestion);

    const companyId = resolvedUser ? (resolvedUser.id_empresa || resolvedUser.id) : (localStorage.getItem('jarvis_company_id') || 'jarvis_crm');

    const payload = {
        message: cleanUserQuestion,
        pergunta: cleanUserQuestion,
        chatInput: cleanUserQuestion,
        user_name: clientName,
        nome_cliente: clientName,
        nome_empresa: resolvedUser?.nome_fantasia || resolvedUser?.nome_completo || 'sua empresa',
        user_id: resolvedUser ? resolvedUser.id : null,
        company_id: companyId,
        id_empresa: companyId,
        data_vencimento: resolvedUser?.data_vencimento || window.tenantVencDateStr || null,
        assistant_name: assistantName,
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

        // Quando a resposta fica pronta, as frases param e a resposta é falada!
        stopThinkingPhrases();
        setJarvisScreenGlow('speaking');
        await playJarvisVoice(responseText, audioSrc);
    } catch (err) {
        console.warn('Erro ao consultar n8n:', err);
        stopThinkingPhrases();
        const fallback = `Desculpe, ${clientName}, tive uma instabilidade momentânea para consultar os dados. Pode repetir?`;
        setJarvisScreenGlow('speaking');
        await playJarvisVoice(fallback);
    } finally {
        stopThinkingPhrases();
        // CONVERSA CONTÍNUA:
        // Mantém o assistente ouvindo para as próximas perguntas até o usuário se despedir ou pausar!
        if (isConversationActive) {
            setJarvisScreenGlow('listening', 'Estou te ouvindo');
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
            setJarvisScreenGlow('listening', 'Estou te ouvindo');
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
        const rawTranscript = normalizeSpeechPhonetics(transcript.trim());
        if (!rawTranscript) return;

        // Supressão de eco pós-áudio apenas para ruídos de menos de 5 caracteres
        if (Date.now() - lastSpokeEndTime < 300 && rawTranscript.length < 5) return;

        console.log('🗣️ Voz ouvida:', rawTranscript, '| Conversa ativa:', isConversationActive);

        // 1. COMANDO PARA MUDAR O NOME DO ASSISTENTE (ex: "Quero que você se chame Reinaldo" / "Mude seu nome para Reinaldo")
        const renameRegex = /(?:quero\s+(?:que\s+(?:voc[eê]|vc)\s+)?(?:se\s+chame|passe\s+a\s+se\s+chamar)|quero\s+te\s+chamar\s+de|mude\s+(?:seu\s+)?nome\s+para|troque\s+(?:seu\s+)?nome\s+para|seu\s+nome\s+agora\s+[eé]|agora\s+(?:seu\s+nome\s+[eé]|(?:voc[eê]|vc)\s+se\s+chama)|vou\s+te\s+chamar\s+de|a\s+partir\s+de\s+agora\s+(?:voc[eê]|vc\s+)?(?:se\s+chama|[eé]))\s+([A-Za-zÀ-ÿ]+)/i;
        const renameMatch = rawTranscript.match(renameRegex);
        if (renameMatch && renameMatch[1]) {
            isConversationActive = true;
            clearSilenceTimer();
            const newName = renameMatch[1].trim();
            const formattedName = setAssistantName(newName);
            const clientName = getClientGreetingName();
            const confirmMsg = `Entendido, ${clientName}! A partir de agora meu nome é ${formattedName}. Pode me chamar de "Fala ${formattedName}" sempre que precisar!`;
            setJarvisScreenGlow('speaking');
            await playJarvisVoice(confirmMsg);
            setJarvisScreenGlow('listening', 'Estou te ouvindo');
            startSilenceTimer(60000);
            setTimeout(() => {
                ensureSpeechRecognitionActive();
            }, 300);
            return;
        }

        // 2. PERGUNTA SOBRE O NOME DO ASSISTENTE (ex: "Qual é o seu nome?" / "Como você se chama?")
        const nameInquiryRegex = /(qual\s+[eé]\s+(o\s+)?seu\s+nome|quem\s+[eé]\s+voc[eê]|como\s+(voc[eê]|vc)\s+se\s+chama)/i;
        if (nameInquiryRegex.test(rawTranscript)) {
            isConversationActive = true;
            clearSilenceTimer();
            const assistant = getAssistantName();
            const clientName = getClientGreetingName();
            const reply = `Meu nome é ${assistant}, ${clientName}! Em que posso te ajudar hoje?`;
            setJarvisScreenGlow('speaking');
            await playJarvisVoice(reply);
            setJarvisScreenGlow('listening', 'Estou te ouvindo');
            startSilenceTimer(60000);
            setTimeout(() => {
                ensureSpeechRecognitionActive();
            }, 300);
            return;
        }

        const wakeRegex = getWakeRegex();
        const farewellRegex = /(obrigad[oa]|valeu|tchau|at[eé]\\s+mais|pode\\s+fechar|^fechar$|^encerra[r]?$|s[oó]\\s+isso|falou|at[eé]\\s+logo|pode\\s+parar|desativa[r]?|nada\\s+mais|por\\s+hoje\\s+[eé]\\s+s[oó]|era\\s+s[oó]\\s+isso)/i;

        // CENÁRIO 1: Sessão de conversa já está ATIVA (usuário fez uma pergunta ou saudação anterior)
        if (isConversationActive) {
            clearSilenceTimer();

            // Usuário pediu para encerrar a conversa ("valeu", "obrigado", "tchau", "pode fechar", "era só isso")
            if (farewellRegex.test(rawTranscript)) {
                await endConversationSession(true);
                return;
            }

            // Próxima pergunta do usuário na mesma sessão
            const cleanQuestion = stripWakeWord(rawTranscript) || rawTranscript;
            if (cleanQuestion.length >= 2) {
                if (isQuestionOutOfScope(cleanQuestion)) {
                    console.warn('🛡️ Pergunta fora de escopo bloqueada:', cleanQuestion);
                    const clientName = getClientGreetingName();
                    const guardrailReply = getRandomOutOfScopeReply(clientName);
                    setJarvisScreenGlow('speaking');
                    await playJarvisVoice(guardrailReply);
                    setJarvisScreenGlow('listening', 'Estou te ouvindo');
                    startSilenceTimer(60000);
                    setTimeout(() => {
                        ensureSpeechRecognitionActive();
                    }, 300);
                    return;
                }
                await queryJarvisAgent(cleanQuestion);
            }
            return;
        }

        // CENÁRIO 2: Sessão NÃO estava ativa, mas o usuário chamou "Fala Jarvis...", "Fala Reinaldo...", etc.
        if (wakeRegex.test(rawTranscript)) {
            isConversationActive = true;
            clearSilenceTimer();

            const clientName = getClientGreetingName();
            const cleanCommand = stripWakeWord(rawTranscript);

            if (cleanCommand.length > 3) {
                // Usuário já fez a pergunta completa de primeira!
                if (isQuestionOutOfScope(cleanCommand)) {
                    console.warn('🛡️ Pergunta fora de escopo bloqueada:', cleanCommand);
                    const guardrailReply = getRandomOutOfScopeReply(clientName);
                    setJarvisScreenGlow('speaking');
                    await playJarvisVoice(guardrailReply);
                    setJarvisScreenGlow('listening', 'Estou te ouvindo');
                    startSilenceTimer(60000);
                    setTimeout(() => {
                        ensureSpeechRecognitionActive();
                    }, 300);
                    return;
                }
                await queryJarvisAgent(cleanCommand);
            } else {
                // Apenas saudou ("Fala Jarvis", "Fala Reinaldo", etc.)
                setJarvisScreenGlow('listening', 'Estou te ouvindo');

                const hour = (window.getBrasiliaDate ? window.getBrasiliaDate() : new Date()).getHours();
                let timeGreeting = 'Bom dia';
                if (hour >= 12 && hour < 18) timeGreeting = 'Boa tarde';
                else if (hour >= 18 || hour < 5) timeGreeting = 'Boa noite';

                const greetingReply = `Olá, ${clientName}! ${timeGreeting}! Como posso ajudar você agora?`;
                setJarvisScreenGlow('speaking');
                await playJarvisVoice(greetingReply);

                // Volta para modo de escuta com orbe respirando aguardando a pergunta
                setJarvisScreenGlow('listening', 'Estou te ouvindo');
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

// --- 6.1 ATIVAÇÃO PROATIVA: LEMBRETE DE COBRANÇA (3 DIAS ANTES, 1X AO DIA) ---
export function getDaysUntilDue(dateVal) {
    if (!dateVal || dateVal === 'N/A') return null;

    const now = window.getBrasiliaDate ? window.getBrasiliaDate() : new Date();
    now.setHours(0, 0, 0, 0);

    let targetDate = null;
    const str = String(dateVal).trim();

    // Formato 1: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        const parts = str.split('T')[0].split('-');
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        targetDate = new Date(y, m, d, 0, 0, 0, 0);

        // Se a data já passou (ex: assinatura recorrente mensal todo dia X)
        if (targetDate.getTime() < now.getTime()) {
            const currentMonthDue = new Date(now.getFullYear(), now.getMonth(), d, 0, 0, 0, 0);
            if (currentMonthDue.getTime() >= now.getTime()) {
                targetDate = currentMonthDue;
            } else {
                targetDate = new Date(now.getFullYear(), now.getMonth() + 1, d, 0, 0, 0, 0);
            }
        }
    }
    // Formato 2: DD/MM/YYYY
    else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
        const parts = str.split('/');
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        targetDate = new Date(y, m, d, 0, 0, 0, 0);

        if (targetDate.getTime() < now.getTime()) {
            const currentMonthDue = new Date(now.getFullYear(), now.getMonth(), d, 0, 0, 0, 0);
            if (currentMonthDue.getTime() >= now.getTime()) {
                targetDate = currentMonthDue;
            } else {
                targetDate = new Date(now.getFullYear(), now.getMonth() + 1, d, 0, 0, 0, 0);
            }
        }
    }
    // Formato 3: Apenas o dia do mês (ex: 10, "10")
    else if (/^\d{1,2}$/.test(str)) {
        const d = parseInt(str, 10);
        const currentMonthDue = new Date(now.getFullYear(), now.getMonth(), d, 0, 0, 0, 0);
        if (currentMonthDue.getTime() >= now.getTime()) {
            targetDate = currentMonthDue;
        } else {
            targetDate = new Date(now.getFullYear(), now.getMonth() + 1, d, 0, 0, 0, 0);
        }
    }

    if (!targetDate || isNaN(targetDate.getTime())) return null;

    const diffTime = targetDate.getTime() - now.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

function getBillingReminderMessage(clientName, diffDays) {
    if (diffDays === 3) {
        return `${clientName}, passando para lembrá-lo de que a mensalidade do sistema vence em 3 dias. Te aviso com antecedência para garantir que o atendimento aos seus clientes continue funcionando sem nenhuma interrupção.`;
    }
    if (diffDays === 2) {
        return `${clientName}, passando para lembrá-lo de que faltam apenas 2 dias para o vencimento da mensalidade do sistema. Faço esse lembrete para que os atendimentos no seu WhatsApp continuem ativos normalmente.`;
    }
    if (diffDays === 1) {
        return `${clientName}, lembrando que a sua mensalidade do sistema vence amanhã. É importante realizar o pagamento para mantermos o atendimento aos seus clientes em pleno funcionamento.`;
    }
    // diffDays === 0 (Vence hoje)
    return `${clientName}, passando para avisar que a sua mensalidade do sistema vence hoje. Faço esse lembrete para mantermos o atendimento automático aos seus clientes funcionando sem interrupções.`;
}

let billingReminderTriggered = false;

export async function triggerJarvisBillingReminder(diffDays) {
    if (isSpeaking || isConversationActive || billingReminderTriggered) return;
    billingReminderTriggered = true;

    const clientName = getClientGreetingName();
    const reminderMessage = getBillingReminderMessage(clientName, diffDays);

    const now = window.getBrasiliaDate ? window.getBrasiliaDate() : new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const storageKey = `jarvis_billing_reminder_${resolvedUser?.id || 'default'}`;
    localStorage.setItem(storageKey, todayKey);

    console.log(`🔔 Jarvis ativando lembrete de cobrança: Faltam ${diffDays} dia(s) para o vencimento.`);

    isConversationActive = true;
    clearSilenceTimer();

    // 1. Abre a tela do Jarvis com a orbe centralizada no modo falando
    setJarvisScreenGlow('speaking');

    // 2. Cache local do áudio para playback imediato (0ms e economiza créditos)
    const voiceCacheKey = `jarvis_voice_billing_${diffDays}_${clientName.toLowerCase().replace(/\s+/g, '_')}`;
    let cachedAudio = null;
    try {
        cachedAudio = localStorage.getItem(voiceCacheKey);
    } catch(e) {}

    let audioToPlay = cachedAudio;
    if (!audioToPlay) {
        audioToPlay = await fetchElevenLabsSpeech(reminderMessage);
        if (audioToPlay) {
            try { localStorage.setItem(voiceCacheKey, audioToPlay); } catch(e) {}
        }
    }

    // 3. Fala o áudio do lembrete (ElevenLabs voz oficial George ou síntese nativa do navegador)
    await playJarvisVoice(reminderMessage, audioToPlay);

    // 4. Após terminar a fala, entra em modo de escuta com "Estou te ouvindo"
    setJarvisScreenGlow('listening', 'Estou te ouvindo');
    startSilenceTimer(60000); // 60 segundos de silêncio para fechar se o usuário não responder

    setTimeout(() => {
        ensureSpeechRecognitionActive();
    }, 300);
}

export function checkAndScheduleBillingReminder() {
    // 1. Verifica se já avisou hoje
    const now = window.getBrasiliaDate ? window.getBrasiliaDate() : new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const storageKey = `jarvis_billing_reminder_${resolvedUser?.id || 'default'}`;

    if (localStorage.getItem(storageKey) === todayKey) {
        return; // Já avisou hoje!
    }

    // 2. Busca data de vencimento da empresa/usuário
    const rawDate = resolvedUser?.data_vencimento || resolvedUser?.vencimento || window.tenantVencDateStr || localStorage.getItem('tenant_data_vencimento') || localStorage.getItem('user_data_vencimento');
    if (!rawDate) return;

    // 3. Calcula quantos dias faltam para a data de cobrança
    const diffDays = getDaysUntilDue(rawDate);
    if (diffDays === null || diffDays < 0 || diffDays > 3) return;

    console.log(`ℹ️ [Jarvis] Lembrete de cobrança programado para hoje. Faltam ${diffDays} dia(s) para o vencimento.`);

    // 4. Se o usuário já interagiu com a página, dispara após 1.5s
    if (hasUserInteracted) {
        setTimeout(() => {
            triggerJarvisBillingReminder(diffDays);
        }, 1500);
        return;
    }

    // 5. Caso contrário, aguarda o primeiro clique/toque do usuário (política de autoplay de áudio dos navegadores)
    let triggered = false;
    const executeTrigger = () => {
        if (triggered) return;
        triggered = true;
        window.removeEventListener('click', executeTrigger);
        window.removeEventListener('touchstart', executeTrigger);
        window.removeEventListener('keydown', executeTrigger);
        window.removeEventListener('scroll', executeTrigger);

        setTimeout(() => {
            triggerJarvisBillingReminder(diffDays);
        }, 800);
    };

    window.addEventListener('click', executeTrigger, { once: true, passive: true });
    window.addEventListener('touchstart', executeTrigger, { once: true, passive: true });
    window.addEventListener('keydown', executeTrigger, { once: true, passive: true });
    window.addEventListener('scroll', executeTrigger, { once: true, passive: true });
}

// --- 6. BOTÃO PILL NO HEADER DE TODAS AS PÁGINAS (OCULTADO A PEDIDO DO USUÁRIO) ---
function injectHeaderPill() {
    // Ocultado: remove do DOM se existir e não injeta novo elemento
    const existing = document.getElementById('btn-jarvis-wake-pill');
    if (existing) existing.remove();
}

function updatePillUI(isActive) {
    const pill = document.getElementById('btn-jarvis-wake-pill');
    if (pill) pill.style.display = 'none';
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

    // Checa lembrete proativo de cobrança (3 dias antes, 1 vez ao dia)
    checkAndScheduleBillingReminder();
    window.addEventListener('tenantDateLoaded', () => {
        checkAndScheduleBillingReminder();
    });
}

window.setJarvisScreenGlow = setJarvisScreenGlow;
window.startWakeWordListening = startWakeWordListening;
window.stopWakeWordListening = stopWakeWordListening;
window.getAssistantName = getAssistantName;
window.setAssistantName = setAssistantName;
window.testJarvisBillingReminder = function(days = 3) {
    const storageKey = `jarvis_billing_reminder_${resolvedUser?.id || 'default'}`;
    localStorage.removeItem(storageKey);
    billingReminderTriggered = false;
    triggerJarvisBillingReminder(Number(days));
};
window.checkJarvisBillingReminder = checkAndScheduleBillingReminder;
window.getDaysUntilDue = getDaysUntilDue;
window.isQuestionOutOfScope = isQuestionOutOfScope;
window.getRandomOutOfScopeReply = getRandomOutOfScopeReply;
window.testOutOfScopeGuardrail = function(question = "qual é a raiz quadrada de 22") {
    const isOut = isQuestionOutOfScope(question);
    const clientName = getClientGreetingName();
    const reply = getRandomOutOfScopeReply(clientName);
    console.log(`[Guardrail Test] Pergunta: "${question}" | Fora de escopo: ${isOut}`);
    console.log(`[Guardrail Test] Resposta gerada: "${reply}"`);
    return { isOutOfScope: isOut, reply };
};

// Auto-inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initJarvisWakeWord);
} else {
    initJarvisWakeWord();
}
