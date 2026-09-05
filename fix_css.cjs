const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace(/@apply border-strong;/g, 'border-color: var(--color-border-hover);');
fs.writeFileSync('src/index.css', css);
