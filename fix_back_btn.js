const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

const target = '<!-- <i class="ph ph-arrow-left mobile-only" style="font-size: 20px; cursor: pointer; display: none;" onclick="document.querySelector(\'.chat-layout\').classList.remove(\'show-chat\')"></i> -->';
const replacement = '<i class="ph ph-arrow-left mobile-only" style="font-size: 20px; cursor: pointer; margin-right: 8px;" onclick="document.querySelector(\'.chat-left-sidebar\').classList.remove(\'mobile-hidden\'); document.querySelector(\'.chat-right-wrapper\').classList.add(\'mobile-hidden\');"></i>';

html = html.replace(target, replacement);

// Fix the button icon too
html = html.replace('<i class="ph-fill ph-paper-plane-tilt" style="font-size: 20px;"></i>', '<i class="ph-fill ph-paper-plane-right" style="font-size: 20px;"></i>');

fs.writeFileSync('conversas.html', html);
console.log('Fixed back button and icon!');
