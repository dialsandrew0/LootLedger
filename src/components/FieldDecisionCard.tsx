import React, { useState } from 'react';
import { 
  Check, 
  Archive, 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  Zap, 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Camera, 
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  Bookmark,
  TrendingUp,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { ValuationResult } from '../types';

interface FieldDecisionCardProps {
  result: ValuationResult;
  saveSuccess: boolean;
  onSaveToInventory: () => void;
  onSaveToWatchlist?: () => void;
  isWatchlistSaved?: boolean;
  cost?: number;
  onGoToListing?: () => void;
}

export const FieldDecisionCard: React.FC<FieldDecisionCardProps> = ({ 
  result, 
  saveSuccess, 
  onSaveToInventory,
  onSaveToWatchlist,
  isWatchlistSaved = false,
  cost,
  onGoToListing
}) => {
  const { decision } = result;
  const [showFormulaBreakdown, setShowFormulaBreakdown] = useState(false);
  if (!decision) return null;

  const authRisk = result.authenticityRisk;
  const resConf = result.researchConfidence;
  const buyCeiling = result.buyCeiling || decision.buyCeiling;
  const hasCost = typeof cost === 'number' && cost > 0;
  const maxBuy = buyCeiling?.maxBuyPrice ?? decision.maxAcquisitionPrice ?? 0;

  // ROI calculation when cost is valid
  const effectiveCost = hasCost ? cost : 0;
  const netProfit = decision.projectedNet;
  const validROI = hasCost && effectiveCost > 0 ? (netProfit / effectiveCost) * 100 : null;

  const isHoldOrAuthRequired = 
    decision.recommendation === 'HOLD FOR AUTHENTICATION' || 
    result.requiresCertifiedAuthentication || 
    (authRisk && authRisk.overall >= 60);

  const isConditional = result.isConditionalEstimate || decision.isConditional || isHoldOrAuthRequired;

  const getVerdictBadgeStyle = (rec: string) => {
    switch (rec) {
      case 'BUY':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50';
      case 'NEGOTIATE':
        return 'bg-amber-950/70 text-amber-300 border-amber-500/60 font-black';
      case 'CONDITIONAL BUY':
        return 'bg-amber-950/60 text-amber-300 border-amber-500/50';
      case 'HOLD FOR AUTHENTICATION':
        return 'bg-purple-950/60 text-purple-300 border-purple-500/50';
      case 'RESEARCH FURTHER':
        return 'bg-blue-950/60 text-blue-300 border-blue-500/50';
      case 'PASS':
        return 'bg-red-950/60 text-red-300 border-red-500/50';
      default:
        return 'bg-slate-800 text-slate-200 border-slate-700';
    }
  };

  const getAccentBarColor = (rec: string) => {
    switch (rec) {
      case 'BUY':
        return 'bg-emerald-500';
      case 'NEGOTIATE':
        return 'bg-amber-500';
      case 'CONDITIONAL BUY':
        return 'bg-amber-500';
      case 'HOLD FOR AUTHENTICATION':
        return 'bg-purple-500';
      case 'RESEARCH FURTHER':
        return 'bg-blue-500';
      case 'PASS':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <div className="bg-surface border-2 border-border rounded-xl p-4 sm:p-5 relative overflow-hidden flex flex-col gap-5">
      <div className={`absolute top-0 left-0 w-2 h-full ${getAccentBarColor(decision.recommendation)}`}></div>
      
      <div className="pl-3 flex flex-col gap-4">
        
        {/* Conditional Estimate / Authentication Warning Banner */}
        {isConditional && (
          <div className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs ${
            isHoldOrAuthRequired 
              ? 'bg-purple-950/40 border-purple-800/60 text-purple-200' 
              : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
          }`}>
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-purple-400" />
            <div>
              <div className="font-bold uppercase tracking-wider mb-0.5 flex items-center gap-2">
                <span>{isHoldOrAuthRequired ? 'Authentication Review Required' : 'Conditional Valuation Guidance'}</span>
                <span className="px-1.5 py-0.2 text-[10px] bg-purple-900/60 border border-purple-700 rounded">
                  Non-Definitive
                </span>
              </div>
              <p className="text-muted leading-relaxed">
                {isHoldOrAuthRequired
                  ? 'High counterfeit exposure or missing internal tags detected. Resale valuation is provisional and subject to physical authentication.'
                  : 'Valuation is conditional upon physical verification of hardware, marks, and wear.'}
              </p>
            </div>
          </div>
        )}

        {/* Header: Recommendation & Reasoning */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
          <div className="flex-1 pr-2">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`inline-block px-3 py-1 text-xs font-black rounded uppercase tracking-wider border ${getVerdictBadgeStyle(decision.recommendation)}`}>
                {decision.recommendation}
              </span>
              {isConditional && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-900/40 border border-amber-700/60 text-amber-300">
                  Conditional
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-primary leading-snug">{decision.reasoning}</p>
          </div>

          {/* Dual Metrics: Research Confidence & Authenticity Risk */}
          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 bg-canvas p-2.5 rounded-lg border border-subtle">
            <div>
              <p className="text-[9px] font-bold text-secondary uppercase tracking-wider">Research Confidence</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${
                  (resConf?.overall ?? 70) >= 75 ? 'bg-emerald-500' : (resConf?.overall ?? 70) >= 55 ? 'bg-amber-400' : 'bg-red-400'
                }`}></span>
                <p className="text-xs font-black text-primary font-mono">{resConf ? `${resConf.overall}%` : decision.confidenceLevel}</p>
              </div>
            </div>

            <div className="w-px h-7 bg-subtle"></div>

            <div>
              <p className="text-[9px] font-bold text-secondary uppercase tracking-wider">Authenticity Risk</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${
                  (authRisk?.overall ?? 15) >= 60 ? 'bg-purple-500' : (authRisk?.overall ?? 15) >= 35 ? 'bg-amber-400' : 'bg-emerald-500'
                }`}></span>
                <p className="text-xs font-black text-primary font-mono">{authRisk ? `${authRisk.overall}%` : 'Low'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Resale Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-subtle">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Conservative Buy Max</p>
              <Info className="w-3 h-3 text-muted" />
            </div>
            <p className="text-xl font-black text-primary font-mono">${maxBuy.toFixed(2)}</p>
            <p className="text-[10px] text-secondary">With risk reserves</p>
          </div>

          <div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
              {hasCost ? 'Projected Net & ROI' : 'Target Profit Target'}
            </p>
            {hasCost ? (
              <div className="flex items-baseline gap-1.5">
                <p className={`text-xl font-black font-mono ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${netProfit.toFixed(2)}
                </p>
                {validROI !== null && (
                  <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded ${
                    validROI >= 100 ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50' :
                    validROI >= 40 ? 'bg-amber-950/60 text-amber-300 border border-amber-700/50' :
                    'bg-red-950/60 text-red-300 border border-red-700/50'
                  }`}>
                    {validROI >= 0 ? `+${validROI.toFixed(0)}%` : `${validROI.toFixed(0)}%`}
                  </span>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xl font-black text-emerald-400 font-mono">${(result.buyCeiling?.targetProfit || 15).toFixed(2)}</p>
                <p className="text-[10px] text-accent">Cost missing • Offer ≤ ${maxBuy.toFixed(2)}</p>
              </div>
            )}
            {hasCost && <p className="text-[10px] text-secondary">After fees & postage</p>}
          </div>

          <div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Expected Resale</p>
            <p className="text-lg font-bold text-primary font-mono">
              ${decision.expectedResaleRange?.[0]} - ${decision.expectedResaleRange?.[1]}
            </p>
            <p className="text-[10px] text-secondary">{isConditional ? 'Provisional range' : 'Grounded range'}</p>
          </div>

          <div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Market Velocity</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {decision.sellThroughSpeed === 'Fast' && <Zap className="w-4 h-4 text-emerald-400" />}
              {decision.sellThroughSpeed === 'Medium' && <Clock className="w-4 h-4 text-amber-400" />}
              {decision.sellThroughSpeed === 'Slow' && <Clock className="w-4 h-4 text-red-400" />}
              <p className="text-sm font-bold text-primary">{decision.sellThroughSpeed}</p>
            </div>
            <p className="text-[10px] text-secondary">Liquidity pace</p>
          </div>
        </div>

        {/* Missing Cost Field Notice */}
        {!hasCost && (
          <div className="bg-canvas border border-subtle/80 rounded-lg p-2.5 flex items-center justify-between text-xs text-secondary">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-accent shrink-0" />
              <span><strong>Field Sourcing Mode:</strong> Purchase cost was not entered. ROI will calculate automatically once cost is entered in Quick Calc.</span>
            </span>
          </div>
        )}

        {/* What would improve confidence */}
        {(resConf?.overall ?? 70) < 80 && (
          <div className="bg-canvas border border-subtle rounded-lg p-3 space-y-1.5">
            <h4 className="text-[10px] font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-blue-400" />
              What Would Improve Confidence?
            </h4>
            <p className="text-xs text-secondary leading-relaxed">
              {result.researchRecommendation || 
                'Upload a macro photo of the maker mark, date code, or hardware stamping. Verifying the exact year and style code unlocks high-confidence historical comps.'}
            </p>
          </div>
        )}

        {/* Verification Evidence Checklist (Observed vs Missing Proofs) */}
        {result.missingVerification && result.missingVerification.length > 0 && (
          <div className="bg-canvas border border-subtle rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                Required Verification Proofs ({result.missingVerification.length} Missing)
              </h4>
              <span className="text-[10px] text-amber-400 font-semibold">Action Required Before Resale</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {result.missingVerification.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-surface/50 border border-subtle/80 p-2 rounded">
                  <span className="w-4 h-4 rounded-full bg-amber-950/60 border border-amber-600/80 text-amber-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                    !
                  </span>
                  <span className="text-secondary leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Factors */}
        {decision.riskFlags && decision.riskFlags.length > 0 && (
          <div className="bg-canvas border border-subtle rounded-lg p-3">
            <h4 className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Risk Factors
            </h4>
            <div className="flex flex-col gap-1.5">
              {decision.riskFlags.map((flag, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <AlertCircle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                    flag.severity === 'severe' ? 'text-red-400' : flag.severity === 'moderate' ? 'text-amber-400' : 'text-muted'
                  }`} />
                  <div>
                    <span className="font-semibold text-primary capitalize">{flag.category}: </span>
                    <span className="text-secondary">{flag.issue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Best Action */}
        <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-3 flex items-start gap-3">
          <div className="bg-blue-900/50 border border-blue-700/60 p-1.5 rounded-md shrink-0 mt-0.5">
            <Check className="w-4 h-4 text-blue-300" />
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-0.5">Recommended Next Action</h4>
            <p className="text-xs font-semibold text-blue-100 leading-relaxed">{decision.nextBestAction}</p>
          </div>
        </div>

        {/* Collapsible Conservative Buy Ceiling Formula Breakdown */}
        {buyCeiling && (
          <div className="border border-subtle rounded-lg overflow-hidden bg-canvas">
            <button
              onClick={() => setShowFormulaBreakdown(!showFormulaBreakdown)}
              className="w-full px-3 py-2 text-left flex items-center justify-between text-xs font-bold text-secondary hover:text-primary transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-accent" />
                Conservative Buy Ceiling Formula Breakdown
              </span>
              {showFormulaBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showFormulaBreakdown && (
              <div className="px-3 pb-3 pt-1 border-t border-subtle text-xs space-y-2 text-secondary">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                  <div>
                    <span className="text-muted block text-[10px] font-sans">Est. Fees:</span>
                    <span>-${buyCeiling.estimatedFees.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px] font-sans">Shipping/Prep:</span>
                    <span>-${(buyCeiling.shipping + buyCeiling.prepCost).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px] font-sans">Returns Reserve:</span>
                    <span>-${buyCeiling.returnsReserve.toFixed(2)}</span>
                  </div>
                  <div className="text-purple-300 font-bold">
                    <span className="text-muted block text-[10px] font-sans">Uncertainty Reserve:</span>
                    <span>-${buyCeiling.uncertaintyReserve.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted leading-relaxed font-sans pt-1 border-t border-subtle/50">
                  <span className="font-semibold text-primary">Protection Rule:</span> The uncertainty reserve dynamically scales based on authenticity risk ({authRisk?.overall ?? 0}%) and research confidence ({resConf?.overall ?? 0}%) to insulate buyers from replicas or unverified traits.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            onClick={onSaveToInventory}
            disabled={saveSuccess}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 border ${
              saveSuccess 
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                : decision.recommendation === 'PASS' 
                  ? 'bg-surface text-red-400 border-red-500/30 hover:bg-red-950/20'
                  : 'bg-accent text-primary border-accent hover:bg-accent-hover'
            }`}
          >
            {saveSuccess ? <Check className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
            {saveSuccess ? 'Saved to Inventory' : (decision.recommendation === 'PASS' ? 'Save as Passed' : 'Save Item to Inventory')}
          </button>

          {onSaveToWatchlist && (
            <button
              onClick={onSaveToWatchlist}
              disabled={isWatchlistSaved}
              className={`py-3 px-4 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 border ${
                isWatchlistSaved
                  ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/50'
                  : 'bg-surface hover:bg-surface-hover text-secondary hover:text-primary border-subtle'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isWatchlistSaved ? 'fill-indigo-300' : ''}`} />
              {isWatchlistSaved ? 'In Watchlist' : 'Add to Watchlist'}
            </button>
          )}

          {onGoToListing && (
            <button
              onClick={onGoToListing}
              className="py-3 px-4 rounded-lg text-sm font-bold bg-surface hover:bg-surface-hover text-secondary hover:text-primary border border-subtle transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Listing Prep</span>
              <ArrowRight className="w-4 h-4 text-accent" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
