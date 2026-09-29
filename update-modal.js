const fs = require('fs');

let html = fs.readFileSync('teste-agente.html', 'utf8');

// Update the Detalhar buttons to look more like buttons (better padding, radius, hover effect if not handled by CSS)
html = html.replace(/<button class="btn btn--primary btn-report-issue"([^>]*)>Detalhar<\/button>/g, '<button class="btn btn--primary btn-report-issue" style="padding: 8px 16px; font-size: 13px; font-weight: 600; flex-shrink: 0; border-radius: 8px; border: none; cursor: pointer; transition: opacity 0.2s; display: flex; align-items: center; gap: 6px;">Detalhar <i class="ph ph-caret-right" style="font-size: 14px;"></i></button>');

// Update the Modal HTML to include an icon container next to the title
html = html.replace(
    /<h2 id="modal-report-title"(.*?)>Detalhar Problema<\/h2>/,
    `<div style="display: flex; align-items: center; gap: 12px;">
        <div id="modal-report-icon-box" style="width: 40px; height: 40px; border-radius: 50%; background-color: #FEE2E2; color: #EF4444; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; display: none;">
            <i id="modal-report-icon" class="ph ph-warning"></i>
        </div>
        <h2 id="modal-report-title"$1>Detalhar Problema</h2>
    </div>`
);

// Update JS inside teste-agente.html to copy the icon over
html = html.replace(
    'const modalTitle = document.getElementById(\'modal-report-title\');',
    `const modalTitle = document.getElementById('modal-report-title');
            const modalIconBox = document.getElementById('modal-report-icon-box');
            const modalIcon = document.getElementById('modal-report-icon');`
);

html = html.replace(
    /function openModal\(title\)\s*{\s*modalTitle\.textContent = title;/g,
    `function openModal(title, iconElement, bgColor, color) {
                modalTitle.textContent = title;
                if (iconElement) {
                    modalIconBox.style.display = 'flex';
                    modalIconBox.style.backgroundColor = bgColor;
                    modalIconBox.style.color = color;
                    modalIcon.className = iconElement.className;
                } else {
                    modalIconBox.style.display = 'none';
                }`
);

// Update the click listener to pass icon data
html = html.replace(
    /btn\.addEventListener\('click', \(e\) => {[\s\S]*?if \(span\) {[\s\S]*?openModal\(span\.textContent\.trim\(\)\);[\s\S]*?} else {[\s\S]*?openModal\("Reportar Problema"\);[\s\S]*?}\s*}\);/g,
    `btn.addEventListener('click', (e) => {
                    const container = btn.closest('div[style*="display: flex; align-items: center; justify-content: space-between"]');
                    const span = container.querySelector('span');
                    const iconBox = container.querySelector('div[style*="border-radius: 50%"]');
                    let iconEl = null, bgColor = '', color = '';
                    if (iconBox) {
                        iconEl = iconBox.querySelector('i');
                        bgColor = iconBox.style.backgroundColor;
                        color = iconBox.style.color;
                    }
                    if (span) {
                        openModal(span.textContent.trim(), iconEl, bgColor, color);
                    } else {
                        openModal("Reportar Problema", null, '', '');
                    }
                });`
);

fs.writeFileSync('teste-agente.html', html);
console.log('done');
