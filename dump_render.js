const fs = require('fs');
const js = fs.readFileSync('admin.js', 'utf8');

const start = js.indexOf('function renderTenants');
const end = js.indexOf('document.querySelectorAll(".toggle-senha")'); // next major block

if (start > -1 && end > -1) {
    fs.writeFileSync('render_dump.js', js.substring(start, end));
    console.log('Dumped successfully.');
} else {
    console.log('Not found');
}
