import React from 'react';
import { Check, Archive, AlertTriangle, AlertCircle, Clock, Zap, HelpCircle } from 'lucide-react';
import { ValuationResult, FieldDecision } from '../types';

interface FieldDecisionCardProps {
  result: ValuationResult;
  saveSuccess: boolean;
  onSaveToInventory: () => void;
}

export const FieldDecisionCard: React.FC<FieldDecisionCardProps> = ({ result, saveSuccess, onSaveToInventory }) => {
  const { decision } = result;
  if (!decision) return null;

  const getVerdictColor = (rec: string) => {
    switch (rec) {
      case 'BUY':
      case 'LIST NOW':
        return 'bg-emerald-500 text-emerald-900 border-emerald-600';
      case 'NEGOTIATE':
      case 'BUNDLE':
      case 'RELIST':
      case 'MARK DOWN':
        return 'bg-amber-400 text-amber-900 border-amber-500';
      case 'PASS':
        return 'bg-red-950/50 text-red-200 border-red-600';
      default:
        return 'bg-slate-300 text-primary border-slate-400';
    }
  };

  const getVerdictAccentColor = (rec: string) => {
    switch (rec) {
      case 'BUY':
      case 'LIST NOW':
        return 'bg-emerald-500';
      case 'NEGOTIATE':
      case 'BUNDLE':
      case 'RELIST':
      case 'MARK DOWN':
        return 'bg-amber-400';
      case 'PASS':
        return 'bg-red-500';
      default:
        return 'bg-slate-300';
    }
  };

  return (
    <div className="bg-surface border-2 border-slate-900 rounded-xl p-4 sm:p-5  relative overflow-hidden flex flex-col gap-5">
      <div className={`absolute top-0 left-0 w-2 h-full ${getVerdictAccentColor(decision.recommendation)}`}></div>
      
      <div className="pl-3 flex flex-col gap-4">
        {/* Header: Recommendation & Reasoning */}
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-4">
            <span className={`inline-block px-3 py-1 text-sm font-black rounded uppercase tracking-wide border ${getVerdictColor(decision.recommendation)}`}>
              {decision.recommendation}
            </span>
            <p className="text-sm font-semibold text-primary mt-2 leading-snug">{decision.reasoning}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-bold text-secondary uppercase">AI confidence</p>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${decision.confidenceLevel === 'High' ? 'bg-emerald-500' : decision.confidenceLevel === 'Medium' ? 'bg-amber-950/200' : 'bg-red-950/200'}`}></span>
              <p className="text-sm font-bold text-primary">{decision.confidenceLevel}</p>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-y border-subtle">
          <div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Max Buy Price</p>
            <p className="text-xl font-black text-primary">${decision.maxAcquisitionPrice?.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Projected Net</p>
            <p className={`text-xl font-black ${decision.projectedNet >= 0 ? 'text-emerald-600' : 'text-red-400'}`}>
              ${decision.projectedNet?.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Resale Range</p>
            <p className="text-lg font-bold text-primary">
              ${decision.expectedResaleRange?.[0]} - ${decision.expectedResaleRange?.[1]}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Speed</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {decision.sellThroughSpeed === 'Fast' && <Zap className="w-4 h-4 text-emerald-500" />}
              {decision.sellThroughSpeed === 'Medium' && <Clock className="w-4 h-4 text-amber-500" />}
              {decision.sellThroughSpeed === 'Slow' && <Clock className="w-4 h-4 text-red-500" />}
              <p className="text-lg font-bold text-primary">{decision.sellThroughSpeed}</p>
            </div>
          </div>
        </div>

        {/* Risk Flags */}
        {decision.riskFlags && decision.riskFlags.length > 0 && (
          <div className="bg-canvas border border-subtle rounded-lg p-3">
            <h4 className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Risk Factors
            </h4>
            <div className="flex flex-col gap-1.5">
              {decision.riskFlags.map((flag, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${flag.severity === 'severe' ? 'text-red-500' : flag.severity === 'moderate' ? 'text-amber-500' : 'text-muted'}`} />
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
          <div className="bg-blue-950/40 border border-blue-900/50 p-1.5 rounded-md shrink-0 mt-0.5">
            <Check className="w-4 h-4 text-blue-700" />
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-0.5">Next Best Action</h4>
            <p className="text-sm font-semibold text-blue-900">{decision.nextBestAction}</p>
            <p className="text-xs text-blue-800/80 mt-1">Use this as a decision aid; verify sold comps and condition before spending.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onSaveToInventory}
            disabled={saveSuccess}
            className={`flex-1 py-3.5 rounded-lg text-base font-black transition-colors flex items-center justify-center gap-2  border ${
              saveSuccess 
                 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : decision.recommendation === 'PASS' 
                   ? 'bg-surface text-red-400 border-red-200 hover:bg-red-950/20'
                  : 'bg-zinc-900 text-primary border-slate-900 hover:bg-zinc-800'
            }`}
          >
            {saveSuccess ? <Check className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
            {saveSuccess ? 'Saved' : (decision.recommendation === 'PASS' ? 'Save as Passed' : 'Save Item')}
          </button>
        </div>

      </div>
    </div>
  );
};
