const fs = require('fs');
const html = fs.readFileSync('conversas.html', 'utf8');
const script = html.substring(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
fs.writeFileSync('test_script.js', script);
