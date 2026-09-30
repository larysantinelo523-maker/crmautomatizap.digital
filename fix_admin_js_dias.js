const fs = require('fs');
let js = fs.readFileSync('admin.js', 'utf8');

const regex = /document\.getElementById\("info-email"\)\.textContent = displayEmail;/;

const injection = `document.getElementById("info-email").textContent = displayEmail;
    
    let diasStr = "N/A";
    if (t.vencimento && t.vencimento !== "N/A") {
        const pts = t.vencimento.split("-");
        if (pts.length === 3) {
            const yr = parseInt(pts[0], 10), mo = parseInt(pts[1], 10) - 1, dy = parseInt(pts[2], 10);
            const nextDate = new Date(yr, mo, dy, 0, 0, 0, 0);
            const hojeStr = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
            const hoje = new Date(hojeStr);
            hoje.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((nextDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays > 3) diasStr = diffDays + " dias";
            else if (diffDays > 0) diasStr = diffDays + (diffDays === 1 ? " dia" : " dias");
            else if (diffDays === 0) diasStr = "Vence hoje";
            else diasStr = "Atrasado";
        }
    }
    const elDias = document.getElementById("info-dias-restantes");
    if (elDias) elDias.textContent = diasStr;`;

if (regex.test(js)) {
    js = js.replace(regex, injection);
    fs.writeFileSync('admin.js', js);
    console.log('admin.js updated with dias restantes');
} else {
    console.log('Failed to find info-email injection point');
}
