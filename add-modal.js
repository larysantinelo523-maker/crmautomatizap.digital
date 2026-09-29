const fs = require('fs');

let html = fs.readFileSync('teste-agente.html', 'utf8');

// Replace all 'btn btn-primary' with 'btn btn--primary btn-report-issue' in the report section
html = html.replace(/<button class="btn btn-primary"/g, '<button class="btn btn--primary btn-report-issue"');
// Change the text inside the button to 'Detalhar'
html = html.replace(/<button class="btn btn--primary btn-report-issue"(.*?)>Reportar<\/button>/gs, '<button class="btn btn--primary btn-report-issue"$1>Detalhar</button>');

// Append the Modal HTML before the closing </body> tag if not exists
const modalHTML = `
    <!-- Modal de Reporte -->
    <div id="modal-report" class="modal-overlay" style="display: none; position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.4); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="modal-content" style="background: white; width: 100%; max-width: 480px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); padding: 32px; animation: modalSlideUp 0.3s ease-out;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                <div>
                    <h2 id="modal-report-title" style="margin: 0; font-size: 18px; color: var(--color-text-main); font-weight: 700;">Detalhar Problema</h2>
                    <p style="margin: 4px 0 0; font-size: 14px; color: var(--color-text-mut);">Descreva o que aconteceu para melhorarmos a IA.</p>
                </div>
                <button id="btn-close-modal" style="background: transparent; border: none; cursor: pointer; color: var(--color-text-mut); padding: 4px; border-radius: 50%; display: flex; transition: all 0.2s;">
                    <i class="ph ph-x" style="font-size: 20px;"></i>
                </button>
            </div>
            
            <div style="margin-bottom: 24px;">
                <label style="display: block; font-size: 13px; font-weight: 600; color: var(--color-text-sec); margin-bottom: 8px;">Detalhes do ocorrido</label>
                <textarea id="modal-report-text" rows="4" placeholder="Ex: A IA não soube responder sobre..." style="width: 100%; padding: 12px; border: 1px solid var(--color-border); border-radius: 8px; font-size: 14px; outline: none; resize: vertical; box-sizing: border-box; font-family: inherit; transition: border-color 0.2s;"></textarea>
            </div>
            
            <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button id="btn-cancel-modal" class="btn outline" style="padding: 10px 20px;">Cancelar</button>
                <button id="btn-submit-modal" class="btn btn--primary" style="padding: 10px 20px; display: flex; align-items: center; gap: 8px;">
                    <i class="ph ph-paper-plane-right"></i> Enviar Reporte
                </button>
            </div>
        </div>
    </div>
    
    <style>
        @keyframes modalSlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        #modal-report textarea:focus {
            border-color: var(--color-primary);
        }
        #btn-close-modal:hover {
            background-color: var(--color-bg-alt);
            color: var(--color-text-main);
        }
    </style>
    
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const reportButtons = document.querySelectorAll('.btn-report-issue');
            const modal = document.getElementById('modal-report');
            const modalTitle = document.getElementById('modal-report-title');
            const btnClose = document.getElementById('btn-close-modal');
            const btnCancel = document.getElementById('btn-cancel-modal');
            const btnSubmit = document.getElementById('btn-submit-modal');
            const textarea = document.getElementById('modal-report-text');
            
            function openModal(title) {
                modalTitle.textContent = title;
                textarea.value = '';
                modal.style.display = 'flex';
                setTimeout(() => textarea.focus(), 100);
            }
            
            function closeModal() {
                modal.style.display = 'none';
            }
            
            reportButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Get the text from the previous span element
                    const container = btn.closest('div[style*="display: flex; align-items: center; justify-content: space-between"]');
                    const span = container.querySelector('span');
                    if (span) {
                        openModal(span.textContent.trim());
                    } else {
                        openModal("Reportar Problema");
                    }
                });
            });
            
            btnClose.addEventListener('click', closeModal);
            btnCancel.addEventListener('click', closeModal);
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
            
            btnSubmit.addEventListener('click', () => {
                const text = textarea.value.trim();
                if(!text) {
                    textarea.style.borderColor = 'red';
                    setTimeout(() => textarea.style.borderColor = 'var(--color-primary)', 1500);
                    return;
                }
                
                // Show success state
                const originalText = btnSubmit.innerHTML;
                btnSubmit.innerHTML = '<i class="ph ph-check-circle"></i> Enviado!';
                btnSubmit.style.backgroundColor = '#10B981';
                
                setTimeout(() => {
                    closeModal();
                    btnSubmit.innerHTML = originalText;
                    btnSubmit.style.backgroundColor = '';
                }, 1500);
            });
        });
    </script>
`;

if (!html.includes('id="modal-report"')) {
    html = html.replace('</body>', modalHTML + '\n</body>');
}

fs.writeFileSync('teste-agente.html', html);
console.log('done');
