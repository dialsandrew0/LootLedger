import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ShieldAlert, CheckCircle, Search, AlertTriangle, Info } from 'lucide-react';
import { ValuationResult } from '../types';

interface Props {
  result: ValuationResult;
}

export default function WhyThisEstimate({ result }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-surface border border-subtle rounded-xl  overflow-hidden mt-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-sm font-bold text-primary hover:bg-canvas transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-accent" />
          <span>Why this estimate?</span>
        </div>
        {isOpen ? <ChevronDown className="w-5 h-5 text-muted" /> : <ChevronRight className="w-5 h-5 text-muted" />}
      </button>
      
      {isOpen && (
        <div className="p-5 border-t border-subtle bg-canvas space-y-5">
          
          <div>
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Evidence Observed
            </h4>
            <ul className="list-disc list-inside text-sm text-primary space-y-1">
              {result.evidenceObserved.map((ev, i) => (
                <li key={i}>{ev}</li>
              ))}
              {result.evidenceObserved.length === 0 && <li className="text-muted italic">None</li>}
            </ul>
          </div>
          
          {(result.missingVerification.length > 0 || (result.decision?.riskFlags || []).length > 0) && (
            <div>
              <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Missing or Risks
              </h4>
              <ul className="list-disc list-inside text-sm text-primary space-y-2">
                {result.missingVerification.map((mv, i) => (
                  <li key={`mv-${i}`}>Missing: {mv}</li>
                ))}
                {(result.decision?.riskFlags || []).map((rf, i) => (
                  <li key={`rf-${i}`} className={`flex flex-col ml-4 relative before:content-['•'] before:absolute before:-left-4 ${
                    rf.severity === 'severe' ? 'text-red-400 font-medium' : 
                    rf.severity === 'moderate' ? 'text-amber-400' : 'text-primary'
                  }`}>
                    <span>Risk: {rf.issue} <span className="uppercase text-[10px] ml-1 bg-surface border border-current px-1 py-0.5 rounded-sm">{rf.severity}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-blue-500" /> Comparable Searches
            </h4>
            <div className="flex flex-wrap gap-2">
              {result.comparableSearchTerms.map((term, i) => (
                <span key={i} className="px-2 py-1 bg-surface border border-subtle rounded-md text-xs font-medium text-secondary">
                  {term}
                </span>
              ))}
            </div>
          </div>
          
          <div className="pt-3 border-t border-subtle">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Research Recommendation</h4>
            <p className="text-sm text-primary">{result.researchRecommendation}</p>
          </div>
          
          <div className="bg-amber-950/20 border border-amber-200 rounded-lg p-3 flex gap-2 items-start mt-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-400 font-medium leading-relaxed">
              {result.disclaimer || 'Estimate only. Verify markings, authenticity, condition, sold comps, and shipping costs before buying.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
