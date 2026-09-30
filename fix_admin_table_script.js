const fs = require('fs');
let js = fs.readFileSync('admin.js', 'utf8');

// The original table has columns:
// Empresa (0) | Email (1) | Venc (2) | Dias (3) | Leads (4) | Status (5) | Chave (6)
// I will regex replace the td tags corresponding to Dias and Leads.

// We need to carefully replace the HTML template string.
// Let's find `tr.innerHTML = \``
const trStart = js.indexOf('tr.innerHTML = `');
if (trStart === -1) {
    console.log('tr.innerHTML not found!');
    process.exit(1);
}
const trEnd = js.indexOf('`;', trStart);
let trHtml = js.substring(trStart, trEnd + 2);

// Replace Dias Restantes and Total de Leads with Mensalidade
// Instead of complex regex, let's just write the exact replacement for those two lines since we know what they generally look like.
trHtml = trHtml.replace(/<td style="font-size: 13px;">\$\{.*?\}<\/td>\s*<td style="font-size: 13px; color: var\(--color-text-main\); font-weight: 500;">\s*\$\{t\.total_leads.*?\s*<\/td>/, 
    `<td style="font-size: 13px; color: var(--color-text-main); font-weight: 500;">\n            \${t.mensalidade ? (isNaN(parseFloat(t.mensalidade)) ? t.mensalidade : 'R$ ' + parseFloat(t.mensalidade).toFixed(2).replace('.', ',')) : 'R$ 0,00'}\n        </td>`);

// Now replace it in the JS file
js = js.substring(0, trStart) + trHtml + js.substring(trEnd + 2);

// Now for the Dias Restantes in the Tenant Details Card
// The sidebar has an element with the email. Let's find `tenant.email` or `t.email`.
// Likely in a function that renders the side panel. It sets something like `document.getElementById('tenant-email').textContent = email;`
const searchEmail = 'document.getElementById("tenant-email").textContent = email;';
const searchEmail2 = "document.getElementById('tenant-email').textContent = email;";

let emailIdx = js.indexOf(searchEmail);
if (emailIdx === -1) emailIdx = js.indexOf(searchEmail2);

if (emailIdx !== -1) {
    // We want to insert the Dias Restantes below it. The DOM might need a new element, or we can just update an existing one.
    // Let's add the logic to calculate diasRestantes and put it in a new element if it doesn't exist, or just append it.
    console.log('Found tenant-email assignment');
}

fs.writeFileSync('fix_admin.js.tmp', js);
console.log('Replaced table tr!');
