import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { ProfitAssumptions } from '../types';

interface Props {
  assumptions: ProfitAssumptions;
  onChange: (newAssumptions: ProfitAssumptions) => void;
  hideWrapper?: boolean;
}

export default function ProfitAssumptionsEditor({ assumptions, onChange, hideWrapper = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange({
      ...assumptions,
      [name]: name === 'marketplace' ? value : Number(value) || 0
    });
  };

  const innerContent = (
    <div className="p-4 bg-canvas space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {!hideWrapper && (
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-semibold text-primary uppercase mb-1">Marketplace</label>
            <select 
              name="marketplace"
              value={assumptions.marketplace} 
              onChange={handleChange}
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
        )}
        
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-semibold text-primary uppercase mb-1">Fee %</label>
          <div className="relative">
            <input 
              type="number" name="marketplaceFeePercent"
              value={assumptions.marketplaceFeePercent} onChange={handleChange}
              className="w-full px-3 py-2 border border-strong rounded-lg text-base pr-7"
            />
            <span className="absolute right-3 top-2.5 text-muted text-sm">%</span>
          </div>
        </div>
        
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-semibold text-primary uppercase mb-1">Payment Proc. %</label>
          <div className="relative">
            <input 
              type="number" name="paymentProcessingFeePercent"
              value={assumptions.paymentProcessingFeePercent} onChange={handleChange}
              className="w-full px-3 py-2 border border-strong rounded-lg text-base pr-7"
            />
            <span className="absolute right-3 top-2.5 text-muted text-sm">%</span>
          </div>
        </div>
        
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-semibold text-primary uppercase mb-1">Sales Tax Paid ($)</label>
          <input 
            type="number" name="salesTaxPaidAtPurchase"
            value={assumptions.salesTaxPaidAtPurchase} onChange={handleChange}
            className="w-full px-3 py-2 border border-strong rounded-lg text-base"
          />
        </div>
        
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-semibold text-primary uppercase mb-1">Est. Shipping Cost ($)</label>
          <input 
            type="number" name="estimatedShippingCost"
            value={assumptions.estimatedShippingCost} onChange={handleChange}
            className="w-full px-3 py-2 border border-strong rounded-lg text-base"
          />
        </div>
        
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-semibold text-primary uppercase mb-1">Ship Charged to Buyer ($)</label>
          <input 
            type="number" name="shippingChargedToBuyer"
            value={assumptions.shippingChargedToBuyer} onChange={handleChange}
            className="w-full px-3 py-2 border border-strong rounded-lg text-base"
          />
        </div>
        
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-semibold text-primary uppercase mb-1">Packing Cost ($)</label>
          <input 
            type="number" name="packingMaterialsCost"
            value={assumptions.packingMaterialsCost} onChange={handleChange}
            className="w-full px-3 py-2 border border-strong rounded-lg text-base"
          />
        </div>
        
        <div className="col-span-2 border-t border-subtle pt-3 mt-1 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">Min Profit ($)</label>
            <input 
              type="number" name="desiredMinProfit"
              value={assumptions.desiredMinProfit} onChange={handleChange}
              className="w-full px-3 py-2 border border-strong rounded-lg text-base"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">Min ROI (%)</label>
            <input 
              type="number" name="desiredMinROI"
              value={assumptions.desiredMinROI} onChange={handleChange}
              className="w-full px-3 py-2 border border-strong rounded-lg text-base"
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (hideWrapper) {
    return innerContent;
  }

  return (
    <div className="bg-surface border border-subtle rounded-none  overflow-hidden mt-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-sm font-bold text-primary hover:bg-canvas transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted" />
          <div className="flex flex-col items-start">
            <span>Profit assumptions</span>
            {!isOpen && (
              <span className="text-xs font-normal text-secondary mt-0.5">
                {assumptions.marketplace} &middot; {assumptions.marketplaceFeePercent}% fee &middot; ${assumptions.desiredMinProfit} min profit &middot; {assumptions.desiredMinROI}% min ROI
              </span>
            )}
          </div>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-muted flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted flex-shrink-0" />}
      </button>
      
      {isOpen && (
        <div className="border-t border-subtle">
          {innerContent}
        </div>
      )}
    </div>
  );
}
