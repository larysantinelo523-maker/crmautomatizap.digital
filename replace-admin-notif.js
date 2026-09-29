const fs = require('fs');
let content = fs.readFileSync('admin.html', 'utf8');

const target = <div class="user-menu" id="user-menu-btn">;
const replacement = 
                    <div class="notification-wrapper" id="notification-wrapper">
                        <button class="notification-btn" id="notification-btn">
                            <i class="ph ph-bell"></i>
                            <span class="notification-dot" style="display: block;"></span>
                        </button>

                        <!-- Notification Dropdown -->
                        <div class="notification-dropdown" id="notification-dropdown">
                            <div class="notif-header"
                                style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid var(--color-border);">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <h4 style="margin: 0; font-size: 16px; font-weight: 600;">Notificações</h4>
                                    <span class="badge primary-light" id="notif-badge"
                                        style="display: inline-flex; padding: 2px 8px; border-radius: 12px; font-size: 11px;">1</span>
                                </div>
                                <button id="btn-read-all"
                                    style="background: none; border: none; font-size: 12px; color: var(--color-primary); cursor: pointer; display: block;">Marcar lidas</button>
                            </div>
                            <div class="notif-list" id="notif-list">
                                <div class="notif-item unread" style="padding: 16px; border-bottom: 1px solid var(--color-border); cursor: pointer; transition: 0.2s;" onclick="openConfiguracoes({ id: 'mock-id-geremias', nome: 'SEU GEREMIAS', plano: 'Pago', status: 'Ativo', total_leads: 2, reunioes: 1, email: 'geremias@gmail.com', location: 'Rua dom joão padre nobrega 127', segment: 'Barbearia', desc: 'barbearia que cuida da parte estetica do homem', price: 'R$ 0,01', created: '20/09/2026', vencimento: '10/09/2036' })">
                                    <div style="display: flex; gap: 12px;">
                                        <div style="width: 32px; height: 32px; border-radius: 50%; background-color: var(--color-warning-light); color: #B45309; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">
                                            <i class="ph ph-warning-circle"></i>
                                        </div>
                                        <div style="flex: 1;">
                                            <p style="margin: 0; font-size: 13.5px; color: var(--color-text-main); font-weight: 500; line-height: 1.3;">Correção de Agente - SEU GEREMIAS</p>
                                            <p style="margin: 4px 0 0; font-size: 12px; color: var(--color-text-sec); line-height: 1.4;">O usuário solicitou uma correção: O agente respondeu algo errado.</p>
                                            <span style="display: block; margin-top: 6px; font-size: 11px; color: var(--color-text-mut);">Agora mesmo</span>
                                        </div>
                                    </div>
                                </div>
                                <!-- Mock payment notification -->
                                <div class="notif-item" style="padding: 16px; border-bottom: 1px solid var(--color-border); cursor: pointer; transition: 0.2s;">
                                    <div style="display: flex; gap: 12px;">
                                        <div style="width: 32px; height: 32px; border-radius: 50%; background-color: var(--color-task-green-light); color: var(--color-task-green-text); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">
                                            <i class="ph ph-currency-dollar"></i>
                                        </div>
                                        <div style="flex: 1;">
                                            <p style="margin: 0; font-size: 13.5px; color: var(--color-text-main); font-weight: 500; line-height: 1.3;">Pagamento Processado</p>
                                            <p style="margin: 4px 0 0; font-size: 12px; color: var(--color-text-sec); line-height: 1.4;">A assinatura de Lary Santinelo foi renovada com sucesso.</p>
                                            <span style="display: block; margin-top: 6px; font-size: 11px; color: var(--color-text-mut);">Há 2 horas</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="notif-footer" style="padding: 12px; text-align: center; border-top: 1px solid var(--color-border); background: #F9FAFB;">
                                <a href="#" style="font-size: 13px; font-weight: 500; color: var(--color-primary); text-decoration: none;">Ver todas</a>
                            </div>
                        </div>
                    </div>

                    <div class="user-menu" id="user-menu-btn">;
content = content.replace(target, replacement);
fs.writeFileSync('admin.html', content);
