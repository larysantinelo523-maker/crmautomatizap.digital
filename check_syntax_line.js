const fs = require('fs');
const html = fs.readFileSync('conversas.html', 'utf8');
const startIndex = html.lastIndexOf('<script>') + 8;
const endIndex = html.lastIndexOf('</script>');
const code = html.substring(startIndex, endIndex);

try {
    require('vm').createScript(code);
    console.log('Valid');
} catch (e) {
    console.log(e.stack);
}
