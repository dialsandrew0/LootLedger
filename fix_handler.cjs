const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

const brokenSectionRegex = /const textPrompt = `Analyze this image[\s\S]*?let attempts = 0;/;

const fixedSection = `const textPrompt = \`Analyze this image using the strict parameters of a GOD-TIER FORENSIC APPRAISAL PIPELINE.
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

Do not use flowery language. Be highly analytical, skeptical, and precise.\`;

    let attempts = 0;`;

server = server.replace(brokenSectionRegex, fixedSection);
fs.writeFileSync('server.ts', server);
