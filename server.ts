import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
app.use(express.json({ limit: '50mb' })); // Allow large image payloads
const PORT = 3000;

let _aiClient: GoogleGenAI | null = null;
const getAIClient = () => {
  if (!_aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is required to start the engine.');
    }
    _aiClient = new GoogleGenAI({ apiKey: key });
  }
  return _aiClient;
};

// Auto-map domains for prompting
const nichePromptMap: Record<string, string> = {
  art: 'You are an elite Fine Art appraiser. Focus on brushstroke techniques, canvas age, framing, signatures, and provenance.',
  coins: 'You are a master Numismatist. Focus on mintage, die varieties, metal content, toning, and precise grading (Sheldon scale).',
  jewelry: 'You are a certified Gemologist and horologist. Focus on hallmarks, carat weight, cut, clarity, and precious metal purity.',
  fashion: 'You are a luxury fashion authenticator. Focus on stitching, hardware, serial numbers, date codes, and fabric quality.',
  furniture: 'You are an antique and MCM furniture specialist. Focus on joinery, wood types, designer labels, and patina.',
  games: 'You are a vintage toy and game grader. Focus on box condition, factory seals, region variants, and completeness.',
  auto: 'You are an expert appraiser across all categories. Focus on condition, market demand, historical context, and maker marks.'
};

// 1. API: Item Scanner and Valuation Engine
const analyzeHandler = async (req: express.Request, res: express.Response) => {
  try {
    const { image, category, marks, condition, targetPlatforms, purchasePrice, assumptions } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'Image is required for analysis.' });
    }

    const ai = getAIClient();
    
    // Extract base64 part
    const base64Data = image.split(',')[1];
    if (!base64Data) {
      return res.status(400).json({ error: 'Invalid image format.' });
    }

    const systemPrompt = nichePromptMap[category?.toLowerCase()] || nichePromptMap.auto;
    
    
    const textPrompt = `
Analyze the provided item image and return a highly detailed, professional resale appraisal.

User-provided context:
- Requested Category: ${category || 'Auto-detect'}
- Known Marks/Tags: ${marks || 'None'}
- Condition: ${condition || 'Used'}
- Purchase Price: ${purchasePrice || 0}
- Financial Assumptions: ${assumptions ? JSON.stringify(assumptions) : 'None'}

Provide a brutally honest field decision. If the user's Purchase Price plus assumed costs ruins the profit margin, recommend PASS or NEGOTIATE. If the user's purchase price is 0, assume they are asking how much they *should* pay (provide maxAcquisitionPrice and targetAcquisitionPrice).

Guidelines:
- If the item is clearly a reproduction, state it plainly and adjust the estimate.
- Identify the specific model, era, and material.
- Note any visible damage, wear, or missing parts.
- List specific evidence observed that led to your conclusion.
- List what is missing that would be needed for 100% verification (e.g., "Need to see the movement", "Need tag photo").
- Provide 3-5 search terms the user can copy-paste into eBay sold listings to find comps.
- Make estimates realistic for resale after ordinary condition and selling friction.
- Favor "Research Further" over false confidence.
- Use this exact disclaimer string: "Estimate only. Verify markings, authenticity, condition, sold comps, and shipping costs before buying."
- For the 'marketplaces' array, provide tailored listings for EACH of these specific platforms requested by the user: ${targetPlatforms ? targetPlatforms.join(', ') : 'eBay, Facebook Marketplace, Mercari, Poshmark, Etsy'} (e.g., eBay, Mercari). Adjust the title and description to fit that specific platform's audience and SEO style.
- For 'stagingAdvice', provide specific photography and lighting setup instructions based on the material, color, and type of item identified, as well as necessary angles to photograph to prove authenticity or show condition. Include a photoChecklist with required/recommended photo types (e.g., hero shot, full front, full back, label/tag, size marker, model/serial number, maker's mark, sole/bottom, clasp/closure, packaging, flaw close-up, measurement proof, scale reference).
- Provide a 'decision' object that summarizes the single best field decision (BUY, NEGOTIATE, HOLD FOR RESEARCH, LIST NOW, BUNDLE, RELIST, MARK DOWN, PASS). Be highly analytical. Provide realistic prices and scores.
`;
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
        if (rawText.startsWith('```json')) {
          rawText = rawText.replace(/```json\n?/, '').replace(/```\n?$/, '');
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
        console.log(`Retry attempt ${attempts} for appraisal...`);
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
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
