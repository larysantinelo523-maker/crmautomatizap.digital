const fs = require('fs');
const content = fs.readFileSync('admin.js', 'utf8');
const regex = /\.from\(['"](.*?)['"]\)/g;
let match;
const tables = new Set();
while ((match = regex.exec(content)) !== null) {
    tables.add(match[1]);
}
console.log('Tables in admin.js:', Array.from(tables));
