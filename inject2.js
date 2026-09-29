const fs = require('fs');
let html = fs.readFileSync('teste-agente.html', 'utf8');

const oldScriptTag = `<script>
        document.addEventListener('DOMContentLoaded', () => {`;
const newScriptTag = `<script type="module">
        import { supabase } from './supabase.js';
        document.addEventListener('DOMContentLoaded', () => {`;

html = html.replace(oldScriptTag, newScriptTag);

const oldSubmit = `btnSubmit.addEventListener('click', () => {`;
const newSubmit = `btnSubmit.addEventListener('click', async () => {`;

html = html.replace(oldSubmit, newSubmit);

const oldLogic = `// Show success state
                const originalText = btnSubmit.innerHTML;
                btnSubmit.innerHTML = '<i class="ph ph-check-circle"></i> Enviado!';`;
const newLogic = `const originalText = btnSubmit.innerHTML;
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Enviando...';

                try {
                    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                    if (!sessionError && session && session.user) {
                        const motivoTitle = modalTitle.textContent.trim();
                        await supabase.from('reportes_agente').insert({
                            id_empresa: session.user.id,
                            motivo_principal: motivoTitle,
                            descricao_detalhada: text
                        });
                    }
                } catch(e) {
                    console.error(e);
                }

                btnSubmit.disabled = false;
                
                // Show success state
                btnSubmit.innerHTML = '<i class="ph ph-check-circle"></i> Enviado!';`;

html = html.replace(oldLogic, newLogic);
fs.writeFileSync('teste-agente.html', html);
console.log('updated teste-agente.html');
