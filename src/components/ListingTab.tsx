import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Camera, Sparkles, AlertCircle, Zap, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { ValuationResult } from '../types';
import { EditableField } from './EditableField';


interface ListingTabProps {
  onResultUpdate?: (newResult: ValuationResult) => void;
  supportedPlatforms?: string[];
  result: ValuationResult;
  image: string | null;
  onStatusUpdate?: (platformName: string, newStatus: string) => void;
  platformStatuses?: Record<string, string>;
}

export const ListingTab: React.FC<ListingTabProps> = ({
  onResultUpdate, 
  result, 
  image, 
  supportedPlatforms = ['eBay', 'Facebook Marketplace', 'Mercari', 'Poshmark', 'Etsy'],
  onStatusUpdate,
  platformStatuses = {}
}) => {
  const [copied, setCopied] = useState<number | null>(null);

  const getPlatformLink = (platformName: string, title: string) => {
    const encodedTitle = encodeURIComponent(title);
    const p = platformName.toLowerCase();
    if (p.includes('ebay')) return `https://www.ebay.com/sl/prelist/suggest?query=${encodedTitle}`;
    if (p.includes('facebook') || p.includes('fb')) return 'https://www.facebook.com/marketplace/create/item';
    if (p.includes('mercari')) return 'https://www.mercari.com/sell/';
    if (p.includes('poshmark')) return 'https://poshmark.com/create-listing';
    if (p.includes('etsy')) return 'https://www.etsy.com/your/shops/me/listing/create';
    return '#';
  };

  const copyText = async (text: string, index: number, platformName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(index);
      if (onStatusUpdate) {
        onStatusUpdate(platformName, 'Copied');
      }
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handlePostClick = (platformName: string, link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
    if (onStatusUpdate) {
      // We don't mark it 'Posted' automatically, but we could ask.
      // For now, let's just leave it or set a custom state to trigger a confirmation flow later.
    }
  };

  
  
  
  const updateMarketplace = (index: number, field: string, val: string | number) => {
    if (!onResultUpdate || !result.listingDraft) return;
    const newMarketplaces = [...(result.listingDraft.marketplaces || [])];
    if (newMarketplaces[index]) {
      newMarketplaces[index] = { ...newMarketplaces[index], [field]: val };
      onResultUpdate({
        ...result,
        listingDraft: {
          ...result.listingDraft,
          marketplaces: newMarketplaces
        }
      });
    }
  };

const aiMarketplaces = result.listingDraft?.marketplaces || [];
  
  const marketplaces = supportedPlatforms.map(platformName => {
    const aiData = aiMarketplaces.find(m => m.name.toLowerCase().includes(platformName.toLowerCase()));
    if (aiData) return aiData;
    return {
      name: platformName,
      platformSpecificTitle: result.listingDraft?.title || 'Unknown Item',
      platformSpecificDescription: `${result.listingDraft?.shortDescription || ''}\n\nCondition: ${result.listingDraft?.conditionDescription || ''}`,
      suggestedPrice: result.listingDraft?.suggestedListingPrice || 0,
      fitScore: 50,
      likelySalePrice: result.pricing?.expectedSale || 0,
      estimatedNet: 0,
      shippingRecommendation: 'Standard',
      expectedTimeToSell: 'Medium',
      demandScore: 5,
      effortScore: 5,
      riskScore: 5,
      whyThisPlatform: 'Fallback recommendation',
      keywords: [],
      conditionNotes: result.listingDraft?.conditionDescription || '',
      photoChecklist: []
    };
  });

  const staging = result.listingDraft?.stagingAdvice;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Photo Proof System */}
      <div>
        <h3 className="text-base font-black text-primary flex items-center gap-2 mb-4">
          <Camera className="w-5 h-5 text-amber-500" />
          Photo Proof System
        </h3>
        
        <div className="bg-surface border border-subtle rounded-2xl overflow-hidden  flex flex-col md:flex-row">
          <div className="w-full md:w-2/5 bg-zinc-900 relative min-h-[250px] flex items-center justify-center p-4">
            {image ? (
              <div className="relative w-full h-full max-h-[300px] rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/20">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent z-10 pointer-events-none" />
                <img 
                  src={image} 
                  alt="Item" 
                  className="w-full h-full object-cover rounded-xl"
                  style={{ filter: 'contrast(1.1) brightness(1.05) saturate(1.1)' }}
                />
                <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-primary uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Suggested Staging
                </div>
              </div>
            ) : (
              <div className="text-secondary flex flex-col items-center">
                <Camera className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-sm font-semibold">No Image Provided</span>
              </div>
            )}
          </div>
          
          <div className="p-5 md:p-6 flex-1 space-y-5 bg-canvas">
            {staging ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Lighting</h4>
                    <p className="text-sm text-primary font-medium">{staging.lighting}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Background</h4>
                    <p className="text-sm text-primary font-medium">{staging.background}</p>
                  </div>
                </div>

                {staging.photoChecklist && staging.photoChecklist.length > 0 && (
                  <div className="pt-4 border-t border-subtle">
                    <h4 className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Required Proof Shots
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {staging.photoChecklist.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 bg-surface p-2 border border-subtle rounded-lg">
                          <div className="w-4 h-4 rounded border border-strong shrink-0 mt-0.5"></div>
                          <span className="text-xs font-semibold text-primary">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-secondary text-sm p-4 bg-surface rounded-lg border border-subtle">
                <AlertCircle className="w-4 h-4" />
                Staging advice not available for this item.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Platform Swipe Cards */}
      <div>
        <h3 className="text-base font-black text-primary mb-4">Marketplace Scorecards</h3>
        
        <div className="flex overflow-x-auto snap-x snap-mandatory pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 gap-4 hide-scrollbar">
          {marketplaces.map((mk, index) => {
            const link = getPlatformLink(mk.name, mk.platformSpecificTitle);
            const fullText = `${mk.platformSpecificTitle}\n\nPrice: $${mk.suggestedPrice}\n\n${mk.platformSpecificDescription}\n\nCondition: ${mk.conditionNotes}\n\nTags: ${mk.keywords?.join(', ')}`;
            const currentStatus = platformStatuses[mk.name] || 'Draft';
            
            // Sort to put best fit first visually
            return (
              <div 
                key={index} 
                className="snap-center shrink-0 w-[90vw] sm:w-[360px] bg-surface border border-subtle rounded-2xl flex flex-col "
              >
                {/* Card Header */}
                <div className="p-4 border-b border-subtle flex items-center justify-between bg-canvas rounded-t-2xl relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${mk.fitScore >= 80 ? 'bg-emerald-500' : mk.fitScore >= 60 ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                  <div className="pl-2">
                    <h4 className="font-black text-primary text-lg">{mk.name}</h4>
                    <p className="text-xs font-semibold text-secondary mt-0.5 flex items-center gap-1">
                      Fit Score: <span className={`font-black ${mk.fitScore >= 80 ? 'text-emerald-600' : 'text-primary'}`}>{mk.fitScore}/100</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-0.5">List at</p>
                    <EditableField 
    type="number"
    value={mk.suggestedPrice} 
    textClassName="px-2.5 py-1 bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 rounded-md text-sm font-black border border-green-200"
    onSave={(val) => updateMarketplace(index, 'suggestedPrice', val)}
  />
                  </div>
                </div>
                
                {/* Metrics */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-subtle">
                  <div className="p-3 text-center">
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Demand</p>
                    <p className="font-black text-primary text-sm mt-0.5">{mk.demandScore}/10</p>
                  </div>
                  <div className="p-3 text-center">
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Effort</p>
                    <p className="font-black text-primary text-sm mt-0.5">{mk.effortScore}/10</p>
                  </div>
                  <div className="p-3 text-center bg-canvas/50">
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Est. Net</p>
                    <p className="font-black text-emerald-600 text-sm mt-0.5">${mk.estimatedNet?.toFixed(2)}</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/50 border-b border-subtle">
                  <p className="text-xs font-semibold text-blue-900 italic">"{mk.whyThisPlatform}"</p>
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto max-h-[250px] space-y-4">
                  <div>
                    <EditableField 
    label="SEO Title"
    value={mk.platformSpecificTitle} 
    textClassName="font-bold text-primary text-sm"
    onSave={(val) => updateMarketplace(index, 'platformSpecificTitle', val)}
  />
                  </div>
                  <div>
                    <EditableField 
    type="textarea"
    label="Description"
    value={mk.platformSpecificDescription} 
    textClassName="text-xs text-secondary whitespace-pre-wrap leading-relaxed bg-canvas p-2 rounded-md border border-subtle"
    onSave={(val) => updateMarketplace(index, 'platformSpecificDescription', val)}
  />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <h5 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Condition Notes</h5>
                      <p className="text-xs text-primary font-medium">{mk.conditionNotes}</p>
                    </div>
                    <div>
                      <h5 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Shipping</h5>
                      <p className="text-xs text-primary font-medium flex items-center gap-1">
                        {mk.shippingRecommendation}
                      </p>
                    </div>
                  </div>
                  <div>
                     <h5 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Tags</h5>
                     <div className="flex flex-wrap gap-1">
                       {mk.keywords?.map((kw, i) => (
                         <span key={i} className="px-1.5 py-0.5 bg-surface-hover text-secondary text-[10px] rounded font-medium">{kw}</span>
                       ))}
                     </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="p-4 border-t border-subtle bg-canvas flex flex-col gap-2 rounded-b-2xl">
                  <div className="flex justify-between items-center px-1 mb-1">
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Status:</span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                      currentStatus === 'Posted' ? 'bg-emerald-100 text-emerald-700' :
                      currentStatus === 'Copied' ? 'bg-blue-950/40 border border-blue-900/50 text-blue-700' :
                      'bg-surface-hover border border-subtle text-secondary'
                    }`}>
                      {currentStatus}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyText(fullText, index, mk.name)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-surface border border-strong text-primary hover:bg-canvas hover:text-primary rounded-lg text-xs font-black transition-colors"
                    >
                      {copied === index ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied === index ? 'Copied' : 'Copy Text'}
                    </button>
                    <button
                      onClick={() => handlePostClick(mk.name, link)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-zinc-900 text-primary hover:bg-zinc-800 rounded-lg text-xs font-black transition-colors"
                    >
                      Post <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
};
