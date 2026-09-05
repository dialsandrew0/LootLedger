const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const additionalCSS = `
  /* 3D and Outline Utilities */
  .text-outline-accent {
    color: var(--color-canvas);
    -webkit-text-stroke: 1.5px var(--color-accent);
  }
  
  .text-outline-primary {
    color: transparent;
    -webkit-text-stroke: 1px var(--color-primary);
  }
  
  .text-3d-pop {
    color: var(--color-canvas);
    -webkit-text-stroke: 1.5px var(--color-accent);
    text-shadow: 4px 4px 0px #050505;
  }
  
  .shadow-3d {
    box-shadow: 4px 4px 0px #050505;
  }
  
  .shadow-3d-accent {
    box-shadow: 4px 4px 0px var(--color-accent);
  }
  
  .btn-3d-accent {
    @apply bg-accent text-accent-fg font-bold border border-transparent transition-all;
    box-shadow: 4px 4px 0px #050505;
  }
  .btn-3d-accent:hover {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0px #050505;
  }
  .btn-3d-accent:active {
    transform: translate(2px, 2px);
    box-shadow: 0px 0px 0px #050505;
  }
  
  .btn-3d-surface {
    @apply bg-surface text-primary font-bold border border-subtle transition-all;
    box-shadow: 4px 4px 0px #050505;
  }
  .btn-3d-surface:hover {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0px #050505;
    @apply border-strong;
  }
  .btn-3d-surface:active {
    transform: translate(2px, 2px);
    box-shadow: 0px 0px 0px #050505;
  }
  
  .card-3d {
    @apply bg-surface border border-subtle rounded-xl transition-all;
    box-shadow: 6px 6px 0px #050505;
  }
  .card-3d:hover {
    transform: translate(-2px, -2px);
    box-shadow: 8px 8px 0px #050505;
    @apply border-strong;
  }
`;

css = css.replace('.panel-inner {', additionalCSS + '\n  .panel-inner {');
fs.writeFileSync('src/index.css', css);
console.log("Updated index.css with 3D styles");
