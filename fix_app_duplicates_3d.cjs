const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// There might be some duplicate classes from the regex replace
app = app.replace(/className="[^"]*btn-3d-accent[^"]*"/g, (match) => {
    // If it has multiple rounded-lg or btn-3d-accent, clean it up
    let classes = match.split('"')[1].split(' ');
    classes = [...new Set(classes)]; // remove duplicates
    return `className="${classes.join(' ')}"`;
});

fs.writeFileSync('src/App.tsx', app);
