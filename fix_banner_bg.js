const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

const regex = /<!-- Aviso Agente Pausado Banner -->\s*<div id="agente-pausado-banner"[\s\S]*?<\/div>/;
const replacement = `<!-- Aviso Agente Pausado Banner -->
                        <div id="agente-pausado-banner" style="display: none; background-color: var(--color-bg-main); padding: 16px 24px 0 24px; z-index: 10; flex-shrink: 0; width: 100%; box-sizing: border-box;">
                            <div style="background: #fef08a; padding: 8px 16px; font-size: 13px; font-weight: 500; color: #854d0e; text-align: center; border-radius: 8px; border: 1px solid #fde047; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                ⚠️ Agente pausado
                            </div>
                        </div>`;

if (regex.test(html)) {
    html = html.replace(regex, replacement);
    console.log("Fixed Regex");
} else {
    console.log("Could not find Regex");
}

fs.writeFileSync('conversas.html', html);
