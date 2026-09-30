const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

const regex = /<th>Empresa<\/th>[\s\S]*?<th>Chave de API<\/th>/;

const replacement = `<th>Empresa</th>
                                        <th>Email responsável</th>
                                        <th>Vencimento</th>
                                        <th>Valor Cobrado</th>
                                        <th>Status</th>
                                        <th>API</th>`;

if (regex.test(html)) {
    html = html.replace(regex, replacement);
    fs.writeFileSync('admin.html', html);
    console.log('Table headers replaced successfully in admin.html');
} else {
    console.log('Regex failed');
}
