const fs = require('fs');

function fixHtml(file) {
    let html = fs.readFileSync(file, 'utf8');

    // 1. Replace Input with Textarea
    const oldInputRegex = /<input type=\"text\" id=\"real-chat-input\" placeholder=\"Digite uma mensagem\.\.\.\" style=\"border: none; background: transparent; width: 100%; outline: none; font-size: 14px; color: var\(--color-text-main\);\">/g;
    const newTextarea = '<textarea id="real-chat-input" placeholder="Digite uma mensagem..." rows="1" style="border: none; background: transparent; width: 100%; outline: none; font-size: 14px; color: var(--color-text-main); resize: none; overflow: hidden; min-height: 20px; max-height: 100px; padding: 0; line-height: 20px; font-family: inherit;"></textarea>';
    html = html.replace(oldInputRegex, newTextarea);

    // Also replace in teste-agente if it's there
    const oldInputRegexTeste = /<input type=\"text\" placeholder=\"Digite sua mensagem\.\.\.\"[\s\n]*style=\"border: none; background: transparent; width: 100%; outline: none;[\s\n]*font-size: 13px; color: var\(--color-text-main\);\">/g;
    const newTextareaTeste = '<textarea placeholder="Digite sua mensagem..." rows="1" style="border: none; background: transparent; width: 100%; outline: none; font-size: 13px; color: var(--color-text-main); resize: none; overflow: hidden; min-height: 20px; max-height: 100px; padding: 0; line-height: 20px; font-family: inherit;" oninput="this.style.height=\'auto\'; this.style.height=(this.scrollHeight)+\'px\'"></textarea>';
    html = html.replace(oldInputRegexTeste, newTextareaTeste);

    if (file === 'conversas.html') {
        // Add auto-resize script
        if (!html.includes('function autoResizeTextarea')) {
            html = html.replace('</script>', `
    function autoResizeTextarea(el) {
        el.style.height = 'auto';
        el.style.height = (el.scrollHeight) + 'px';
    }
    const realInput = document.getElementById('real-chat-input');
    if(realInput) {
        realInput.addEventListener('input', function() {
            autoResizeTextarea(this);
        });
    }
</script>`);
        }

        // 2. CSS for Popup
        const popupCss = `
    .vk-popup {
        position: absolute;
        top: -45px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #FFFFFF;
        color: #000;
        font-size: 28px;
        padding: 8px 12px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        pointer-events: none;
        z-index: 100000;
        display: none;
        font-family: inherit;
    }
    .vk-key {
        position: relative; /* To anchor the popup */
    }
`;
        if(!html.includes('.vk-popup {')) {
            html = html.replace('.vk-key {', popupCss + '\n    .vk-key {');
        }

        // 3. Virtual Keyboard Auto-Capitalize & Popup Logic
        if(!html.includes('popupDiv.className = \'vk-popup\';')) {
            html = html.replace(/document\.querySelectorAll\('\.vk-key'\)\.forEach\(btn => \{/, `
        const popupDiv = document.createElement('div');
        popupDiv.className = 'vk-popup';
        document.body.appendChild(popupDiv);

        document.querySelectorAll('.vk-key').forEach(btn => {`);
        }

        html = html.replace(/btn\.addEventListener\('pointerdown', \(e\) => \{([\s\S]*?)btn\.classList\.add\('active'\);/, `btn.addEventListener('pointerdown', (e) => {
            if(!btn.classList.contains('vk-special') && !btn.classList.contains('vk-space')) {
                const rect = btn.getBoundingClientRect();
                popupDiv.textContent = btn.textContent;
                popupDiv.style.left = (rect.left + rect.width / 2) + 'px';
                popupDiv.style.top = (rect.top - 50) + 'px';
                popupDiv.style.display = 'block';
            }
            btn.classList.add('active');`);

        html = html.replace(/btn\.addEventListener\('pointerup', \(e\) => \{([\s\S]*?)btn\.classList\.remove\('active'\);/, `btn.addEventListener('pointerup', (e) => {
            popupDiv.style.display = 'none';
            btn.classList.remove('active');`);
            
        html = html.replace(/btn\.addEventListener\('pointerleave', \(e\) => \{([\s\S]*?)btn\.classList\.remove\('active'\);/, `btn.addEventListener('pointerleave', (e) => {
            popupDiv.style.display = 'none';
            btn.classList.remove('active');`);

        // Auto shift on open
        if (!html.includes('if (input.value.length === 0) { isShift = true;')) {
            html = html.replace(/keyboard\.classList\.add\('vk-open'\);/g, `keyboard.classList.add('vk-open');
            if (input.value.length === 0) {
                isShift = true;
                updateKeyboardVisuals();
            }`);
        }

        // Auto unshift on insert
        if (!html.includes('if (isShift && !isCaps) { isShift = false;')) {
            html = html.replace(/input\.value \+= char;/g, `input.value += char;
            if (isShift && !isCaps) {
                isShift = false;
                updateKeyboardVisuals();
            }
            // Trigger auto resize after insertion
            const evt = new Event('input', { bubbles: true });
            input.dispatchEvent(evt);`);
        }
    }

    fs.writeFileSync(file, html);
    console.log(file + ' updated successfully!');
}

fixHtml('conversas.html');
fixHtml('teste-agente.html');
