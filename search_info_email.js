const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');
const start = html.indexOf('id="info-email"');
if (start > -1) {
    console.log(html.substring(start - 400, start + 800));
} else {
    console.log('Not found');
}
