const fs = require('fs');
const html = fs.readFileSync('dist/conversas.html', 'utf8');
const scriptIdx = html.indexOf('<script type="module"');
const inlineIdx = html.indexOf('window.initConversations');
console.log('Module script index:', scriptIdx, 'Inline script index:', inlineIdx);
