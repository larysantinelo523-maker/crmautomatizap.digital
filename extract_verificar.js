const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:\\Users\\joaoa\\.gemini\\antigravity-ide\\brain\\2dc15da3-36c5-46ff-96c3-90b3ac57e5ff\\.system_generated\\steps\\656\\output.txt', 'utf8'));

console.log("VERIFICAR NUMERO connections:", JSON.stringify(data.workflow.connections['VERIFICAR NÚMERO'], null, 2));
