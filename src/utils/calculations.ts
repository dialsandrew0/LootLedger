import { ProfitAssumptions, RiskFlag } from '../types';

export function calculateFinancials(
  purchasePrice: number,
  expectedSalePrice: number,
  assumptions: ProfitAssumptions
) {
  const totalCost = purchasePrice + assumptions.salesTaxPaidAtPurchase + assumptions.estimatedShippingCost + assumptions.packingMaterialsCost;
  const grossRevenue = expectedSalePrice + assumptions.shippingChargedToBuyer;
  const marketplaceFee = grossRevenue * (assumptions.marketplaceFeePercent / 100);
  const paymentProcessingFee = grossRevenue * (assumptions.paymentProcessingFeePercent / 100);
  const netProfit = grossRevenue - marketplaceFee - paymentProcessingFee - totalCost;
  const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
  
  return {
    totalCost,
    grossRevenue,
    marketplaceFee,
    paymentProcessingFee,
    netProfit,
    roi
  };
}

export function determineVerdict(
  netProfit: number, 
  roi: number, 
  confidenceLevel: string, 
  riskFlags: RiskFlag[], 
  missingVerification: string[],
  assumptions: ProfitAssumptions
): { verdict: 'BUY' | 'PASS' | 'RESEARCH FURTHER', reason: string } {
  const failsThresholds = netProfit < assumptions.desiredMinProfit || roi < assumptions.desiredMinROI;
  
  if (failsThresholds) {
    return { 
      verdict: 'PASS', 
      reason: `Misses $${assumptions.desiredMinProfit} profit or ${assumptions.desiredMinROI}% ROI minimums.` 
    };
  }
  
  const hasSevereRisk = riskFlags.some(r => r.severity === 'severe' || r.severity === 'moderate');
  
  if (hasSevereRisk || confidenceLevel === 'Low' || missingVerification.length > 0) {
    return { 
      verdict: 'RESEARCH FURTHER', 
      reason: 'High uncertainty, missing verifications, or moderate/severe risks.' 
    };
  }
  
  return { 
    verdict: 'BUY', 
    reason: 'Meets profit thresholds with acceptable risk and confidence.' 
  };
}
