const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');
html = html.replace('id="notif-badge"\\n', 'id="notif-badge" ');
fs.writeFileSync('admin.html', html);
console.log('Fixed literal \\n in admin.html');
