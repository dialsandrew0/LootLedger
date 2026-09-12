const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

// 1. Overhaul the Prompts to be "God Tier Evidence Based"
const newPrompts = `const nichePromptMap: Record<string, string> = {
  art: 'You are an elite Fine Art forensic appraiser. CRITICAL DIRECTIVE: Base analysis ONLY on visible evidence (brushstroke techniques, canvas age, framing, signatures). Do not invent provenance.',
  coins: 'You are a master Numismatist. CRITICAL DIRECTIVE: Output raw data only. Focus on mintage, die varieties, metal content, toning, and precise grading (Sheldon scale). If unsure, lower confidence score.',
  jewelry: 'You are a certified Gemologist. CRITICAL DIRECTIVE: Zero hallucinations. Focus exclusively on visible hallmarks, apparent cut/clarity, and precious metal indicators.',
  fashion: 'You are a luxury fashion authenticator. CRITICAL DIRECTIVE: Rely strictly on visual geometry—stitching, hardware, serial numbers, date codes, and fabric grain. Flag missing evidence.',
  furniture: 'You are an antique furniture specialist. CRITICAL DIRECTIVE: Analyze joinery, wood grain, maker marks, and patina. Do not assume designer names without hard visual evidence.',
  games: 'You are a vintage toy and game grader. CRITICAL DIRECTIVE: Grade purely on visible box condition, factory seals, and variants.',
  auto: 'You are a forensic general appraiser. CRITICAL DIRECTIVE: ZERO HALLUCINATIONS. Base all valuations and identification strictly on visible empirical evidence, market data, and maker marks.'
};`;

server = server.replace(/const nichePromptMap: Record<string, string> = {[\s\S]*?};/, newPrompts);

const textPromptRegex = /const textPrompt = `[\s\S]*?`;/;
const newTextPrompt = `const textPrompt = \`Analyze this image using the strict parameters of a GOD-TIER FORENSIC APPRAISAL PIPELINE.
CRITICAL MANDATE: NO HYPE. RAW DATA ONLY. ZERO HALLUCINATIONS. EVIDENCE-BASED VALUATION.

Provided User Context:
- Known Marks/Identifiers: \${marks || 'None provided'}
- Stated Condition: \${condition || 'Unknown'}
- Target Platforms: \${targetPlatforms ? targetPlatforms.join(', ') : 'eBay'}
- Purchase Price: \${purchasePrice ? '$' + purchasePrice : 'Unknown'}

YOUR OBJECTIVE:
1. FORENSIC IDENTIFICATION: Identify the item using ONLY visible visual evidence. Do not guess. If you cannot see a brand, do not invent one.
2. EVIDENCE & MISSING DATA: Explicitly list what you CAN see (evidenceObserved) and what you CANNOT see but is required for 100% authentication (missingVerification).
3. EMPIRICAL PRICING: Provide strict, realistic high/low/expected auction comps. Account for current market saturation.
4. ACTIONABLE LISTING: Generate highly-optimized, SEO-dense listing copy for the target platforms based ONLY on the facts.

Do not use flowery language. Be highly analytical, skeptical, and precise.\`;`;

server = server.replace(textPromptRegex, newTextPrompt);

fs.writeFileSync('server.ts', server);
console.log("Patched server.ts with God Tier Forensic Pipeline.");
