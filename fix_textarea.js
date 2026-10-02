const fs = require('fs');

// Fix conversas.html
let html = fs.readFileSync('conversas.html', 'utf8');

// Fix script tag
html = html.replace(/<script src="https:\/\/unpkg\.com\/@phosphor-icons\/web">[\s\S]*?<\/script>/, `<script src="https://unpkg.com/@phosphor-icons/web"></script>
    <script>
    function autoResizeTextarea(el) {
        el.style.height = 'auto';
        el.style.height = (el.scrollHeight) + 'px';
    }
    document.addEventListener('DOMContentLoaded', () => {
        const realInput = document.getElementById('real-chat-input');
        if(realInput) {
            realInput.addEventListener('input', function() {
                autoResizeTextarea(this);
            });
        }
    });
    </script>`);

// Fix textarea style in conversas
html = html.replace(/<textarea id="real-chat-input" placeholder="Digite uma mensagem\.\.\." rows="1" style="[^"]*"/, '<textarea id="real-chat-input" placeholder="Digite uma mensagem..." rows="1" style="border: none; background: transparent; width: 100%; outline: none; font-size: 14px; color: var(--color-text-main); resize: none; overflow: hidden; min-height: 24px; max-height: 100px; padding: 2px 0; line-height: 1.4; font-family: inherit; word-break: break-word; white-space: pre-wrap; display: block; box-sizing: border-box;"');

fs.writeFileSync('conversas.html', html);

// Fix teste-agente.html
let html2 = fs.readFileSync('teste-agente.html', 'utf8');

// Fix textarea style in teste-agente
html2 = html2.replace(/<textarea placeholder="Digite sua mensagem\.\.\." rows="1" style="[^"]*"/, '<textarea placeholder="Digite sua mensagem..." rows="1" style="border: none; background: transparent; width: 100%; outline: none; font-size: 13px; color: var(--color-text-main); resize: none; overflow: hidden; min-height: 24px; max-height: 100px; padding: 2px 0; line-height: 1.4; font-family: inherit; word-break: break-word; white-space: pre-wrap; display: block; box-sizing: border-box;"');

fs.writeFileSync('teste-agente.html', html2);

console.log('Fixed scripts and styles!');
