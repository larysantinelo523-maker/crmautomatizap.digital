const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

const regex = /<div\s+style="display: flex; flex-direction: column; gap: 12px; font-size: 13px; margin-top: 4px; padding-top: 10px; border-top: 1px solid var\(--color-border\);">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const newHTML = `<div
                                style="display: flex; flex-direction: column; gap: 12px; font-size: 13px; margin-top: 4px; padding-top: 10px; border-top: 1px solid var(--color-border);">
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <div
                                        style="width: 64px; height: 30px; background: #0F5B46; border-radius: 15px; position: relative; display: flex; align-items: center; justify-content: space-between; padding: 0 8px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2); transform: scale(0.7); transform-origin: left center; margin-right: -12px;">
                                        <i class="ph ph-robot" style="color: white; font-size: 16px; z-index: 2; opacity: 1;"></i>
                                        <i class="ph ph-user"
                                            style="color: #69B39B; font-size: 16px; z-index: 2; opacity: 0;"></i>
                                        <div
                                            style="position: absolute; top: 2px; left: 2px; transform: translateX(34px); width: 26px; height: 26px; background: white; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.3); z-index: 1;">
                                        </div>
                                    </div>
                                    <span><strong>Verde Escuro:</strong> Robô trabalhando</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <div
                                        style="width: 64px; height: 30px; background: #6b7280; border-radius: 15px; position: relative; display: flex; align-items: center; justify-content: space-between; padding: 0 8px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2); transform: scale(0.7); transform-origin: left center; margin-right: -12px;">
                                        <i class="ph ph-robot"
                                            style="color: white; font-size: 16px; z-index: 2; opacity: 0;"></i>
                                        <i class="ph ph-user"
                                            style="color: white; font-size: 16px; z-index: 2; opacity: 1;"></i>
                                        <div
                                            style="position: absolute; top: 2px; left: 2px; transform: translateX(0px); width: 26px; height: 26px; background: white; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.3); z-index: 1;">
                                        </div>
                                    </div>
                                    <span><strong>Cinza:</strong> Humano no controle</span>
                                </div>
                            </div>
                        </div>
                    </div>`;

html = html.replace(regex, newHTML);
fs.writeFileSync('conversas.html', html);
console.log('Fixed hint visual');
