const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:\\Users\\joaoa\\.gemini\\antigravity-ide\\brain\\2dc15da3-36c5-46ff-96c3-90b3ac57e5ff\\.system_generated\\steps\\656\\output.txt', 'utf8'));

const nodesToFind = ["Get many rows", "If Is Message", "If", "VERIFICAR NÚMERO", "Create a row1"];

data.workflow.nodes.forEach(node => {
    if (nodesToFind.includes(node.name)) {
        console.log("NODE:", node.name);
        console.log(JSON.stringify(node.parameters, null, 2));
        console.log("----------------------");
    }
});
