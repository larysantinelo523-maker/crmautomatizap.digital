const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

const tLogicStart = html.indexOf('async function toggleBotLogic');
const tLogicEnd = html.indexOf('if(toggle) {', tLogicStart);
console.log(html.substring(tLogicStart, tLogicEnd));

const cMsgStart = html.indexOf('// Descobrir estado do toggle lendo a ultima mensagem');
const cMsgEnd = html.indexOf('let html = \'\';', cMsgStart);
console.log(html.substring(cMsgStart, cMsgEnd));
