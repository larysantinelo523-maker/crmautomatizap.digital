const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

const targetStr1 = `<!-- Right -->
                        <div style="display: flex; flex-direction: column; gap: 24px;">`;
const replaceStr1 = `<!-- Right -->
                        <div style="display: flex; flex-direction: column; gap: 24px; height: 100%;">`;

const targetStr2 = `<!-- Horário Comercial -->
                            <div class="card">`;
const replaceStr2 = `<!-- Horário Comercial -->
                            <div class="card" style="flex: 1; display: flex; flex-direction: column;">`;

if (html.includes(targetStr1)) {
    html = html.replace(targetStr1, replaceStr1);
    html = html.replace(targetStr2, replaceStr2);
    fs.writeFileSync('admin.html', html);
    console.log('Fixed right column flex styles');
} else {
    // maybe line endings
    const rgx1 = /<!-- Right -->\s*<div style="display: flex; flex-direction: column; gap: 24px;">/;
    const rgx2 = /<!-- Horário Comercial -->\s*<div class="card">/;
    
    if(rgx1.test(html)) {
        html = html.replace(rgx1, `<!-- Right -->\n                        <div style="display: flex; flex-direction: column; gap: 24px; height: 100%;">`);
        html = html.replace(rgx2, `<!-- Horário Comercial -->\n                            <div class="card" style="flex: 1; display: flex; flex-direction: column;">`);
        fs.writeFileSync('admin.html', html);
        console.log('Fixed right column flex styles via regex');
    } else {
        console.log('Not found');
    }
}
