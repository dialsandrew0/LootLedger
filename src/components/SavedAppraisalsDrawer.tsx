import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Bookmark, 
  Clock, 
  Trash2, 
  ExternalLink, 
  Zap, 
  ArrowRight,
  Archive,
  TrendingUp,
  Tag
} from 'lucide-react';
import { SavedAppraisal, DecisionType } from '../types';

interface SavedAppraisalsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  appraisals: SavedAppraisal[];
  onSelectAppraisal: (appraisal: SavedAppraisal) => void;
  onToggleWatchlist: (id: string) => void;
  onDeleteAppraisal: (id: string) => void;
}

export const SavedAppraisalsDrawer: React.FC<SavedAppraisalsDrawerProps> = ({
  isOpen,
  onClose,
  appraisals,
  onSelectAppraisal,
  onToggleWatchlist,
  onDeleteAppraisal
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'watchlist'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const getVerdictStyle = (rec: DecisionType) => {
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

  const filtered = appraisals.filter(item => {
    if (filterTab === 'watchlist' && !item.isWatchlist) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const watchlistCount = appraisals.filter(a => a.isWatchlist).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-surface border-l border-subtle h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-subtle flex items-center justify-between">
          <div>
            <h2 className="text-lg font-display font-black tracking-tight text-primary flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              Appraisal History
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Review scans, field decisions, and items kept in watchlist.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-secondary hover:text-primary rounded-lg hover:bg-canvas transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-4 sm:px-5 pt-3 border-b border-subtle flex gap-2">
          <button
            onClick={() => setFilterTab('all')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
              filterTab === 'all'
                ? 'border-accent text-primary'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            All Appraisals ({appraisals.length})
          </button>
          <button
            onClick={() => setFilterTab('watchlist')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              filterTab === 'watchlist'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Watchlist ({watchlistCount})
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-subtle">
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-3 pointer-events-none" />
            <input 
              type="text"
              placeholder="Search previous scans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-canvas border border-subtle rounded-xl text-xs text-primary placeholder-muted focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Clock className="w-10 h-10 text-muted mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold text-primary">No appraisals found</p>
              <p className="text-xs text-secondary mt-1 max-w-xs mx-auto">
                {filterTab === 'watchlist'
                  ? 'No items are in your watchlist. Bookmark uncertain scans to review them here later.'
                  : 'Scan any item with your camera or enter details to automatically generate appraisal records.'}
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const hasCost = typeof item.purchasePrice === 'number' && item.purchasePrice > 0;
              const maxBuy = item.result.buyCeiling?.maxBuyPrice ?? item.result.decision.maxAcquisitionPrice ?? 0;
              return (
                <div 
                  key={item.id}
                  className="bg-canvas border border-subtle hover:border-subtle-hover rounded-xl p-3.5 flex flex-col gap-2.5 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="w-12 h-12 rounded-lg object-cover border border-subtle shrink-0" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-surface border border-subtle flex items-center justify-center shrink-0">
                          <Tag className="w-5 h-5 text-muted" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-[10px] font-black rounded border uppercase tracking-wider ${getVerdictStyle(item.verdict)}`}>
                            {item.verdict}
                          </span>
                          <span className="text-[10px] text-muted font-mono">
                            {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-primary truncate">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-secondary mt-0.5 font-mono">
                          Sale: ${item.lowSale} - ${item.highSale} • Net: ${item.netProfit.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Bookmark action */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onToggleWatchlist(item.id)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          item.isWatchlist
                            ? 'bg-indigo-950/60 border-indigo-700/60 text-indigo-300'
                            : 'bg-surface border-subtle text-muted hover:text-primary'
                        }`}
                        title={item.isWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${item.isWatchlist ? 'fill-indigo-300' : ''}`} />
                      </button>
                      <button
                        onClick={() => onDeleteAppraisal(item.id)}
                        className="p-1.5 rounded-lg border border-subtle bg-surface text-muted hover:text-red-400 transition-colors"
                        title="Delete from History"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Financial Quick Glance */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-subtle/70 text-center font-mono text-[11px]">
                    <div className="bg-surface/60 p-1.5 rounded border border-subtle/50">
                      <span className="text-[9px] text-muted block font-sans uppercase font-bold">Max Buy</span>
                      <span className="text-primary font-bold">${maxBuy.toFixed(2)}</span>
                    </div>
                    <div className="bg-surface/60 p-1.5 rounded border border-subtle/50">
                      <span className="text-[9px] text-muted block font-sans uppercase font-bold">Est. Net</span>
                      <span className={item.netProfit >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        ${item.netProfit.toFixed(2)}
                      </span>
                    </div>
                    <div className="bg-surface/60 p-1.5 rounded border border-subtle/50">
                      <span className="text-[9px] text-muted block font-sans uppercase font-bold">
                        {hasCost ? 'ROI' : 'Confidence'}
                      </span>
                      <span className="text-accent font-bold">
                        {hasCost ? `${item.roi >= 0 ? '+' : ''}${item.roi.toFixed(0)}%` : `${item.confidence}%`}
                      </span>
                    </div>
                  </div>

                  {/* Open in Workspace */}
                  <button
                    onClick={() => {
                      onSelectAppraisal(item);
                      onClose();
                    }}
                    className="w-full py-2 bg-surface hover:bg-surface-hover text-primary hover:text-accent border border-subtle rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 mt-1"
                  >
                    <span>Reopen in Results & Listing</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
