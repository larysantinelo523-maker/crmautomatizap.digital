const fs = require('fs');
const content = fs.readFileSync('admin.js', 'utf8');
const regex = /\.rpc\(['"](.*?)['"]/g;
let match;
const rpcs = new Set();
while ((match = regex.exec(content)) !== null) {
    rpcs.add(match[1]);
}
console.log('RPCs in admin.js:', Array.from(rpcs));
