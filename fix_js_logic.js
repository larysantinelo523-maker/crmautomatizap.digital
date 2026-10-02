const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

const regex = /const btnIntervencao = document.getElementById\('btn-intervencao'\);[\s\S]*?if\(textAtivacao\) textAtivacao\.innerText = 'Ativar Agente';\s*\}\s*\}/;
const replacement = `const btnToggleAgenteDesktop = document.getElementById('btn-toggle-agente');
            const pausedBanner = document.getElementById('agente-pausado-banner');
            
            if (btnToggleAgenteDesktop) {
                btnToggleAgenteDesktop.setAttribute('data-active', isBotActive);
                const icon = btnToggleAgenteDesktop.querySelector('i');
                const text = document.getElementById('text-toggle-agente');
                if (isBotActive) {
                    btnToggleAgenteDesktop.style.backgroundColor = 'var(--color-danger)';
                    btnToggleAgenteDesktop.style.color = 'white';
                    icon.className = 'ph ph-user';
                    text.innerText = 'Pausar Agente';
                    if(pausedBanner) pausedBanner.style.display = 'none';
                } else {
                    btnToggleAgenteDesktop.style.backgroundColor = 'var(--color-success)';
                    btnToggleAgenteDesktop.style.color = 'white';
                    icon.className = 'ph ph-robot';
                    text.innerText = 'Ativar Agente';
                    if(pausedBanner) pausedBanner.style.display = 'flex';
                }
            }`;

if (regex.test(html)) {
    html = html.replace(regex, replacement);
    console.log("Replaced JS Update Logic");
} else {
    console.log("JS Update Logic not found");
}

fs.writeFileSync('conversas.html', html);
