const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

const injection = `
<!-- VIRTUAL KEYBOARD INJECTION -->
<div id="virtual-keyboard-container" class="virtual-keyboard-hidden">
    <div class="vk-row">
        <button class="vk-key" data-key="1">1</button>
        <button class="vk-key" data-key="2">2</button>
        <button class="vk-key" data-key="3">3</button>
        <button class="vk-key" data-key="4">4</button>
        <button class="vk-key" data-key="5">5</button>
        <button class="vk-key" data-key="6">6</button>
        <button class="vk-key" data-key="7">7</button>
        <button class="vk-key" data-key="8">8</button>
        <button class="vk-key" data-key="9">9</button>
        <button class="vk-key" data-key="0">0</button>
    </div>
    <div class="vk-row" style="padding: 0 2px;">
        <button class="vk-key" data-key="q">q</button>
        <button class="vk-key" data-key="w">w</button>
        <button class="vk-key" data-key="e">e</button>
        <button class="vk-key" data-key="r">r</button>
        <button class="vk-key" data-key="t">t</button>
        <button class="vk-key" data-key="y">y</button>
        <button class="vk-key" data-key="u">u</button>
        <button class="vk-key" data-key="i">i</button>
        <button class="vk-key" data-key="o">o</button>
        <button class="vk-key" data-key="p">p</button>
    </div>
    <div class="vk-row" style="padding: 0 16px;">
        <button class="vk-key" data-key="a">a</button>
        <button class="vk-key" data-key="s">s</button>
        <button class="vk-key" data-key="d">d</button>
        <button class="vk-key" data-key="f">f</button>
        <button class="vk-key" data-key="g">g</button>
        <button class="vk-key" data-key="h">h</button>
        <button class="vk-key" data-key="j">j</button>
        <button class="vk-key" data-key="k">k</button>
        <button class="vk-key" data-key="l">l</button>
    </div>
    <div class="vk-row">
        <button class="vk-key vk-special vk-shift" data-action="shift"><i class="ph ph-arrow-up"></i></button>
        <button class="vk-key" data-key="z">z</button>
        <button class="vk-key" data-key="x">x</button>
        <button class="vk-key" data-key="c">c</button>
        <button class="vk-key" data-key="v">v</button>
        <button class="vk-key" data-key="b">b</button>
        <button class="vk-key" data-key="n">n</button>
        <button class="vk-key" data-key="m">m</button>
        <button class="vk-key vk-special" data-action="backspace"><i class="ph ph-backspace"></i></button>
    </div>
    <div class="vk-row">
        <button class="vk-key vk-special vk-mode" data-action="mode">!#1</button>
        <button class="vk-key" data-key=",">,</button>
        <button class="vk-key vk-space" data-action="space">Português (BR)</button>
        <button class="vk-key" data-key=".">.</button>
        <button class="vk-key vk-special vk-enter" data-action="enter">Ir</button>
    </div>
</div>

<style>
    /* Keyboard Styles */
    #virtual-keyboard-container {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        background-color: #D1D5DB;
        padding: 8px 4px 20px 4px; /* padding-bottom extra para iPhone/Android edge */
        display: flex;
        flex-direction: column;
        gap: 6px;
        z-index: 99999;
        transform: translateY(100%);
        transition: transform 0.25s ease-out;
        user-select: none;
        -webkit-user-select: none;
    }

    #virtual-keyboard-container.vk-open {
        transform: translateY(0);
    }

    .vk-row {
        display: flex;
        justify-content: center;
        gap: 6px;
        width: 100%;
        touch-action: none; /* impede zoom/scroll na linha */
    }

    .vk-key {
        background-color: #FFFFFF;
        border: none;
        border-radius: 6px;
        color: #000;
        font-size: 20px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 44px;
        flex: 1;
        box-shadow: 0 1px 1px rgba(0,0,0,0.3);
        cursor: pointer;
        padding: 0;
        margin: 0;
        outline: none;
        touch-action: none;
        -webkit-tap-highlight-color: transparent;
        text-transform: none; /* Controlado via JS para Shift */
    }

    .vk-key:active {
        background-color: #E5E7EB;
    }

    .vk-special {
        background-color: #BFC3C8;
    }

    .vk-special:active {
        background-color: #FFFFFF;
    }

    .vk-shift {
        flex: 1.2;
    }

    .vk-shift.active {
        background-color: #FFFFFF;
        color: #000;
    }
    
    .vk-shift.caps {
        background-color: #FFFFFF;
        color: var(--color-primary, #0F5B46);
    }

    .vk-mode {
        flex: 1.2;
        font-size: 16px;
    }

    .vk-space {
        flex: 4;
        font-size: 14px;
        color: #6B7280;
    }

    .vk-enter {
        flex: 1.2;
        font-size: 16px;
        font-weight: 500;
    }
    
    body.virtual-keyboard-active .sidebar-footer {
        display: none !important;
    }
    
    body.virtual-keyboard-active {
        padding-bottom: 260px !important; /* Aproximadamente a altura do teclado */
    }

    /* Para o layout de símbolos */
    .vk-mode-symbols .vk-key[data-key] {
        /* JS vai trocar o textContent, mas essa classe pode ajudar */
    }
</style>

<script>
    document.addEventListener('DOMContentLoaded', () => {
        if (window.innerWidth > 768) return; // Só ativa no mobile

        const USE_VIRTUAL_KEYBOARD = true; // Chave de ativação geral
        if (!USE_VIRTUAL_KEYBOARD) return;

        const input = document.getElementById('real-chat-input');
        const sendBtn = document.getElementById('btn-send-message');
        const keyboard = document.getElementById('virtual-keyboard-container');
        const keys = keyboard.querySelectorAll('.vk-key');
        
        if (!input || !keyboard) return;

        // Impede o teclado nativo de abrir
        input.setAttribute('inputmode', 'none');

        let isShift = false;
        let isCaps = false;
        let isSymbols = false;
        let shiftTimeout = null;
        let shiftClicks = 0;
        let backspaceInterval = null;
        let backspaceTimeout = null;

        // Mapeamento Letras <-> Símbolos (Linhas 1, 2, 3)
        const row1Letters = ['1','2','3','4','5','6','7','8','9','0'];
        const row1Symbols = ['[',']','{','}','#','%','^','*','+','='];
        const row2Letters = ['q','w','e','r','t','y','u','i','o','p'];
        const row2Symbols = ['_','\\\\','|','~','<','>','€','£','¥','¢'];
        const row3Letters = ['a','s','d','f','g','h','j','k','l'];
        const row3Symbols = ['-','/',':',';','(',')','$','&','@'];
        const row4Letters = ['z','x','c','v','b','n','m'];
        const row4Symbols = ['"',"'",',','.','?','!','\`'];

        // Atualiza a visualização do teclado (Maiúsculas e Símbolos)
        const updateKeyboardVisuals = () => {
            const letterKeys = Array.from(keys).filter(k => k.hasAttribute('data-key'));
            const shiftBtn = keyboard.querySelector('.vk-shift');
            const modeBtn = keyboard.querySelector('.vk-mode');

            if (isSymbols) {
                modeBtn.textContent = 'ABC';
                // Linha 1
                for(let i=0; i<10; i++) { letterKeys[i].textContent = row1Symbols[i]; letterKeys[i].dataset.val = row1Symbols[i]; }
                // Linha 2
                for(let i=0; i<10; i++) { letterKeys[i+10].textContent = row2Symbols[i]; letterKeys[i+10].dataset.val = row2Symbols[i]; }
                // Linha 3
                for(let i=0; i<9; i++) { letterKeys[i+20].textContent = row3Symbols[i]; letterKeys[i+20].dataset.val = row3Symbols[i]; }
                // Linha 4
                for(let i=0; i<7; i++) { letterKeys[i+29].textContent = row4Symbols[i]; letterKeys[i+29].dataset.val = row4Symbols[i]; }
            } else {
                modeBtn.textContent = '!#1';
                letterKeys.forEach(k => {
                    let char = k.getAttribute('data-key');
                    if (isShift || isCaps) char = char.toUpperCase();
                    k.textContent = char;
                    k.dataset.val = char;
                });
            }

            // Atualiza visual do Shift
            shiftBtn.classList.remove('active', 'caps');
            shiftBtn.innerHTML = '<i class="ph ph-arrow-up"></i>';
            if (isCaps) {
                shiftBtn.classList.add('caps');
                shiftBtn.innerHTML = '<i class="ph-fill ph-arrow-up"></i>';
            } else if (isShift) {
                shiftBtn.classList.add('active');
            }
        };

        updateKeyboardVisuals(); // setup inicial

        // Abrir Teclado
        input.addEventListener('focus', () => {
            keyboard.classList.add('vk-open');
            document.body.classList.add('virtual-keyboard-active');
            setTimeout(() => {
                const container = document.getElementById('chat-messages-container');
                if (container) container.scrollTop = container.scrollHeight;
            }, 100);
        });

        // Fechar teclado clicando fora
        document.addEventListener('pointerdown', (e) => {
            if (!keyboard.contains(e.target) && e.target !== input && !e.target.closest('#btn-send-message') && !e.target.closest('.bot-toggle-container')) {
                keyboard.classList.remove('vk-open');
                document.body.classList.remove('virtual-keyboard-active');
                input.blur(); // Tira foco do input para não reabrir sem querer
            }
        });

        // Função de Inserir Texto no Cursor
        const insertText = (text) => {
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const val = input.value;
            input.value = val.substring(0, start) + text + val.substring(end);
            input.selectionStart = input.selectionEnd = start + text.length;
            // Disparar evento de input para que o restante do app perceba a digitação (se houver hooks)
            input.dispatchEvent(new Event('input', { bubbles: true }));
        };

        const deleteText = () => {
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const val = input.value;
            if (start === end && start > 0) {
                input.value = val.substring(0, start - 1) + val.substring(end);
                input.selectionStart = input.selectionEnd = start - 1;
            } else if (start !== end) {
                input.value = val.substring(0, start) + val.substring(end);
                input.selectionStart = input.selectionEnd = start;
            }
            input.dispatchEvent(new Event('input', { bubbles: true }));
        };

        const vibrate = () => {
            if (navigator.vibrate) navigator.vibrate(15);
        };

        // Escutando as teclas
        keys.forEach(key => {
            key.addEventListener('pointerdown', (e) => {
                e.preventDefault(); // MANTÉM FOCO NO INPUT
                input.focus(); // Garante foco
                vibrate();

                const action = key.getAttribute('data-action');
                
                if (key.hasAttribute('data-key')) {
                    const char = key.dataset.val || key.textContent;
                    insertText(char);
                    if (isShift && !isCaps) {
                        isShift = false;
                        updateKeyboardVisuals();
                    }
                } 
                else if (action === 'space') {
                    insertText(' ');
                }
                else if (action === 'enter') {
                    sendBtn.click();
                    isShift = false;
                    updateKeyboardVisuals();
                }
                else if (action === 'shift') {
                    shiftClicks++;
                    if (shiftClicks === 1) {
                        shiftTimeout = setTimeout(() => {
                            if (shiftClicks === 1) {
                                // Single tap
                                if (isCaps) { isCaps = false; isShift = false; }
                                else { isShift = !isShift; }
                                updateKeyboardVisuals();
                            }
                            shiftClicks = 0;
                        }, 250);
                    } else if (shiftClicks === 2) {
                        clearTimeout(shiftTimeout);
                        shiftClicks = 0;
                        isCaps = true;
                        isShift = false;
                        updateKeyboardVisuals();
                    }
                }
                else if (action === 'mode') {
                    isSymbols = !isSymbols;
                    isShift = false;
                    isCaps = false;
                    updateKeyboardVisuals();
                }
                else if (action === 'backspace') {
                    deleteText();
                    backspaceTimeout = setTimeout(() => {
                        backspaceInterval = setInterval(() => {
                            deleteText();
                            vibrate();
                        }, 60);
                    }, 400);
                }
            });

            // Parar o backspace quando soltar a tecla
            const stopBackspace = () => {
                clearTimeout(backspaceTimeout);
                clearInterval(backspaceInterval);
            };
            key.addEventListener('pointerup', stopBackspace);
            key.addEventListener('pointerleave', stopBackspace);
            key.addEventListener('pointercancel', stopBackspace);
        });
    });
</script>
<!-- END VIRTUAL KEYBOARD INJECTION -->
`;

// Insert the HTML just before </body>
const insertionIndex = html.lastIndexOf('</body>');
if (insertionIndex !== -1) {
    const startStr = html.substring(0, insertionIndex);
    const endStr = html.substring(insertionIndex);
    fs.writeFileSync('conversas.html', startStr + injection + endStr);
    console.log("Injected");
} else {
    console.log("Could not find </body>");
}
