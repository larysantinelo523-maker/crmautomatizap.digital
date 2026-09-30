const fs = require('fs');
const content = fs.readFileSync('script.js', 'utf8');
const regex = /\.from\(['"](.*?)['"]\)/g;
let match;
const tables = new Set();
while ((match = regex.exec(content)) !== null) {
    tables.add(match[1]);
}
console.log('Tables in script.js:', Array.from(tables));
