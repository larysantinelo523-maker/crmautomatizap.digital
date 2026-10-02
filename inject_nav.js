const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

// 1. Remove old keyboard injection
const oldStart = html.indexOf('<!-- VIRTUAL KEYBOARD INJECTION -->');
if (oldStart !== -1) {
    const endTag = '<!-- END VIRTUAL KEYBOARD INJECTION -->\n';
    const oldEnd = html.indexOf(endTag) + endTag.length;
    html = html.substring(0, oldStart) + html.substring(oldEnd);
}

// 2. Add 'mobile-chat-active' logic to div.onclick
html = html.replace(
    /div\.onclick = \(\) => \{[\s\S]*?carregarMensagens\(lead\);/m,
    `div.onclick = () => {
                    document.querySelectorAll('.chat-contact-item').forEach(el => el.style.background = 'transparent');
                    div.style.background = 'var(--color-bg-main)';
                    carregarMensagens(lead);
                    
                    if (window.innerWidth <= 768) {
                        document.body.classList.add('mobile-chat-active');
                    }`
);

// 3. Add Back button to Chat Header
if (!html.includes('id="btn-voltar-chat"')) {
    html = html.replace(
        /<div id="chat-header-avatar"/,
        `<button id="btn-voltar-chat" class="mobile-only" onclick="document.body.classList.remove('mobile-chat-active')" style="display: none; background: none; border: none; color: var(--color-primary); font-size: 20px; padding: 0 12px 0 0; cursor: pointer; align-items: center; justify-content: center;"><i class="ph ph-arrow-left"></i></button>\n                                <div id="chat-header-avatar"`
    );
}

// 4. Inject new Virtual Keyboard HTML and CSS at the end of body
const newInjection = `
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
    @media (max-width: 768px) {
        /* NAVEGAÇÃO MOBILE: LISTA vs CHAT */
        .chat-left-sidebar { display: flex !important; }
        .chat-right-wrapper { display: none !important; }
        
        body.mobile-chat-active .mobile-page-header { display: none !important; }
        body.mobile-chat-active .chat-left-sidebar { display: none !important; }
        body.mobile-chat-active .chat-right-wrapper { display: flex !important; width: 100%; height: 100%; }
        body.mobile-chat-active #btn-voltar-chat { display: flex !important; }

        .chat-card {
            position: relative; /* Para ancorar o teclado absoluto dentro dela */
        }
    }

    /* Keyboard Styles */
    #virtual-keyboard-container {
        position: absolute;
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
        visibility: hidden; /* Evita focar enquanto invisível */
    }

    #virtual-keyboard-container.vk-open {
        transform: translateY(0);
        visibility: visible;
    }

    .vk-row {
        display: flex;
        justify-content: center;
        gap: 6px;
        width: 100%;
        touch-action: none;
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
        text-transform: none;
    }

    .vk-key:active { background-color: #E5E7EB; }
    .vk-special { background-color: #BFC3C8; }
    .vk-special:active { background-color: #FFFFFF; }
    .vk-shift { flex: 1.2; }
    .vk-shift.active { background-color: #FFFFFF; color: #000; }
    .vk-shift.caps { background-color: #FFFFFF; color: var(--color-primary, #0F5B46); }
    .vk-mode { flex: 1.2; font-size: 16px; }
    .vk-space { flex: 4; font-size: 14px; color: #6B7280; }
    .vk-enter { flex: 1.2; font-size: 16px; font-weight: 500; }
    
    body.virtual-keyboard-active .sidebar-footer { display: none !important; }
    body.virtual-keyboard-active #chat-messages-container {
        padding-bottom: 260px !important; /* Libera espaço pras mensagens deslizarem acima do teclado */
    }
</style>

<script>
    document.addEventListener('DOMContentLoaded', () => {
        if (window.innerWidth > 768) return; 

        const input = document.getElementById('real-chat-input');
        const sendBtn = document.getElementById('btn-send-message');
        const keyboard = document.getElementById('virtual-keyboard-container');
        const chatCard = document.querySelector('.chat-card');
        
        if (!input || !keyboard || !chatCard) return;

        // Move o teclado para DENTRO do chat-card
        chatCard.appendChild(keyboard);

        const keys = keyboard.querySelectorAll('.vk-key');

        input.setAttribute('inputmode', 'none');

        let isShift = false;
        let isCaps = false;
        let isSymbols = false;
        let shiftTimeout = null;
        let shiftClicks = 0;
        let backspaceInterval = null;
        let backspaceTimeout = null;

        const row1Symbols = ['[',']','{','}','#','%','^','*','+','='];
        const row2Symbols = ['_','\\\\\\\\','|','~','<','>','€','£','¥','¢'];
        const row3Symbols = ['-','/',':',';','(',')','$','&','@'];
        const row4Symbols = ['"',"'",',','.','?','!','\`'];

        const updateKeyboardVisuals = () => {
            const letterKeys = Array.from(keys).filter(k => k.hasAttribute('data-key'));
            const shiftBtn = keyboard.querySelector('.vk-shift');
            const modeBtn = keyboard.querySelector('.vk-mode');

            if (isSymbols) {
                modeBtn.textContent = 'ABC';
                for(let i=0; i<10; i++) { letterKeys[i].textContent = row1Symbols[i]; letterKeys[i].dataset.val = row1Symbols[i]; }
                for(let i=0; i<10; i++) { letterKeys[i+10].textContent = row2Symbols[i]; letterKeys[i+10].dataset.val = row2Symbols[i]; }
                for(let i=0; i<9; i++) { letterKeys[i+20].textContent = row3Symbols[i]; letterKeys[i+20].dataset.val = row3Symbols[i]; }
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

            shiftBtn.classList.remove('active', 'caps');
            shiftBtn.innerHTML = '<i class="ph ph-arrow-up"></i>';
            if (isCaps) {
                shiftBtn.classList.add('caps');
                shiftBtn.innerHTML = '<i class="ph-fill ph-arrow-up"></i>';
            } else if (isShift) {
                shiftBtn.classList.add('active');
            }
        };

        updateKeyboardVisuals();

        input.addEventListener('focus', () => {
            keyboard.classList.add('vk-open');
            document.body.classList.add('virtual-keyboard-active');
            setTimeout(() => {
                const container = document.getElementById('chat-messages-container');
                if (container) container.scrollTop = container.scrollHeight;
            }, 100);
        });

        document.addEventListener('pointerdown', (e) => {
            if (!keyboard.contains(e.target) && e.target !== input && !e.target.closest('#btn-send-message') && !e.target.closest('.bot-toggle-container')) {
                keyboard.classList.remove('vk-open');
                document.body.classList.remove('virtual-keyboard-active');
                input.blur();
            }
        });

        const insertText = (text) => {
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const val = input.value;
            input.value = val.substring(0, start) + text + val.substring(end);
            input.selectionStart = input.selectionEnd = start + text.length;
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

        const vibrate = () => { if (navigator.vibrate) navigator.vibrate(15); };

        keys.forEach(key => {
            key.addEventListener('pointerdown', (e) => {
                e.preventDefault(); 
                input.focus(); 
                vibrate();

                const action = key.getAttribute('data-action');
                
                if (key.hasAttribute('data-key')) {
                    const char = key.dataset.val || key.textContent;
                    insertText(char);
                    if (isShift && !isCaps) { isShift = false; updateKeyboardVisuals(); }
                } 
                else if (action === 'space') insertText(' ');
                else if (action === 'enter') { sendBtn.click(); isShift = false; updateKeyboardVisuals(); }
                else if (action === 'shift') {
                    shiftClicks++;
                    if (shiftClicks === 1) {
                        shiftTimeout = setTimeout(() => {
                            if (shiftClicks === 1) {
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
                        backspaceInterval = setInterval(() => { deleteText(); vibrate(); }, 60);
                    }, 400);
                }
            });

            const stopBackspace = () => { clearTimeout(backspaceTimeout); clearInterval(backspaceInterval); };
            key.addEventListener('pointerup', stopBackspace);
            key.addEventListener('pointerleave', stopBackspace);
            key.addEventListener('pointercancel', stopBackspace);
        });
    });
</script>
<!-- END VIRTUAL KEYBOARD INJECTION -->
`;

const insertionIndex = html.lastIndexOf('</body>');
if (insertionIndex !== -1) {
    const startStr = html.substring(0, insertionIndex);
    const endStr = html.substring(insertionIndex);
    fs.writeFileSync('conversas.html', startStr + newInjection + endStr);
    console.log("Injected");
} else {
    console.log("Could not find </body>");
}
