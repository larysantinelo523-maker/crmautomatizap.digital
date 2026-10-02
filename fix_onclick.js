const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

const target = `                div.onclick = () => {
                    document.querySelectorAll('.chat-contact-item').forEach(el => el.style.background = 'transparent');
                    div.style.background = 'var(--color-bg-main)';
                    carregarMensagens(lead);
                };`;

const replacement = `                div.onclick = () => {
                    document.querySelectorAll('.chat-contact-item').forEach(el => el.style.background = 'transparent');
                    div.style.background = 'var(--color-bg-main)';
                    carregarMensagens(lead);
                    
                    if(window.innerWidth <= 768) {
                        const leftSide = document.querySelector('.chat-left-sidebar');
                        const rightSide = document.querySelector('.chat-right-wrapper');
                        if (leftSide) leftSide.classList.add('mobile-hidden');
                        if (rightSide) rightSide.classList.remove('mobile-hidden');
                    }
                };`;

// Replace handling both \r\n and \n
const targetRegex = /div\.onclick = \(\) => \{\s*document\.querySelectorAll\('\.chat-contact-item'\)\.forEach\(el => el\.style\.background = 'transparent'\);\s*div\.style\.background = 'var\(--color-bg-main\)';\s*carregarMensagens\(lead\);\s*\};/g;

html = html.replace(targetRegex, replacement);

fs.writeFileSync('conversas.html', html);
console.log('Added mobile hide logic back to div.onclick');
