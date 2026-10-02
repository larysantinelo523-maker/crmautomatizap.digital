const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

// Replace mobile hide logic with .show-chat logic
html = html.replace(/if\(window\.innerWidth <= 768\) {[\s\S]*?}/, 
`if(window.innerWidth <= 768) {
                        const layout = document.querySelector('.chat-layout');
                        if (layout) layout.classList.add('show-chat');
                    }`);

// Replace back button
html = html.replace(/<i class="ph ph-arrow-left mobile-only"[\s\S]*?<\/i>/, 
`<i class="ph ph-arrow-left mobile-only" style="font-size: 20px; cursor: pointer; margin-right: 8px;" onclick="document.querySelector('.chat-layout').classList.remove('show-chat')"></i>`);

fs.writeFileSync('conversas.html', html);
console.log('Fixed mobile layout logic with .show-chat');
