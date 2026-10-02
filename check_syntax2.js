const fs = require('fs');
const html = fs.readFileSync('conversas.html', 'utf8');

let startIndex = 0;
while ((startIndex = html.indexOf('<script>', startIndex)) > -1) {
    const endIndex = html.indexOf('</script>', startIndex);
    const code = html.substring(startIndex + 8, endIndex);
    try {
        new Function(code);
        console.log('Script at index ' + startIndex + ' is VALID');
    } catch (e) {
        console.error('Script at index ' + startIndex + ' ERROR:', e.message);
    }
    startIndex = endIndex + 9;
}
