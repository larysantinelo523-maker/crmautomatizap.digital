const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

const targetHtml = `<span id="info-email" style="font-weight: 500; font-size: 14px;">...</span>
                                    </div>`;

const replaceHtml = `<span id="info-email" style="font-weight: 500; font-size: 14px;">...</span>
                                    </div>
                                    <div class="info-row"
                                        style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--color-border);">
                                        <span style="color: var(--color-text-mut); font-size: 14px;">Dias Restantes</span>
                                        <span id="info-dias-restantes" style="font-weight: 500; font-size: 14px;">...</span>
                                    </div>`;

if (html.includes(targetHtml)) {
    html = html.replace(targetHtml, replaceHtml);
    fs.writeFileSync('admin.html', html);
    console.log('HTML updated');
} else {
    // maybe \r\n
    const t2 = `<span id="info-email" style="font-weight: 500; font-size: 14px;">...</span>\r\n                                    </div>`;
    const r2 = `<span id="info-email" style="font-weight: 500; font-size: 14px;">...</span>\r\n                                    </div>\r\n                                    <div class="info-row"\r\n                                        style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--color-border);">\r\n                                        <span style="color: var(--color-text-mut); font-size: 14px;">Dias Restantes</span>\r\n                                        <span id="info-dias-restantes" style="font-weight: 500; font-size: 14px;">...</span>\r\n                                    </div>`;
    if (html.includes(t2)) {
        html = html.replace(t2, r2);
        fs.writeFileSync('admin.html', html);
        console.log('HTML updated (CRLF)');
    } else {
        const regex = /<span id="info-email"[^>]*>.*?<\/span>\s*<\/div>/;
        html = html.replace(regex, `$&
                                    <div class="info-row"
                                        style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--color-border);">
                                        <span style="color: var(--color-text-mut); font-size: 14px;">Dias Restantes</span>
                                        <span id="info-dias-restantes" style="font-weight: 500; font-size: 14px;">...</span>
                                    </div>`);
        fs.writeFileSync('admin.html', html);
        console.log('HTML updated (regex)');
    }
}
