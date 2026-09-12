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

export type DecisionType = 'BUY' | 'CONDITIONAL BUY' | 'RESEARCH FURTHER' | 'HOLD FOR AUTHENTICATION' | 'NEGOTIATE' | 'LIST NOW' | 'PASS';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';
export type SellThroughSpeed = 'Fast' | 'Medium' | 'Slow';

export interface ResearchConfidenceBreakdown {
  overall: number; // 0 - 100
  identityConfidence: number; // I (weight 0.30)
  marketEvidenceQuality: number; // E (weight 0.25)
  photoConditionQuality: number; // Q (weight 0.20)
  categoryKnowledge: number; // K (weight 0.15)
  verificationCompleteness: number; // V (weight 0.10)
  rating: 'High Confidence' | 'Moderate' | 'Low (Research Further)';
  formula: string;
}

export interface AuthenticityRiskBreakdown {
  overall: number; // 0 - 100
  brandCategoryExposure: number; // B (weight 0.35)
  serialHallmarkUncertainty: number; // S (weight 0.25)
  traitMismatch: number; // M (weight 0.20)
  provenanceDocumentationGap: number; // D (weight 0.20)
  rating: 'Low Risk' | 'Moderate Exposure' | 'High Risk (Authentication Review Required)';
  formula: string;
  isCounterfeitProneBrand: boolean;
}

export interface GateEvaluation {
  authenticityGate: {
    status: 'PASSED' | 'REVIEW_REQUIRED' | 'FAIL_CRITICAL';
    reason: string;
    riskExposure: number;
  };
  identityGate: {
    status: 'CONFIRMED' | 'APPROXIMATE' | 'UNKNOWN';
    reason: string;
    identityScore: number;
  };
  conditionGate: {
    status: 'VERIFIED' | 'AMBIGUOUS' | 'DAMAGED';
    reason: string;
    conditionScore: number;
  };
  marketEvidenceGate: {
    status: 'HIGH_DENSITY' | 'MODERATE' | 'SPARSE_SPECULATIVE';
    reason: string;
    compScore: number;
  };
  financialExposureGate: {
    status: 'LOW_RISK' | 'MODERATE' | 'HIGH_EXPOSURE';
    reason: string;
    capitalAtRisk: number;
  };
  policyGate: {
    status: 'CLEAR' | 'RESTRICTED';
    reason: string;
  };
}

export interface BuyCeilingBreakdown {
  conservativeExpectedSale: number;
  estimatedFees: number;
  shipping: number;
  returnsReserve: number;
  prepCost: number;
  targetProfit: number;
  uncertaintyReserve: number;
  maxBuyPrice: number;
  formula: string;
}

export interface CompEvidenceItem {
  query: string;
  source: string;
  recency: string;
  comparabilityGrade: 'Direct Match' | 'Close Model' | 'Category Baseline';
  notes: string;
}

export interface MarketCompEvidence {
  compQueries: CompEvidenceItem[];
  compCountEstimate: string;
  compQualityGrade: 'A' | 'B' | 'C' | 'D';
  evidenceSufficiency: 'Sufficient' | 'Sparse / Speculative' | 'Missing Direct Comps';
  isLiveDatabaseIngested: boolean;
  compDisclaimer: string;
}

export type PipelineLane = 
  | 'AUTHENTICATION_FORENSIC_LANE'
  | 'EMPIRICAL_COMPS_LANE'
  | 'RESEARCH_HOLD_REQUEST_EVIDENCE_LANE'
  | 'COMMODITY_FAST_LANE';

export interface PipelineRouting {
  lane: PipelineLane;
  laneTitle: string;
  modelUsed: string;
  costProfile: string;
  rationale: string;
  gatesTriggered: string[];
  escalationTriggered: boolean;
}

export interface ExtractedIdentifiers {
  category: string;
  categoryConfidence: number;
  brand: {
    name: string;
    confidence: number;
    isCounterfeitProne: boolean;
  };
  modelOrStyle: {
    name: string;
    styleCode?: string;
    confidence: number;
  };
  colorAndMaterials: {
    description: string;
    confidence: number;
  };
  visibleMarks: {
    text: string;
    confidence: number;
    isHallmarkOrSerial: boolean;
  };
  visibleCondition: {
    summary: string;
    confidence: number;
  };
  imageQuality: 'Good' | 'Fair' | 'Poor' | 'Critical Angles Missing';
  missingCriticalProofs: string[];
}

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
  buyCeiling?: BuyCeilingBreakdown;
  isConditional?: boolean;
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
  modelUsed?: string;
  routingReason?: string;
  engineTier?: string;

  // Multi-stage pipeline models
  isConditionalEstimate: boolean;
  requiresCertifiedAuthentication: boolean;
  researchHold: boolean;
  researchConfidence: ResearchConfidenceBreakdown;
  authenticityRisk: AuthenticityRiskBreakdown;
  gateEvaluation: GateEvaluation;
  buyCeiling: BuyCeilingBreakdown;
  compEvidence: MarketCompEvidence;
  pipelineRouting: PipelineRouting;
  extractedIdentifiers?: ExtractedIdentifiers;
  
  pipeline?: {
    riskScore: number;
    tierName: string;
    costProfile: string;
    executionReason: string;
    modelDeployed: string;
    escalationTriggered: boolean;
    algorithmFormula: string;
  };

  analysisTimestamp?: string;
  appraisalVersion?: string;
  requestId?: string;
  legalDisclaimer?: string;
}

export type InventoryStatus = 'Needs Research' | 'Needs Photos' | 'Ready to List' | 'Draft Ready' | 'Listed' | 'Offer Received' | 'Sold' | 'Needs Relist' | 'Bundle Candidate' | 'Markdown Candidate' | 'Passed' | 'Watchlist' | 'Reconsider';

export type PlatformStatus = 'Draft' | 'Copied' | 'Posted' | 'Edited' | 'Sold' | 'Not Suitable';

export interface SavedAppraisal {
  id: string;
  timestamp: string;
  image?: string;
  title: string;
  purchasePrice: number;
  expectedSale: number;
  lowSale: number;
  highSale: number;
  netProfit: number;
  roi: number;
  verdict: DecisionType;
  confidence: number;
  authenticityRisk: number;
  category?: string;
  isWatchlist?: boolean;
  result: ValuationResult;
}

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
  tags?: string[];
  location?: string;
  
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

export interface UserPreferences {
  defaultMarketplace: string;
  defaultFeePercent: number;
  defaultPackingCost: number;
  desiredMinProfit: number;
  desiredMinROI: number;
  autoOptimizePhotos: boolean;
  supportedPlatforms: string[];
}

export type NavItem = 'Scan' | 'Results' | 'Listing' | 'Inventory' | 'Analytics' | 'Settings';
