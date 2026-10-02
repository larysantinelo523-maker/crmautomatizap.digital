const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

// 1. Replace the dual buttons
const btnRegex = /<button class="btn-intervencao[\s\S]*?<\/button>\s*<button class="btn-ativacao[\s\S]*?<\/button>/;
const newBtn = `<button class="btn-toggle-agente desktop-only" id="btn-toggle-agente" style="font-size: 13px; padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 500;">
                                    <i class="ph ph-user" id="icon-toggle-agente"></i> <span id="text-toggle-agente" class="desktop-only">Pausar Agente</span>
                                </button>`;
if (btnRegex.test(html)) {
    html = html.replace(btnRegex, newBtn);
    console.log("Replaced buttons");
} else {
    console.log("Buttons not found");
}

// 2. Adjust banner width
const bannerRegex = /<div style="background: #fef08a; padding: 8px 16px; font-size: 13px; font-weight: 500; color: #854d0e; text-align: center; border-radius: 8px; border: 1px solid #fde047; box-shadow: 0 2px 4px rgba\(0,0,0,0.05\);">/;
const newBanner = `<div style="background: #fef08a; padding: 8px 16px; font-size: 13px; font-weight: 500; color: #854d0e; text-align: center; border-radius: 8px; border: 1px solid #fde047; box-shadow: 0 2px 4px rgba(0,0,0,0.05); max-width: 400px; margin: 0 auto;">`;
if (bannerRegex.test(html)) {
    html = html.replace(bannerRegex, newBanner);
    console.log("Adjusted banner width");
} else {
    console.log("Banner div not found");
}

// 3. Update JS Logic (Toggle Logic)
const jsListenersRegex = /if\(btnIntervencao\) \{[\s\S]*?\}\s*if\(btnAtivacao\) \{[\s\S]*?\}/;
const jsListenersNew = `const btnToggleAgente = document.getElementById('btn-toggle-agente');
            if(btnToggleAgente) {
                const novoBtn = btnToggleAgente.cloneNode(true);
                btnToggleAgente.parentNode.replaceChild(novoBtn, btnToggleAgente);
                novoBtn.addEventListener('click', async function() {
                    const isAtivo = this.getAttribute('data-active') === 'true';
                    toggleBotLogic(!isAtivo);
                });
            }`;
if (jsListenersRegex.test(html)) {
    html = html.replace(jsListenersRegex, jsListenersNew);
    console.log("Replaced JS Listeners");
} else {
    console.log("JS Listeners not found");
}

// 4. Update JS Display Logic
const jsUpdateRegex = /const btnIntervencaoDesktop = document.getElementById\('btn-intervencao'\);[\s\S]*?if\(pausedBanner\) pausedBanner\.style\.display = 'flex';\s*\}/;
const jsUpdateNew = `const btnToggleAgenteDesktop = document.getElementById('btn-toggle-agente');
            const pausedBanner = document.getElementById('agente-pausado-banner');
            
            if (btnToggleAgenteDesktop) {
                btnToggleAgenteDesktop.setAttribute('data-active', isBotActive);
                const icon = btnToggleAgenteDesktop.querySelector('i');
                const text = document.getElementById('text-toggle-agente');
                if (isBotActive) {
                    btnToggleAgenteDesktop.style.backgroundColor = '#fee2e2'; // Light Red for Danger
                    btnToggleAgenteDesktop.style.color = '#dc2626';
                    icon.className = 'ph ph-user';
                    text.innerText = 'Pausar Agente';
                    if(pausedBanner) pausedBanner.style.display = 'none';
                } else {
                    btnToggleAgenteDesktop.style.backgroundColor = '#dcfce7'; // Light Green for Success
                    btnToggleAgenteDesktop.style.color = '#16a34a';
                    icon.className = 'ph ph-robot';
                    text.innerText = 'Ativar Agente';
                    if(pausedBanner) pausedBanner.style.display = 'flex';
                }
            }`;
if (jsUpdateRegex.test(html)) {
    html = html.replace(jsUpdateRegex, jsUpdateNew);
    console.log("Replaced JS Update Logic");
} else {
    console.log("JS Update Logic not found");
}

fs.writeFileSync('conversas.html', html);
