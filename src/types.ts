export interface ProfitAssumptions {
  marketplace: string;
  marketplaceFeePercent: number;
  paymentProcessingFeePercent: number;
  shippingChargedToBuyer: number;
  estimatedShippingCost: number;
  packingMaterialsCost: number;
  salesTaxPaidAtPurchase: number;
  desiredMinProfit: number;
  desiredMinROI: number;
}

export interface MarketplaceListing {
  name: string;
  platformSpecificTitle: string;
  platformSpecificDescription: string;
  suggestedPrice: number;
  fitScore: number;
  likelySalePrice: number;
  estimatedNet: number;
  shippingRecommendation: string;
  expectedTimeToSell: string;
  demandScore: number;
  effortScore: number;
  riskScore: number;
  whyThisPlatform: string;
  keywords: string[];
  conditionNotes: string;
  photoChecklist: string[];
}

export interface StagingAdvice {
  lighting: string;
  background: string;
  angles: string[];
  photoChecklist: string[];
}

export interface ListingDraft {
  title: string;
  suggestedListingPrice: number;
  suggestedOfferFloor: number;
  suggestedShippingApproach: string;
  conditionDescription: string;
  shortDescription: string;
  itemSpecifics: { key: string; value: string }[];
  marketplaces: MarketplaceListing[];
  stagingAdvice: StagingAdvice;
  disclosureNotes: string[];
}

export type RiskSeverity = 'minor' | 'moderate' | 'severe';
export type RiskCategory = 'authenticity' | 'condition' | 'demand' | 'shipping' | 'restricted' | 'fragile' | 'return' | 'saturation' | 'other';

export interface RiskFlag {
  issue: string;
  severity: RiskSeverity;
  category: RiskCategory;
}

export type DecisionType = 'BUY' | 'NEGOTIATE' | 'HOLD FOR RESEARCH' | 'LIST NOW' | 'BUNDLE' | 'RELIST' | 'MARK DOWN' | 'PASS';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';
export type SellThroughSpeed = 'Fast' | 'Medium' | 'Slow';

export interface FieldDecision {
  action?: 'BUY' | 'PASS' | 'NEGOTIATE' | 'RESEARCH FURTHER';
  verdict?: 'BUY' | 'PASS' | 'NEGOTIATE' | 'RESEARCH FURTHER';
  recommendation: DecisionType;
  reasoning: string;
  maxAcquisitionPrice: number;
  targetAcquisitionPrice: number;
  expectedResaleRange: [number, number];
  projectedNet: number;
  sellThroughSpeed: SellThroughSpeed;
  confidenceLevel: ConfidenceLevel;
  confidenceExplanation: string;
  riskFlags: RiskFlag[];
  nextBestAction: string;
}

export interface ValuationResult {
  identification: {
    title: string;
    brandOrMaker: string;
    modelOrEra: string;
    material: string;
  };
  likelyIdentification: string;
  identificationConfidence: number;
  evidenceObserved: string[];
  missingVerification: string[];
  researchRecommendation: string;
  comparableSearchTerms: string[];
  disclaimer: string;
  
  pricing: {
    lowSale: number;
    expectedSale: number;
    highSale: number;
  };
  
  decision: FieldDecision;
  listingDraft: ListingDraft;
}

export type InventoryStatus = 'Needs Research' | 'Needs Photos' | 'Ready to List' | 'Draft Ready' | 'Listed' | 'Offer Received' | 'Sold' | 'Needs Relist' | 'Bundle Candidate' | 'Markdown Candidate' | 'Passed';

export type PlatformStatus = 'Draft' | 'Copied' | 'Posted' | 'Edited' | 'Sold' | 'Not Suitable';

export interface ActivityEvent {
  date: string;
  action: string;
  details?: string;
}

export interface InventoryItem {
  userId?: string;
  id: string;
  createdAt: string;
  updatedAt: string;
  status: InventoryStatus;
  title: string;
  likelyIdentification: string;
  category: string;
  condition: string;
  purchasePrice: number;
  image?: string;
  marks: string;
  notes: string;
  
  lowEstimate: number;
  expectedEstimate: number;
  highEstimate: number;
  expectedNetProfit: number;
  expectedROI: number;
  
  decision: FieldDecision;
  
  evidenceObserved: string[];
  missingVerification: string[];
  comparableSearchTerms: string[];
  researchRecommendation: string;
  disclaimer: string;
  assumptions: ProfitAssumptions;
  
  listingDraft?: ListingDraft;
  
  platformStatuses: Record<string, PlatformStatus>;
  platformUrls: Record<string, string>;
  activityTimeline: ActivityEvent[];
  
  // User overrides for estimates
  manualLowEstimate?: number;
  manualExpectedEstimate?: number;
  manualHighEstimate?: number;
}

export type NavItem = 'Scan' | 'Results' | 'Listing' | 'Inventory' | 'Analytics';
