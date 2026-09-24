const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace the sidebar item
  content = content.replace(
    /<i class="ph ph-check-square-offset"><\/i>\s*<span>Tarefas<\/span>/g, 
    '<i class="ph ph-calendar-blank"></i>\n                    <span>Agendamentos</span>'
  );
  
  fs.writeFileSync(file, content);
}
console.log('Sidebar updated');
