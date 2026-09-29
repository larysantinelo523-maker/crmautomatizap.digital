const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

// 1. Remove duplicate notification-wrapper (the second one)
const notifStartStr = '<div class="notification-wrapper" id="notification-wrapper">';
let firstNotifIdx = html.indexOf(notifStartStr);
let secondNotifIdx = html.indexOf(notifStartStr, firstNotifIdx + 1);

if (secondNotifIdx !== -1) {
    const endStr = '</div>\r\n\r\n                    <div class="user-menu" id="user-menu-btn">';
    let endNotifIdx = html.indexOf(endStr, secondNotifIdx);
    if (endNotifIdx !== -1) {
        html = html.substring(0, secondNotifIdx) + html.substring(endNotifIdx + '</div>\r\n\r\n'.length);
        console.log('Removed duplicate notification bell');
    } else {
        const endStr2 = '</div>\n\n                    <div class="user-menu" id="user-menu-btn">';
        let endNotifIdx2 = html.indexOf(endStr2, secondNotifIdx);
        if (endNotifIdx2 !== -1) {
            html = html.substring(0, secondNotifIdx) + html.substring(endNotifIdx2 + '</div>\n\n'.length);
            console.log('Removed duplicate notification bell (LF)');
        }
    }
}

// 2. Change Correções table to cards
const oldTableHtml = `<div class="table-responsive">
                                    <table class="table">
                                        <thead>
                                            <tr>
                                                <th>Data/Hora</th>
                                                <th>Motivo Principal</th>
                                                <th>Descrição do Problema</th>
                                            </tr>
                                        </thead>
                                        <tbody id="table-correcoes-body">
                                            <tr><td colspan="3" style="text-align: center; color: var(--color-text-mut);">Carregando correções...</td></tr>
                                        </tbody>
                                    </table>
                                </div>`;
const newCardsHtml = `<div id="correcoes-cards-container" style="display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto; padding-right: 4px;">
                                    <div style="text-align: center; color: var(--color-text-mut); padding: 24px; font-size: 13px;">Carregando correções...</div>
                                </div>`;

if (html.includes(oldTableHtml)) {
    html = html.replace(oldTableHtml, newCardsHtml);
    console.log('Replaced table with cards container');
} else {
    // try to match with regex in case of indentation changes
    const tbRegex = /<div class="table-responsive">[\s\S]*?<\/table>\s*<\/div>/;
    if (tbRegex.test(html)) {
        html = html.replace(tbRegex, newCardsHtml);
        console.log('Replaced table with cards container via regex');
    }
}

fs.writeFileSync('admin.html', html);
