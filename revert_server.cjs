const fs = require('fs');

const originalServer = `import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' })); // Support large base64 images

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const nichePromptMap: Record<string, string> = {
  art: 'You are an elite Fine Art forensic appraiser. CRITICAL DIRECTIVE: Base analysis ONLY on visible evidence (brushstroke techniques, canvas age, framing, signatures). Do not invent provenance.',
  coins: 'You are a master Numismatist. CRITICAL DIRECTIVE: Output raw data only. Focus on mintage, die varieties, metal content, toning, and precise grading (Sheldon scale). If unsure, lower confidence score.',
  jewelry: 'You are a certified Gemologist. CRITICAL DIRECTIVE: Zero hallucinations. Focus exclusively on visible hallmarks, apparent cut/clarity, and precious metal indicators.',
  fashion: 'You are a luxury fashion authenticator. CRITICAL DIRECTIVE: Rely strictly on visual geometry—stitching, hardware, serial numbers, date codes, and fabric grain. Flag missing evidence.',
  furniture: 'You are an antique furniture specialist. CRITICAL DIRECTIVE: Analyze joinery, wood grain, maker marks, and patina. Do not assume designer names without hard visual evidence.',
  games: 'You are a vintage toy and game grader. CRITICAL DIRECTIVE: Grade purely on visible box condition, factory seals, and variants.',
  auto: 'You are a forensic general appraiser. CRITICAL DIRECTIVE: ZERO HALLUCINATIONS. Base all valuations and identification strictly on visible empirical evidence, market data, and maker marks.'
};

// 1. API: Item Scanner and Valuation Engine
const analyzeHandler = async (req: express.Request, res: express.Response) => {
  try {
    const { image, category, marks, condition, targetPlatforms, purchasePrice, assumptions } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'Image is required for analysis.' });
    }

    const base64Data = image.replace(/^data:image\\/\\w+;base64,/, '');

    const systemPrompt = nichePromptMap[category?.toLowerCase()] || nichePromptMap.auto;

    const textPrompt = \`Analyze this image using the strict parameters of a GOD-TIER FORENSIC APPRAISAL PIPELINE.
CRITICAL MANDATE: NO HYPE. RAW DATA ONLY. ZERO HALLUCINATIONS. EVIDENCE-BASED VALUATION.

Provided User Context:
- Known Marks/Identifiers: \${marks || 'None provided'}
- Stated Condition: \${condition || 'Unknown'}
- Target Platforms: \${targetPlatforms ? targetPlatforms.join(', ') : 'eBay'}
- Purchase Price: \${purchasePrice ? '\\$' + purchasePrice : 'Unknown'}

YOUR OBJECTIVE:
1. FORENSIC IDENTIFICATION: Identify the item using ONLY visible visual evidence. Do not guess. If you cannot see a brand, do not invent one.
2. EVIDENCE & MISSING DATA: Explicitly list what you CAN see (evidenceObserved) and what you CANNOT see but is required for 100% authentication (missingVerification).
3. EMPIRICAL PRICING: Provide strict, realistic high/low/expected auction comps. Account for current market saturation.
4. ACTIONABLE LISTING: Generate highly-optimized, SEO-dense listing copy for the target platforms based ONLY on the facts.

Do not use flowery language. Be highly analytical, skeptical, and precise.\`;

    let attempts = 0;
    const maxAttempts = 3;
    let result = null;
    let lastError = null;

    while (attempts < maxAttempts) {
      try {
        const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: {
        parts: [
          { text: textPrompt },
          { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }
        ]
      },
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2, // Lower temperature for more factual appraisals
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identification: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                brandOrMaker: { type: Type.STRING },
                modelOrEra: { type: Type.STRING },
                material: { type: Type.STRING }
              },
              required: ['title', 'brandOrMaker', 'modelOrEra', 'material']
            },
            likelyIdentification: { type: Type.STRING },
            identificationConfidence: { type: Type.INTEGER, description: '0 to 100' },
            confidenceLevel: { 
              type: Type.STRING,
              enum: ['High', 'Medium', 'Low']
            },
            evidenceObserved: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingVerification: { type: Type.ARRAY, items: { type: Type.STRING } },
            riskFlags: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { issue: { type: Type.STRING }, severity: { type: Type.STRING, enum: ['minor', 'moderate', 'severe'] } }, required: ['issue', 'severity'] } },
            researchRecommendation: { type: Type.STRING },
            comparableSearchTerms: { type: Type.ARRAY, items: { type: Type.STRING } },
            disclaimer: { type: Type.STRING },
            pricing: {
              type: Type.OBJECT,
              properties: {
                lowSale: { type: Type.NUMBER },
                expectedSale: { type: Type.NUMBER },
                highSale: { type: Type.NUMBER }
              },
              required: ['lowSale', 'expectedSale', 'highSale']
            },
            listingDraft: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                suggestedListingPrice: { type: Type.NUMBER },
                suggestedOfferFloor: { type: Type.NUMBER },
                suggestedShippingApproach: { type: Type.STRING },
                conditionDescription: { type: Type.STRING },
                shortDescription: { type: Type.STRING },
                itemSpecifics: { 
                  type: Type.ARRAY, 
                  items: {
                    type: Type.OBJECT,
                    properties: { key: { type: Type.STRING }, value: { type: Type.STRING } },
                    required: ['key', 'value']
                  }
                },
                
                recommendedMarketplaces: { type: Type.ARRAY, items: { type: Type.STRING } },
                marketplaces: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      platformSpecificTitle: { type: Type.STRING },
                      platformSpecificDescription: { type: Type.STRING },
                      suggestedPrice: { type: Type.NUMBER }
                    },
                    required: ['name', 'platformSpecificTitle', 'platformSpecificDescription', 'suggestedPrice']
                  }
                },
                stagingAdvice: {
                  type: Type.OBJECT,
                  properties: {
                    lighting: { type: Type.STRING },
                    background: { type: Type.STRING },
                    angles: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ['lighting', 'background', 'angles']
                },
                suggestedPhotoChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
                disclosureNotes: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: [
                'title', 'suggestedListingPrice', 'suggestedOfferFloor', 'suggestedShippingApproach',
                'conditionDescription', 'shortDescription', 'itemSpecifics', 'recommendedMarketplaces',
                'suggestedPhotoChecklist', 'disclosureNotes', 'marketplaces', 'stagingAdvice'
              ]
            }
          },
          required: [
            'identification', 'likelyIdentification', 'identificationConfidence', 'confidenceLevel',
            'evidenceObserved', 'missingVerification', 'riskFlags', 'researchRecommendation',
            'comparableSearchTerms', 'disclaimer', 'pricing', 'listingDraft'
          ]
        }
      }
    });

        let rawText = response.text || '';
        if (rawText.startsWith('\`\`\`json')) {
          rawText = rawText.replace(/\`\`\`json\\n?/, '').replace(/\`\`\`\\n?$/, '');
        }

        result = JSON.parse(rawText);
        break; // Success
      } catch (err) {
        lastError = err;
        attempts++;
        if (attempts >= maxAttempts) {
          throw err;
        }
        // Wait before retrying (exponential backoff)
        console.log(\`Retry attempt \${attempts} for appraisal...\`);
        await new Promise(resolve => setTimeout(resolve, 1500 * attempts));
      }
    }

    if (!result) {
      throw lastError || new Error('Failed to parse result.');
    }

    return res.json(result);
  } catch (err: any) {
    let errorMessage = err.message || 'Failed to analyze item. Ensure your GEMINI_API_KEY is active.';
    
    // Try to parse the JSON error format from the SDK
    try {
      const parsed = JSON.parse(err.message);
      if (parsed.error && parsed.error.message) {
        errorMessage = parsed.error.message;
      }
    } catch (e) {
      // Not a JSON string
    }
    
    const isHighDemand = errorMessage.includes('503') || errorMessage.toLowerCase().includes('high demand') || errorMessage.includes('UNAVAILABLE');
    
    if (isHighDemand) {
      console.warn('Appraisal warning: Model is experiencing high demand (503). Handled gracefully.');
      errorMessage = 'The AI model is currently experiencing high demand. Please try again in a few moments.';
    } else {
      console.error('Appraisal error:', err);
    }

    return res.status(500).json({ error: errorMessage });
  }
};

app.post('/api/appraise', analyzeHandler);
app.post('/api/analyze', analyzeHandler);

// Serve static assets in development & production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(\`Server running on port \${PORT}\`);
  });
}

startServer();
`;

fs.writeFileSync('server.ts', originalServer);
