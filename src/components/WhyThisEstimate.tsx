import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  ShieldAlert, 
  CheckCircle, 
  Search, 
  AlertTriangle, 
  Info, 
  ExternalLink, 
  Cpu,
  Layers,
  BarChart2,
  FileCheck,
  Compass
} from 'lucide-react';
import { ValuationResult } from '../types';

interface Props {
  result: ValuationResult;
}

export default function WhyThisEstimate({ result }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const gates = result.gateEvaluation;
  const resConf = result.researchConfidence;
  const authRisk = result.authenticityRisk;
  const routing = result.pipelineRouting;
  const compEvidence = result.compEvidence;

  const getGateBadgeStyle = (status: string) => {
    switch (status) {
      case 'PASSED':
      case 'CONFIRMED':
      case 'VERIFIED':
      case 'HIGH_DENSITY':
      case 'LOW_RISK':
      case 'CLEAR':
        return 'bg-emerald-950/50 text-emerald-300 border-emerald-600/50';
      case 'REVIEW_REQUIRED':
      case 'APPROXIMATE':
      case 'AMBIGUOUS':
      case 'MODERATE':
        return 'bg-amber-950/50 text-amber-300 border-amber-600/50';
      case 'FAIL_CRITICAL':
      case 'UNKNOWN':
      case 'DAMAGED':
      case 'SPARSE_SPECULATIVE':
      case 'HIGH_EXPOSURE':
      case 'RESTRICTED':
        return 'bg-purple-950/50 text-purple-300 border-purple-600/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-surface border border-subtle rounded-xl overflow-hidden mt-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-sm font-bold text-primary hover:bg-canvas transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-accent" />
          <span>Why this estimate? (Multi-Stage Audit)</span>
          {result.modelUsed && (
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-950/40 text-indigo-300 border border-indigo-800/40">
              <Cpu className="w-3 h-3 text-indigo-400" />
              {result.modelUsed}
            </span>
          )}
        </div>
        {isOpen ? <ChevronDown className="w-5 h-5 text-muted" /> : <ChevronRight className="w-5 h-5 text-muted" />}
      </button>
      
      {isOpen && (
        <div className="p-5 border-t border-subtle bg-canvas space-y-6">
          
          {/* Pipeline Routing Banner */}
          <div className="p-4 bg-indigo-950/30 border border-indigo-700/50 rounded-xl text-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-800/40 pb-2.5">
              <span className="font-bold text-indigo-300 uppercase tracking-wide flex items-center gap-1.5 text-xs">
                <Compass className="w-4 h-4 text-indigo-400" />
                Pipeline Lane: {routing?.laneTitle || result.engineTier || 'Autonomous Research Pipeline'}
              </span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-200 border border-indigo-700/60 self-start sm:self-auto font-semibold">
                Engine: {routing?.modelUsed || result.modelUsed || 'Gemini'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-canvas/60 p-2.5 rounded-lg border border-subtle">
                <span className="text-muted block text-[10px] uppercase font-bold mb-0.5">Dual Risk Scoring</span>
                <span className="font-mono font-bold text-primary">
                  Conf: {resConf ? `${resConf.overall}%` : 'N/A'} • Auth Risk: {authRisk ? `${authRisk.overall}%` : 'N/A'}
                </span>
              </div>
              <div className="bg-canvas/60 p-2.5 rounded-lg border border-subtle">
                <span className="text-muted block text-[10px] uppercase font-bold mb-0.5">Cost Profile</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {routing?.costProfile || '100% Free Tier (Zero Cost)'}
                </span>
              </div>
            </div>

            {/* Separate Mathematical Formulas */}
            <div className="space-y-1.5 pt-1 text-[11px] font-mono text-secondary">
              {resConf && (
                <div className="bg-canvas/40 px-2.5 py-1.5 rounded border border-subtle">
                  <span className="text-emerald-400 font-bold">Research Confidence: </span>
                  <span>{resConf.formula}</span>
                </div>
              )}
              {authRisk && (
                <div className="bg-canvas/40 px-2.5 py-1.5 rounded border border-subtle">
                  <span className="text-purple-400 font-bold">Authenticity Exposure: </span>
                  <span>{authRisk.formula}</span>
                </div>
              )}
            </div>

            {routing?.rationale && (
              <p className="text-secondary leading-relaxed text-xs pt-1">{routing.rationale}</p>
            )}
          </div>

          {/* Independent 6-Gate Audit Evaluation */}
          {gates && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-accent" /> Independent Gate Evaluation (Stage 2)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                
                {/* Gate 1: Authenticity */}
                <div className="bg-surface p-3 rounded-lg border border-subtle flex flex-col justify-between gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">1. Authenticity Gate</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getGateBadgeStyle(gates.authenticityGate.status)}`}>
                      {gates.authenticityGate.status}
                    </span>
                  </div>
                  <p className="text-secondary text-[11px] leading-relaxed">{gates.authenticityGate.reason}</p>
                </div>

                {/* Gate 2: Identity */}
                <div className="bg-surface p-3 rounded-lg border border-subtle flex flex-col justify-between gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">2. Identity Gate</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getGateBadgeStyle(gates.identityGate.status)}`}>
                      {gates.identityGate.status}
                    </span>
                  </div>
                  <p className="text-secondary text-[11px] leading-relaxed">{gates.identityGate.reason}</p>
                </div>

                {/* Gate 3: Condition */}
                <div className="bg-surface p-3 rounded-lg border border-subtle flex flex-col justify-between gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">3. Condition Gate</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getGateBadgeStyle(gates.conditionGate.status)}`}>
                      {gates.conditionGate.status}
                    </span>
                  </div>
                  <p className="text-secondary text-[11px] leading-relaxed">{gates.conditionGate.reason}</p>
                </div>

                {/* Gate 4: Market Evidence */}
                <div className="bg-surface p-3 rounded-lg border border-subtle flex flex-col justify-between gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">4. Market Evidence Gate</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getGateBadgeStyle(gates.marketEvidenceGate.status)}`}>
                      {gates.marketEvidenceGate.status}
                    </span>
                  </div>
                  <p className="text-secondary text-[11px] leading-relaxed">{gates.marketEvidenceGate.reason}</p>
                </div>

                {/* Gate 5: Financial Exposure */}
                <div className="bg-surface p-3 rounded-lg border border-subtle flex flex-col justify-between gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">5. Financial Exposure Gate</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getGateBadgeStyle(gates.financialExposureGate.status)}`}>
                      {gates.financialExposureGate.status}
                    </span>
                  </div>
                  <p className="text-secondary text-[11px] leading-relaxed">{gates.financialExposureGate.reason}</p>
                </div>

                {/* Gate 6: Policy & Restrictions */}
                <div className="bg-surface p-3 rounded-lg border border-subtle flex flex-col justify-between gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">6. Policy / Resale Gate</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getGateBadgeStyle(gates.policyGate.status)}`}>
                      {gates.policyGate.status}
                    </span>
                  </div>
                  <p className="text-secondary text-[11px] leading-relaxed">{gates.policyGate.reason}</p>
                </div>

              </div>
            </div>
          )}

          {/* Evidence Observed */}
          <div>
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Evidence Observed in Photo
            </h4>
            <ul className="list-disc list-inside text-xs text-primary space-y-1 bg-surface p-3 rounded-lg border border-subtle">
              {result.evidenceObserved.map((ev, i) => (
                <li key={i} className="leading-relaxed">{ev}</li>
              ))}
              {result.evidenceObserved.length === 0 && <li className="text-muted italic">None recorded</li>}
            </ul>
          </div>
          
          {/* Missing Verification Proofs */}
          {result.missingVerification && result.missingVerification.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Missing Verification Proofs (Research Blockers)
              </h4>
              <ul className="list-disc list-inside text-xs text-secondary space-y-1 bg-surface p-3 rounded-lg border border-subtle">
                {result.missingVerification.map((mv, i) => (
                  <li key={`mv-${i}`} className="leading-relaxed text-primary font-medium">{mv}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Market Comps & Query Evidence */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-accent" /> Market Evidence & Search Comps
              </h4>
              {compEvidence && (
                <span className="text-[10px] text-muted">
                  Comp Density: <span className="text-primary font-semibold">{compEvidence.compCountEstimate}</span>
                </span>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              {(result.comparableSearchTerms || []).map((term, i) => (
                <div key={i} className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-surface border border-subtle rounded-lg text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-canvas border border-subtle text-muted font-mono">
                      Query #{i + 1}
                    </span>
                    <span className="font-semibold text-primary">{term}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(term)}&LH_Sold=1&LH_Complete=1`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-950/40 text-blue-300 hover:bg-blue-900/50 border border-blue-700/40 transition-colors font-medium text-[11px]"
                    >
                      <span>eBay Sold Comps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(term + ' sold price comps')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-canvas text-secondary hover:text-primary border border-subtle transition-colors font-medium text-[11px]"
                    >
                      <span>Google Search</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {compEvidence?.compDisclaimer && (
              <p className="text-[10px] text-muted mt-2 leading-relaxed italic">
                {compEvidence.compDisclaimer}
              </p>
            )}
          </div>
          
          {/* Research Recommendation */}
          <div className="pt-2 border-t border-subtle">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Guidance & Provenance Notes</h4>
            <p className="text-xs text-primary leading-relaxed bg-surface p-3 rounded-lg border border-subtle">
              {result.researchRecommendation}
            </p>
          </div>
          
          {/* Disclaimer */}
          <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-3 flex gap-2.5 items-start">
            <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-300 font-medium leading-relaxed">
              {result.disclaimer || 'Non-definitive appraisal guidance. Physical verification of hallmarks, micro-stitching, serial codes, and hardware is mandatory prior to resale.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
