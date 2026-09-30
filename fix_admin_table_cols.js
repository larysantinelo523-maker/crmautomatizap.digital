const fs = require('fs');
let js = fs.readFileSync('admin.js', 'utf8');

const targetStr = `                <td>\${diasRestantesText}</td>
                <td><span><strong>\${tenant.total_leads || 0}</strong> leads</span></td>`;

const targetStr2 = `                <td>\${diasRestantesText}</td>\n                <td><span><strong>\${tenant.total_leads || 0}</strong> leads</span></td>`;
const targetStr3 = `                <td>\${diasRestantesText}</td>\r\n                <td><span><strong>\${tenant.total_leads || 0}</strong> leads</span></td>`;


const newStr = `                <td><span style="font-weight: 500;">\${tenant.mensalidade ? (isNaN(parseFloat(tenant.mensalidade)) ? tenant.mensalidade : 'R$ ' + parseFloat(tenant.mensalidade).toLocaleString('pt-BR', {minimumFractionDigits: 2})) : 'R$ 0,00'}</span></td>`;

let replaced = false;
if (js.includes(targetStr)) {
    js = js.replace(targetStr, newStr);
    replaced = true;
} else if (js.includes(targetStr2)) {
    js = js.replace(targetStr2, newStr);
    replaced = true;
} else if (js.includes(targetStr3)) {
    js = js.replace(targetStr3, newStr);
    replaced = true;
} else {
    // try a regex
    const regex = /<td>\$\{diasRestantesText\}<\/td>\s*<td><span><strong>\$\{tenant.total_leads \|\| 0\}<\/strong> leads<\/span><\/td>/;
    if (regex.test(js)) {
        js = js.replace(regex, newStr);
        replaced = true;
    }
}

if (replaced) {
    fs.writeFileSync('admin.js', js);
    console.log('Successfully replaced table columns');
} else {
    console.log('Failed to find target string in admin.js');
}
