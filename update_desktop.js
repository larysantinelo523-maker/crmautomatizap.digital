const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

// 1. Replace the buttons in HTML
const htmlButtonsOld = `<button class="btn-intervencao desktop-only" id="btn-intervencao" style="font-size: 13px; padding: 6px 12px;">
                                    <i class="ph ph-user"></i> <span id="text-intervencao" class="desktop-only">Intervenção Humana</span>
                                </button>
                                <button class="btn-ativacao desktop-only" id="btn-ativacao" style="font-size: 13px; padding: 6px 12px;">
                                    <i class="ph ph-robot"></i> <span id="text-ativacao" class="desktop-only">Ativar Agente</span>
                                </button>`;

const htmlButtonsNew = `<button class="btn-toggle-agente desktop-only" id="btn-toggle-agente" style="font-size: 13px; padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 500;">
                                    <i class="ph ph-user" id="icon-toggle-agente"></i> <span id="text-toggle-agente" class="desktop-only">Pausar Agente</span>
                                </button>`;

html = html.replace(htmlButtonsOld, htmlButtonsNew);
html = html.replace(htmlButtonsOld.replace(/\r\n/g, '\n'), htmlButtonsNew);

// 2. Add class to banner to make CSS styling easier
html = html.replace('id="agente-pausado-banner" style="display: none; background-color: var(--color-bg-main);', 'id="agente-pausado-banner" class="agente-pausado-banner-desktop" style="display: none; background-color: var(--color-bg-main);');

// 3. Replace JS event listeners
const jsListenersOld = `            if(btnIntervencao) {
                btnIntervencao.addEventListener('click', function() {
                    toggleBotLogic(false);
                });
            }
            if(btnAtivacao) {
                btnAtivacao.addEventListener('click', function() {
                    toggleBotLogic(true);
                });
            }`;

const jsListenersNew = `            const btnToggleAgente = document.getElementById('btn-toggle-agente');
            if(btnToggleAgente) {
                // Remove listeners antigos para evitar duplicidade ao recarregar
                const novoBtn = btnToggleAgente.cloneNode(true);
                btnToggleAgente.parentNode.replaceChild(novoBtn, btnToggleAgente);
                
                novoBtn.addEventListener('click', async function() {
                    const isAtivo = this.getAttribute('data-active') === 'true';
                    toggleBotLogic(!isAtivo);
                });
            }`;
            
html = html.replace(jsListenersOld, jsListenersNew);
html = html.replace(jsListenersOld.replace(/\r\n/g, '\n'), jsListenersNew);

// 4. Replace UI update logic
const jsUpdateOld = `            const btnIntervencaoDesktop = document.getElementById('btn-intervencao');
            const btnAtivacaoDesktop = document.getElementById('btn-ativacao');
            const pausedBanner = document.getElementById('agente-pausado-banner');
            
            if(isBotActive) {
                if(btnIntervencaoDesktop) btnIntervencaoDesktop.style.display = 'flex';
                if(btnAtivacaoDesktop) btnAtivacaoDesktop.style.display = 'none';
                if(pausedBanner) pausedBanner.style.display = 'none';
            } else {
                if(btnIntervencaoDesktop) btnIntervencaoDesktop.style.display = 'none';
                if(btnAtivacaoDesktop) btnAtivacaoDesktop.style.display = 'flex';
                if(pausedBanner) pausedBanner.style.display = 'flex';
            }`;

const jsUpdateNew = `            const btnToggleAgenteDesktop = document.getElementById('btn-toggle-agente');
            const pausedBanner = document.getElementById('agente-pausado-banner');
            
            if (btnToggleAgenteDesktop) {
                btnToggleAgenteDesktop.setAttribute('data-active', isBotActive);
                const icon = btnToggleAgenteDesktop.querySelector('i');
                const text = document.getElementById('text-toggle-agente');
                if (isBotActive) {
                    btnToggleAgenteDesktop.style.backgroundColor = 'var(--color-danger)';
                    btnToggleAgenteDesktop.style.color = 'white';
                    icon.className = 'ph ph-user';
                    text.innerText = 'Pausar Agente';
                    if(pausedBanner) pausedBanner.style.display = 'none';
                } else {
                    btnToggleAgenteDesktop.style.backgroundColor = 'var(--color-success)';
                    btnToggleAgenteDesktop.style.color = 'white';
                    icon.className = 'ph ph-robot';
                    text.innerText = 'Ativar Agente';
                    if(pausedBanner) pausedBanner.style.display = 'flex';
                }
            }`;

html = html.replace(jsUpdateOld, jsUpdateNew);
html = html.replace(jsUpdateOld.replace(/\r\n/g, '\n'), jsUpdateNew);

fs.writeFileSync('conversas.html', html);
console.log("Replaced HTML and JS for single toggle button");
