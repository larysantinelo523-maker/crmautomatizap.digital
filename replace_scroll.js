const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');
const search = `            if (novoHtml) {
                container.insertAdjacentHTML('beforeend', novoHtml);
                container.scrollTop = container.scrollHeight;
            }`;
const replace = `            if (novoHtml) {
                const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
                container.insertAdjacentHTML('beforeend', novoHtml);
                if (isAtBottom) {
                    container.scrollTop = container.scrollHeight;
                }
            }`;
if(html.includes(search)) {
    html = html.replace(search, replace);
    fs.writeFileSync('conversas.html', html);
    console.log("Success exact");
} else {
    const search2 = search.replace(/\r\n/g, '\n');
    const replace2 = replace.replace(/\r\n/g, '\n');
    if(html.includes(search2)) {
        html = html.replace(search2, replace2);
        fs.writeFileSync('conversas.html', html);
        console.log("Success LF");
    } else {
        const search3 = search.replace(/\n/g, '\r\n');
        const replace3 = replace.replace(/\n/g, '\r\n');
        if(html.includes(search3)) {
            html = html.replace(search3, replace3);
            fs.writeFileSync('conversas.html', html);
            console.log("Success CRLF");
        } else {
            console.log("Not found");
        }
    }
}
