const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

const regex = /\/\/ Adiciona a mensagem de sistema UMA ÚNICA VEZ no final[\s\S]*?container\.innerHTML \+= html;\s*\/\/ Scroll to bottom/g;

const replacement = `// Update the pinned banner instead of appending a message
            const pausedBanner = document.getElementById('agente-pausado-banner');
            if (pausedBanner) {
                pausedBanner.style.display = isBotActive === false ? 'block' : 'none';
            }
            
            container.innerHTML += html;
            // Scroll to bottom`;

html = html.replace(regex, replacement);

fs.writeFileSync('conversas.html', html);
console.log('Fixed Agent Paused banner placement');
