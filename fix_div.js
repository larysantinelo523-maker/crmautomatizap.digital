const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

// I will look for the specific block of lines 294-297
const target = `                            </div>\r\n                        </div>\r\n                    </div>\r\n                    </div>`;
const replacement = `                            </div>\r\n                        </div>\r\n                    </div>`;

const targetLF = `                            </div>\n                        </div>\n                    </div>\n                    </div>`;
const replacementLF = `                            </div>\n                        </div>\n                    </div>`;

if (html.includes(target)) {
    html = html.replace(target, replacement);
    console.log("Fixed CRLF");
} else if (html.includes(targetLF)) {
    html = html.replace(targetLF, replacementLF);
    console.log("Fixed LF");
} else {
    // If exact match fails, use regex
    const regex = /<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<div class="card chat-card"/;
    const regexReplacement = `</div>\n                        </div>\n                    </div>\n\n                                        <div class="card chat-card"`;
    if (regex.test(html)) {
        html = html.replace(regex, regexReplacement);
        console.log("Fixed Regex");
    } else {
        console.log("Could not find the exact pattern.");
    }
}

fs.writeFileSync('conversas.html', html);
