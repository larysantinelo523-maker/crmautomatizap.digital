const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

html = html.replace(/<div class="card"\s+style="padding: 0; display: flex; flex-direction: column; height: 100%; border-radius: 0; border: none; border-right: 1px solid var\(--color-border\);"\s*>/, '<div class="card chat-left-sidebar"\n                    style="padding: 0; display: flex; flex-direction: column; height: 100%; border-radius: 0; border: none; border-right: 1px solid var(--color-border);">');

fs.writeFileSync('conversas.html', html);
console.log('Class chat-left-sidebar added!');
