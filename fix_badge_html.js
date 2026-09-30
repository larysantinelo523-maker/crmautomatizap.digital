const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

// Replace notification-dot
html = html.replace(
    '<span class="notification-dot" style="display: block;"></span>', 
    '<span class="notification-dot" style="display: none;"></span>'
);

// Replace notif-badge inner text and display
html = html.replace(
    /id="notif-badge"\s*style="display: inline-flex;(.*?)"\s*>\d+<\/span>/,
    'id="notif-badge"\\n                                        style="display: none;$1"></span>'
);

fs.writeFileSync('admin.html', html);
console.log('admin.html updated');
