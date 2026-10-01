const fs = require('fs');

let html = fs.readFileSync('conversas.html', 'utf8');

// The HTML contains two bot-switch IDs. Change them to bot-switch-desktop and bot-switch-mobile.
let count = 0;
html = html.replace(/id="bot-switch"/g, () => {
    count++;
    return count === 1 ? 'id="bot-switch-desktop"' : 'id="bot-switch-mobile"';
});

let countFor = 0;
html = html.replace(/for="bot-switch"/g, () => {
    countFor++;
    return countFor === 1 ? 'for="bot-switch-desktop"' : 'for="bot-switch-mobile"';
});

// Update the JS logic to use querySelectorAll so both switches are bound
html = html.replace(/const toggle = document\.getElementById\('bot-switch'\);/g, "const toggles = document.querySelectorAll('.bot-switch-input');");

// Update how they are checked
html = html.replace(/if\(toggle\) toggle\.checked = isBotActive;/g, "toggles.forEach(t => t.checked = isBotActive);");
html = html.replace(/if\(toggle\) toggle\.checked = newState;/g, "toggles.forEach(t => t.checked = newState);");

// Update the event listener
html = html.replace(/if\s*\(toggle\)\s*\{\s*toggle\.addEventListener\('change',\s*function\(\)\s*\{\s*toggleBotLogic\(this\.checked\);\s*\}\);\s*\}/, 
"toggles.forEach(toggle => { toggle.addEventListener('change', function() { toggleBotLogic(this.checked); }); });");

fs.writeFileSync('conversas.html', html);
console.log('Fixed dual IDs.');
