const fs = require('fs');

const files = ['index.html', 'admin.html', 'relatorios.html', 'tarefas.html'];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let html = fs.readFileSync(file, 'utf8');

    // Make kpi-card relative and add tooltip
    // We can replace `<div class="kpi-card">` with `<div class="kpi-card" style="position: relative;">` + the icon
    // Wait, some might already have style="position: relative;".
    // I'll just find the icon wrapper or the card itself.
    // It's safer to just inject it right before `</div class="icon-wrapper"`? No, after `<div class="kpi-card"`

    if (file !== 'tarefas.html') {
        html = html.replace(/<div class="kpi-card"([^>]*)>/g, (match, p1) => {
            if (!p1.includes('position: relative')) {
                return `<div class="kpi-card"${p1} style="position: relative;"><i class="ph ph-question info-tooltip" data-tooltip="Como interpretar esta métrica"></i>`;
            } else if (!html.includes('info-tooltip')) { // to avoid duplication if running multiple times
                return `<div class="kpi-card"${p1}><i class="ph ph-question info-tooltip" data-tooltip="Como interpretar esta métrica"></i>`;
            }
            return match;
        });
    } else {
        // tarefas.html
        // calendar container
        if (!html.includes('cal-container" style="position: relative;"')) {
            html = html.replace(/<div class="cal-container">/, `<div class="cal-container" style="position: relative;"><i class="ph ph-question info-tooltip" data-tooltip="Acompanhe as tarefas realizadas pela IA em cada dia"></i>`);
        }
        // summary panel
        if (!html.includes('summary-panel" style="position: relative;"')) {
            html = html.replace(/<section class="card summary-panel">/, `<section class="card summary-panel" style="position: relative;"><i class="ph ph-question info-tooltip" data-tooltip="Veja o resumo diário de tarefas em detalhes"></i>`);
        }
        
        // summary kpi cards
        html = html.replace(/<div class="summary-kpi-card green-light">/g, `<div class="summary-kpi-card green-light" style="position: relative;"><i class="ph ph-question info-tooltip" data-tooltip="Total de atendimentos automatizados"></i>`);
        html = html.replace(/<div class="summary-kpi-card blue-light">/g, `<div class="summary-kpi-card blue-light" style="position: relative;"><i class="ph ph-question info-tooltip" data-tooltip="Total de reuniões marcadas"></i>`);
    }

    fs.writeFileSync(file, html);
});
