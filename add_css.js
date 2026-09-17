const fs = require('fs');

let css = fs.readFileSync('style.css', 'utf8');
const tooltipCss = `
/* Tooltip Icon */
.info-tooltip {
    position: absolute;
    top: 16px;
    right: 16px;
    color: var(--color-text-mut);
    cursor: help;
    font-size: 16px;
    z-index: 10;
    transition: color 0.2s;
}
.info-tooltip:hover {
    color: var(--color-task-green);
}
.kpi-card .info-tooltip,
.summary-kpi-card .info-tooltip {
    top: 12px;
    right: 12px;
}
.info-tooltip::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--color-text-main);
    color: #fff;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
    z-index: 100;
}
.info-tooltip::before {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: var(--color-text-main) transparent transparent transparent;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
    z-index: 100;
}
.info-tooltip:hover::after,
.info-tooltip:hover::before {
    opacity: 1;
}

`;
if (!css.includes('.info-tooltip')) {
    fs.writeFileSync('style.css', css + tooltipCss);
}
