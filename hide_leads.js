const fs = require('fs');

// Lemos todos os arquivos html no diretório principal
const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    // Procura por <a href="leads.html" class="..."> e adiciona style="display: none !important;"
    content = content.replace(/<a\s+href="leads\.html"\s+class="([^"]+)"\s*>/g, '<a href="leads.html" class="$1" style="display: none !important;">');
    
    fs.writeFileSync(f, content, 'utf8');
    console.log(`Updated ${f}`);
});
