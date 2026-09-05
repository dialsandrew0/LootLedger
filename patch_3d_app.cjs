const fs = require('fs');

// Patch App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Logo 3D effect
app = app.replace(
  '<h1 className="font-display font-black text-2xl tracking-tight text-primary uppercase">Loot<span className="text-accent">Ledger</span></h1>',
  '<h1 className="font-display font-black text-3xl tracking-tight text-primary uppercase">Loot<span className="text-3d-pop ml-0.5">Ledger</span></h1>'
);

// Main scan button
app = app.replace(
  /className="[^"]*bg-accent active:bg-blue-700 text-primary[^"]*"/g,
  'className="w-full py-5 rounded-xl font-display text-lg font-black flex items-center justify-center gap-2 btn-3d-accent"'
);

// Generic buttons
app = app.replace(
  /className="[^"]*bg-accent text-primary font-bold rounded-lg hover:bg-accent-hover[^"]*"/g,
  'className="mt-6 px-6 py-2 rounded-lg btn-3d-accent uppercase tracking-wide"'
);

// Auth button
app = app.replace(
  /className="bg-accent text-accent-fg font-mono text-xs font-bold px-5 py-2 hover:bg-accent-hover transition-colors"/g,
  'className="btn-3d-accent font-mono text-xs px-5 py-2"'
);

// Results/Listing cards
app = app.replace(/className="bg-surface border border-subtle rounded-xl p-4/g, 'className="card-3d p-4');

fs.writeFileSync('src/App.tsx', app);

// Patch AnalyticsView
let analytics = fs.readFileSync('src/components/AnalyticsView.tsx', 'utf8');
analytics = analytics.replace(/className="text-2xl font-display font-black tracking-tight text-primary"/g, 'className="text-3xl font-display font-black tracking-tight text-3d-pop"');
analytics = analytics.replace(/className="bg-surface p-5 rounded-xl  border border-subtle/g, 'className="card-3d p-5');
analytics = analytics.replace(/className="bg-surface p-6 rounded-xl  border border-subtle"/g, 'className="card-3d p-6"');
fs.writeFileSync('src/components/AnalyticsView.tsx', analytics);

// Patch InventoryView
let inventory = fs.readFileSync('src/components/InventoryView.tsx', 'utf8');
inventory = inventory.replace(/className="bg-surface p-4 rounded-xl border border-subtle/g, 'className="card-3d p-4');
// Big KPI numbers in inventory
inventory = inventory.replace(
  /<p className="text-2xl font-display font-black tracking-tight text-primary"/g, 
  '<p className="text-3xl font-display font-black tracking-tight text-3d-pop mt-1"'
);
inventory = inventory.replace(
  /<p className="text-2xl font-display font-black tracking-tight text-emerald-600"/g, 
  '<p className="text-3xl font-display font-black tracking-tight text-3d-pop mt-1"'
);
fs.writeFileSync('src/components/InventoryView.tsx', inventory);

// Patch FieldDecisionCard
let fdc = fs.readFileSync('src/components/FieldDecisionCard.tsx', 'utf8');
fdc = fdc.replace(/bg-surface border border-subtle rounded-xl/g, 'card-3d');
// Big price tag in field decision
fdc = fdc.replace(/text-4xl font-display font-black text-primary tracking-tight/g, 'text-5xl font-display font-black text-3d-pop tracking-tight');
// Buttons in FieldDecisionCard
fdc = fdc.replace(
  /className="flex-1 py-3 bg-accent text-accent-fg font-bold rounded-lg hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"/g,
  'className="flex-1 py-3 rounded-lg flex items-center justify-center gap-2 btn-3d-accent"'
);
fdc = fdc.replace(
  /className="flex-1 py-3 bg-surface border border-subtle text-primary font-bold rounded-lg hover:bg-surface-hover transition-colors flex items-center justify-center gap-2"/g,
  'className="flex-1 py-3 rounded-lg flex items-center justify-center gap-2 btn-3d-surface"'
);
fs.writeFileSync('src/components/FieldDecisionCard.tsx', fdc);

// Patch QuickCalculator
let qc = fs.readFileSync('src/components/QuickCalculator.tsx', 'utf8');
qc = qc.replace(/bg-surface border border-subtle rounded-xl/g, 'card-3d');
qc = qc.replace(
  /className="w-full py-3 bg-accent text-accent-fg font-bold uppercase tracking-wide hover:bg-accent-hover transition-colors"/g,
  'className="w-full py-3 btn-3d-accent uppercase tracking-wide"'
);
// Fix the rounded-none border border-subtle I applied earlier to make it 3D now
qc = qc.replace(/rounded-none border border-subtle/g, 'card-3d');
fs.writeFileSync('src/components/QuickCalculator.tsx', qc);

// Patch ProfitAssumptionsEditor
let pae = fs.readFileSync('src/components/ProfitAssumptionsEditor.tsx', 'utf8');
pae = pae.replace(/rounded-none border border-subtle/g, 'card-3d');
fs.writeFileSync('src/components/ProfitAssumptionsEditor.tsx', pae);

console.log("Patched components with 3D Pop");
