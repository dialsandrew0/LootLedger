import React, { useState } from 'react';
import { Calculator, ChevronDown, ChevronRight } from 'lucide-react';
import { ProfitAssumptions } from '../types';
import { calculateFinancials, determineVerdict } from '../utils/calculations';
import ProfitAssumptionsEditor from './ProfitAssumptionsEditor';

interface Props {
  defaultAssumptions: ProfitAssumptions;
  onUseForAppraisal: (assumptions: ProfitAssumptions) => void;
}

export default function QuickCalculator({ defaultAssumptions, onUseForAppraisal }: Props) {
  const [purchasePrice, setPurchasePrice] = useState<number>(10);
  const [expectedSalePrice, setExpectedSalePrice] = useState<number>(50);
  const [assumptions, setAssumptions] = useState<ProfitAssumptions>(defaultAssumptions);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const fin = calculateFinancials(purchasePrice, expectedSalePrice, assumptions);
  const verdictData = determineVerdict(fin.netProfit, fin.roi, 'High', [], [], assumptions);
  
  return (
    <div className="bg-surface border border-subtle rounded-none p-4 sm:p-5  space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
          <Calculator className="w-5 h-5 text-muted" />
          Quick Calculator
        </h2>
        <button 
          onClick={() => onUseForAppraisal(assumptions)}
          className="text-xs font-bold text-accent hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg"
        >
          Use for appraisal
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-primary uppercase mb-1">Cost Paid ($)</label>
          <input 
            type="number" 
            value={purchasePrice} 
            onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-strong rounded-lg text-base sm:text-lg font-bold text-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-primary uppercase mb-1">Expected Sale ($)</label>
          <input 
            type="number" 
            value={expectedSalePrice} 
            onChange={(e) => setExpectedSalePrice(Number(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-strong rounded-lg text-base sm:text-lg font-bold text-primary"
          />
        </div>
      </div>
      
      <div className="pt-2">
        <label className="block text-xs font-semibold text-primary uppercase mb-1">Marketplace</label>
        <select 
          value={assumptions.marketplace} 
          onChange={(e) => setAssumptions({ ...assumptions, marketplace: e.target.value })}
          className="w-full px-3 py-2 border border-strong rounded-lg text-base bg-surface"
        >
          <option value="eBay">eBay</option>
          <option value="Facebook Marketplace">Facebook Marketplace</option>
          <option value="Mercari">Mercari</option>
          <option value="Etsy">Etsy</option>
          <option value="Whatnot">Whatnot</option>
          <option value="Local Pickup">Local Pickup</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="border border-subtle rounded-none overflow-hidden mt-2">
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full px-4 py-3 flex items-center justify-between text-sm font-bold text-primary bg-canvas hover:bg-surface-hover transition-colors"
        >
          <span>Advanced assumptions</span>
          {showAdvanced ? <ChevronDown className="w-4 h-4 text-muted" /> : <ChevronRight className="w-4 h-4 text-muted" />}
        </button>
        {showAdvanced && (
          <div className="border-t border-subtle">
            <ProfitAssumptionsEditor assumptions={assumptions} onChange={setAssumptions} hideWrapper={true} />
          </div>
        )}
      </div>
      
      <div className="bg-canvas border border-subtle rounded-none p-4 mt-4 space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-secondary">Gross Revenue</span>
          <span className="font-medium text-primary">${fin.grossRevenue.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-secondary">Total Cost (incl. ship/tax)</span>
          <span className="font-medium text-primary">-${fin.totalCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-secondary">Marketplace Fees</span>
          <span className="font-medium text-primary">-${fin.marketplaceFee.toFixed(2)}</span>
        </div>
        {fin.paymentProcessingFee > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-secondary">Payment Proc. Fees</span>
            <span className="font-medium text-primary">-${fin.paymentProcessingFee.toFixed(2)}</span>
          </div>
        )}
        <div className="h-px bg-surface-hover border border-subtle my-2"></div>
        <div className="flex justify-between items-center text-lg font-bold">
          <span className="text-primary">Net Profit</span>
          <span className={fin.netProfit >= 0 ? 'text-emerald-600' : 'text-primary'}>
            ${fin.netProfit.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm font-bold">
          <span className="text-primary">Expected ROI</span>
          <span className={fin.roi >= 0 ? 'text-accent' : 'text-primary'}>
            {fin.roi.toFixed(0)}%
          </span>
        </div>
      </div>
      
      <div className={`p-4 rounded-none text-center flex flex-col items-center mt-2 ${
        verdictData.verdict === 'BUY' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 
        verdictData.verdict === 'RESEARCH FURTHER' ? 'bg-amber-950/20 text-amber-400 border border-amber-200' : 
        'bg-red-950/20 text-red-400 border border-red-200'
      }`}>
        <span className="font-display font-black uppercase tracking-tight text-xl tracking-tight">{verdictData.verdict}</span>
        <span className="text-xs mt-1 font-medium opacity-80">{verdictData.reason}</span>
      </div>
    </div>
  );
}
