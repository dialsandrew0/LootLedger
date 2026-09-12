import { 
  ProfitAssumptions, 
  RiskFlag, 
  ResearchConfidenceBreakdown, 
  AuthenticityRiskBreakdown, 
  BuyCeilingBreakdown, 
  GateEvaluation,
  DecisionType
} from '../types';

export function calculateFinancials(
  purchasePrice: number,
  expectedSalePrice: number,
  assumptions: ProfitAssumptions
) {
  const isCostProvided = typeof purchasePrice === 'number' && purchasePrice > 0;
  const acquisitionCost = isCostProvided ? purchasePrice : 0;
  const sellingFeesPercent = (assumptions.marketplaceFeePercent + assumptions.paymentProcessingFeePercent) / 100;
  const grossRevenue = expectedSalePrice + assumptions.shippingChargedToBuyer;
  const sellingFees = grossRevenue * sellingFeesPercent;
  const shippingAllowance = assumptions.estimatedShippingCost;
  const packagingAllowance = assumptions.packingMaterialsCost;
  const otherCosts = assumptions.salesTaxPaidAtPurchase;
  
  // netProfit = expectedSalePrice - acquisitionCost - sellingFees - shippingAllowance - packagingAllowance - otherCosts
  const netProfit = grossRevenue - acquisitionCost - sellingFees - shippingAllowance - packagingAllowance - otherCosts;
  
  const totalCost = acquisitionCost + otherCosts + shippingAllowance + packagingAllowance;
  const roi = isCostProvided && totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
  
  return {
    totalCost,
    grossRevenue,
    marketplaceFee: grossRevenue * (assumptions.marketplaceFeePercent / 100),
    paymentProcessingFee: grossRevenue * (assumptions.paymentProcessingFeePercent / 100),
    sellingFees,
    shippingAllowance,
    packagingAllowance,
    otherCosts,
    netProfit,
    roi,
    isCostProvided
  };
}

// Research Confidence Formula: C = 0.30I + 0.25E + 0.20Q + 0.15K + 0.10V
export function calculateResearchConfidence(
  identityConfidence: number, // I: 0-100
  marketEvidenceQuality: number, // E: 0-100
  photoConditionQuality: number, // Q: 0-100
  categoryKnowledge: number, // K: 0-100
  verificationCompleteness: number // V: 0-100
): ResearchConfidenceBreakdown {
  const I = Math.min(100, Math.max(0, identityConfidence));
  const E = Math.min(100, Math.max(0, marketEvidenceQuality));
  const Q = Math.min(100, Math.max(0, photoConditionQuality));
  const K = Math.min(100, Math.max(0, categoryKnowledge));
  const V = Math.min(100, Math.max(0, verificationCompleteness));

  const overall = Math.round(0.30 * I + 0.25 * E + 0.20 * Q + 0.15 * K + 0.10 * V);
  
  let rating: 'High Confidence' | 'Moderate' | 'Low (Research Further)' = 'Moderate';
  if (overall >= 75) {
    rating = 'High Confidence';
  } else if (overall < 60) {
    rating = 'Low (Research Further)';
  }

  return {
    overall,
    identityConfidence: I,
    marketEvidenceQuality: E,
    photoConditionQuality: Q,
    categoryKnowledge: K,
    verificationCompleteness: V,
    rating,
    formula: `C = 0.30(${I}) + 0.25(${E}) + 0.20(${Q}) + 0.15(${K}) + 0.10(${V}) = ${overall}%`
  };
}

// Authenticity Risk Formula: A = 0.35B + 0.25S + 0.20M + 0.20D
export function calculateAuthenticityRisk(
  brandCategoryExposure: number, // B: 0-100
  serialHallmarkUncertainty: number, // S: 0-100
  traitMismatch: number, // M: 0-100
  provenanceDocumentationGap: number // D: 0-100
): AuthenticityRiskBreakdown {
  const B = Math.min(100, Math.max(0, brandCategoryExposure));
  const S = Math.min(100, Math.max(0, serialHallmarkUncertainty));
  const M = Math.min(100, Math.max(0, traitMismatch));
  const D = Math.min(100, Math.max(0, provenanceDocumentationGap));

  const overall = Math.round(0.35 * B + 0.25 * S + 0.20 * M + 0.20 * D);
  
  let rating: 'Low Risk' | 'Moderate Exposure' | 'High Risk (Authentication Review Required)' = 'Low Risk';
  if (overall >= 60) {
    rating = 'High Risk (Authentication Review Required)';
  } else if (overall >= 35) {
    rating = 'Moderate Exposure';
  }

  return {
    overall,
    brandCategoryExposure: B,
    serialHallmarkUncertainty: S,
    traitMismatch: M,
    provenanceDocumentationGap: D,
    rating,
    formula: `A = 0.35(${B}) + 0.25(${S}) + 0.20(${M}) + 0.20(${D}) = ${overall}%`,
    isCounterfeitProneBrand: B >= 65
  };
}

// Conservative Buy Ceiling Formula:
// MaxBuy = (ConservativeExpectedSale * (1 - fees)) - shipping - returnsReserve - prepCost - targetProfit - uncertaintyReserve
export function calculateConservativeBuyCeiling(
  conservativeExpectedSale: number,
  assumptions: ProfitAssumptions,
  researchConfidence: number, // 0-100
  authenticityRisk: number, // 0-100
  isCompSparse: boolean = false,
  isHighReturnRisk: boolean = false
): BuyCeilingBreakdown {
  const sale = Math.max(0, conservativeExpectedSale);
  const totalFeePercent = (assumptions.marketplaceFeePercent + assumptions.paymentProcessingFeePercent) / 100;
  const estimatedFees = Number((sale * totalFeePercent).toFixed(2));
  const shipping = assumptions.estimatedShippingCost;
  const returnsReserve = Number((sale * (isHighReturnRisk ? 0.06 : 0.03)).toFixed(2));
  const prepCost = assumptions.packingMaterialsCost + (authenticityRisk >= 60 ? 15 : 0); // Include authentication/cleaning buffer
  const targetProfit = Math.max(assumptions.desiredMinProfit, Number((sale * (assumptions.desiredMinROI / 100)).toFixed(2)));

  // uncertaintyReserve scales with low confidence, high authenticity risk, and sparse comps
  const confidencePenalty = 0.30 * (1 - researchConfidence / 100);
  const authenticityPenalty = 0.35 * (authenticityRisk / 100);
  const compPenalty = isCompSparse ? 0.10 : 0;
  const baseUncertainty = 0.05;

  const uncertaintyFactor = Math.min(0.65, baseUncertainty + confidencePenalty + authenticityPenalty + compPenalty);
  const uncertaintyReserve = Number((sale * uncertaintyFactor).toFixed(2));

  const rawMaxBuy = sale - estimatedFees - shipping - returnsReserve - prepCost - targetProfit - uncertaintyReserve;
  const maxBuyPrice = Number(Math.max(0, rawMaxBuy).toFixed(2));

  return {
    conservativeExpectedSale: sale,
    estimatedFees,
    shipping,
    returnsReserve,
    prepCost,
    targetProfit,
    uncertaintyReserve,
    maxBuyPrice,
    formula: `MaxBuy = $${sale} - fees($${estimatedFees}) - ship($${shipping}) - returns($${returnsReserve}) - prep($${prepCost}) - profit($${targetProfit}) - uncertaintyReserve($${uncertaintyReserve}) = $${maxBuyPrice}`
  };
}

export function determineVerdict(
  netProfit: number, 
  roi: number, 
  researchConfidence: ResearchConfidenceBreakdown,
  authenticityRisk: AuthenticityRiskBreakdown,
  riskFlags: RiskFlag[], 
  missingVerification: string[],
  assumptions: ProfitAssumptions,
  purchasePrice: number = 0,
  expectedSalePrice: number = 0,
  maxBuyPrice: number = 0
): { 
  verdict: DecisionType; 
  reason: string;
  isConditional: boolean;
  requiresCertifiedAuthentication: boolean;
  researchHold: boolean;
} {
  const isHighAuthRisk = authenticityRisk.overall >= 60 || authenticityRisk.isCounterfeitProneBrand;
  const isLowConfidence = researchConfidence.overall < 60;
  const hasSevereConditionRisk = riskFlags.some(r => r.severity === 'severe');
  const hasMissingProofs = missingVerification.length > 0;
  const isCostProvided = typeof purchasePrice === 'number' && purchasePrice > 0;

  // 1. Critical Authenticity / Counterfeit Exposure Block
  if (isHighAuthRisk && hasMissingProofs) {
    return {
      verdict: 'HOLD FOR AUTHENTICATION',
      reason: `High counterfeit exposure (${authenticityRisk.overall}% risk) with missing interior/serial verification proofs. Certified physical authentication required prior to acquisition or resale.`,
      isConditional: true,
      requiresCertifiedAuthentication: true,
      researchHold: true
    };
  }

  // 2. High Authenticity Risk without documentation
  if (isHighAuthRisk) {
    return {
      verdict: 'HOLD FOR AUTHENTICATION',
      reason: `High-risk designer or precious hallmark item (${authenticityRisk.overall}% authenticity risk). Requires third-party authentication or physical inspection.`,
      isConditional: true,
      requiresCertifiedAuthentication: true,
      researchHold: true
    };
  }

  // 3. Severe condition or missing verification hold
  if (isLowConfidence || hasMissingProofs || hasSevereConditionRisk) {
    return {
      verdict: 'RESEARCH FURTHER',
      reason: `Research confidence is limited (${researchConfidence.overall}%). Additional photo evidence or model verification required to confirm valuation.`,
      isConditional: true,
      requiresCertifiedAuthentication: false,
      researchHold: true
    };
  }

  // 4. Scenario A: Acquisition Cost is NOT provided (Field Pre-Purchase Appraisal)
  if (!isCostProvided) {
    if (maxBuyPrice <= 0) {
      return {
        verdict: 'PASS',
        reason: `Expected sale price ($${expectedSalePrice.toFixed(2)}) is insufficient to cover platform fees, shipping, packaging, and minimum profit targets.`,
        isConditional: false,
        requiresCertifiedAuthentication: false,
        researchHold: false
      };
    }

    if (authenticityRisk.overall >= 35 || researchConfidence.overall < 75) {
      return {
        verdict: 'CONDITIONAL BUY',
        reason: `Viable flip potential. Maximum recommended buy price is $${maxBuyPrice.toFixed(2)}. Conditional on physical confirmation of marks and condition in person.`,
        isConditional: true,
        requiresCertifiedAuthentication: false,
        researchHold: false
      };
    }

    return {
      verdict: 'BUY',
      reason: `Strong resale opportunity. Conservative buy ceiling is $${maxBuyPrice.toFixed(2)} to achieve your $${assumptions.desiredMinProfit} target profit.`,
      isConditional: false,
      requiresCertifiedAuthentication: false,
      researchHold: false
    };
  }

  // 5. Scenario B: Cost IS provided - check ceilings and negotiation opportunities
  if (purchasePrice > maxBuyPrice) {
    if (netProfit > 0 && purchasePrice <= maxBuyPrice * 1.4) {
      return {
        verdict: 'NEGOTIATE',
        reason: `Asking cost ($${purchasePrice.toFixed(2)}) exceeds conservative buy ceiling ($${maxBuyPrice.toFixed(2)}). Counter-offer at or below $${maxBuyPrice.toFixed(2)} to lock in minimum target margin.`,
        isConditional: true,
        requiresCertifiedAuthentication: false,
        researchHold: false
      };
    }

    return { 
      verdict: 'PASS', 
      reason: `Asking cost ($${purchasePrice.toFixed(2)}) is well above the safe buy ceiling of $${maxBuyPrice.toFixed(2)}. Projected net is -$${Math.abs(netProfit).toFixed(2)}.`,
      isConditional: false,
      requiresCertifiedAuthentication: false,
      researchHold: false
    };
  }

  // 6. Financial Threshold Failure
  const failsThresholds = netProfit < assumptions.desiredMinProfit || roi < assumptions.desiredMinROI;
  if (failsThresholds) {
    if (netProfit > 0 && (netProfit >= assumptions.desiredMinProfit * 0.7 || roi >= assumptions.desiredMinROI * 0.7)) {
      return {
        verdict: 'NEGOTIATE',
        reason: `Projected net profit ($${netProfit.toFixed(2)}) or ROI (${roi.toFixed(1)}%) is close to target ($${assumptions.desiredMinProfit} / ${assumptions.desiredMinROI}%). Negotiate purchase price down toward $${maxBuyPrice.toFixed(2)}.`,
        isConditional: true,
        requiresCertifiedAuthentication: false,
        researchHold: false
      };
    }

    return { 
      verdict: 'PASS', 
      reason: `Projected net profit ($${netProfit.toFixed(2)}) or ROI (${roi.toFixed(1)}%) does not meet minimum thresholds ($${assumptions.desiredMinProfit} profit, ${assumptions.desiredMinROI}% ROI).`,
      isConditional: false,
      requiresCertifiedAuthentication: false,
      researchHold: false
    };
  }

  // 7. Moderate Authenticity or Evidence uncertainty -> Conditional Buy
  if (authenticityRisk.overall >= 35 || researchConfidence.overall < 75) {
    return {
      verdict: 'CONDITIONAL BUY',
      reason: `Meets margin thresholds ($${netProfit.toFixed(2)} projected net, ${roi.toFixed(1)}% ROI), but conditional on physical verification of markings, wear, and hardware details.`,
      isConditional: true,
      requiresCertifiedAuthentication: false,
      researchHold: false
    };
  }

  // 8. Verified Firm Buy
  return { 
    verdict: 'BUY', 
    reason: `Strong research confidence (${researchConfidence.overall}%) and safe margins ($${netProfit.toFixed(2)} net, ${roi.toFixed(1)}% ROI). Meets profit targets with comfortable headroom.`,
    isConditional: false,
    requiresCertifiedAuthentication: false,
    researchHold: false
  };
}
