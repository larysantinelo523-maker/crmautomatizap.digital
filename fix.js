const fs = require('fs');
let data = fs.readFileSync('tarefas.js', 'utf8');

data = data.replace(/, qualificados: \d+, vendas: \d+/g, '');
data = data.replace(/status: 'Lead qualificado'/g, "status: 'Atendido'");
data = data.replace(/status: 'Venda'/g, "status: 'Atendido'");
data = data.replace(/sumQualificados\.textContent = '0';\r?\n?/g, '');
data = data.replace(/sumVendas\.textContent = '0';\r?\n?/g, '');

fs.writeFileSync('tarefas.js', data);
