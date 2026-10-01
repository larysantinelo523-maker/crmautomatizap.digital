const fs = require('fs');

let css = fs.readFileSync('style.css', 'utf8');

// Default is Robô ativo (Checked)
// Make the ball transform to right (translateX(34px)) instead of left.
// Wait, when ON, standard toggles are ON THE RIGHT!
// And when OFF, standard toggles are ON THE LEFT!

// Right now, default (ON) has NO transform, so it's on the left.
// And :not(:checked) (OFF) has transform: translateX(34px), so it's on the right.

// Let's swap this!
// Find default ball position:
css = css.replace('.bot-switch-label .bot-switch-ball {\r\n    position: absolute;\r\n    top: 2px;\r\n    left: 2px;', 
'.bot-switch-label .bot-switch-ball {\r\n    position: absolute;\r\n    top: 2px;\r\n    left: 2px;\r\n    transform: translateX(34px);');

// Find :not(:checked) ball position and set it to 0
css = css.replace('.bot-switch-input:not(:checked)+.bot-switch-label .bot-switch-ball {\r\n    transform: translateX(34px);\r\n}', 
'.bot-switch-input:not(:checked)+.bot-switch-label .bot-switch-ball {\r\n    transform: translateX(0px);\r\n}');

fs.writeFileSync('style.css', css);
console.log('Fixed toggle logic.');
