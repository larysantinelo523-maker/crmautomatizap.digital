const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

const strStart = '<div class="notif-list" id="notif-list">';
const strEnd = '<div style="padding: 16px; border-top: 1px solid var(--color-border); text-align: center;">';

const idxStart = html.indexOf(strStart);
const idxEnd = html.indexOf(strEnd, idxStart);

if (idxStart !== -1 && idxEnd !== -1) {
    const p1 = html.substring(0, idxStart + strStart.length);
    const p2 = html.substring(idxEnd - 33); // get the ending </div> of notif-list
    // Actually just:
    // </div> (for notif list)
    // <div style="padding: 16px...
    
    // Let's just find the closing tag of notif-list by finding the div before strEnd
    let block = html.substring(idxStart + strStart.length, idxEnd);
    const replacement = '\\n                                <div style="padding: 20px; text-align: center; color: var(--color-text-mut); font-size: 13px;">Carregando notificações...</div>\\n                            </div>\\n                            ';
    
    html = html.substring(0, idxStart + strStart.length) + replacement + html.substring(idxEnd);
    fs.writeFileSync('admin.html', html);
    console.log('Mock removed via substring');
} else {
    console.log('Could not find indices');
}
