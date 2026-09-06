import React, { useState } from 'react';
import { Archive, Search, Trash2, Download, Filter, Zap, Clock, TrendingUp, AlertTriangle, ChevronRight, Check, Camera } from 'lucide-react';
import { InventoryItem, InventoryStatus } from '../types';
import { exportInventoryCSV } from '../utils/inventory';

interface Props {
  items: InventoryItem[];
  onUpdate: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onOpen: (item: InventoryItem) => void;
}

type ViewMode = 'all' | 'action_required' | 'highest_roi' | 'stale_listings' | 'trapped_money';

export default function InventoryView({ items, onUpdate, onDelete, onOpen }: Props) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('action_required');

  // Core metrics
  const totalInvested = items.reduce((sum, item) => sum + item.purchasePrice, 0);
  const projectedNet = items.reduce((sum, item) => sum + item.expectedNetProfit, 0);
  const avgROI = totalInvested > 0 ? (projectedNet / totalInvested) * 100 : 0;
  
  const staleCount = items.filter(i => {
    const daysOld = (new Date().getTime() - new Date(i.createdAt).getTime()) / (1000 * 3600 * 24);
    return daysOld > 30 && i.status !== 'Sold' && i.status !== 'Passed';
  }).length;

  const getFilteredItems = () => {
    let filtered = [...items];
    
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(q) ||
        item.likelyIdentification.toLowerCase().includes(q) ||
        item.decision?.nextBestAction?.toLowerCase().includes(q)
      );
    }

    switch (viewMode) {
      case 'action_required':
        return filtered.filter(i => i.status === 'Needs Research' || i.status === 'Needs Photos' || i.status === 'Draft Ready');
      case 'highest_roi':
        return filtered.filter(i => i.status !== 'Sold' && i.status !== 'Passed').sort((a, b) => b.expectedROI - a.expectedROI);
      case 'stale_listings':
        return filtered.filter(i => {
          const daysOld = (new Date().getTime() - new Date(i.createdAt).getTime()) / (1000 * 3600 * 24);
          return daysOld > 30 && i.status !== 'Sold' && i.status !== 'Passed';
        });
      case 'trapped_money':
        return filtered.filter(i => i.status !== 'Sold' && i.status !== 'Passed').sort((a, b) => b.purchasePrice - a.purchasePrice);
      case 'all':
      default:
        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  };

  const filtered = getFilteredItems();

  const handleStatusAdvance = (item: InventoryItem) => {
    const statuses: InventoryStatus[] = ['Needs Research', 'Needs Photos', 'Ready to List', 'Draft Ready', 'Listed', 'Sold'];
    const currentIndex = statuses.indexOf(item.status);
    if (currentIndex >= 0 && currentIndex < statuses.length - 1) {
      onUpdate({
        ...item,
        status: statuses[currentIndex + 1],
        updatedAt: new Date().toISOString()
      });
    }
  };

  const getStatusColor = (status: InventoryStatus) => {
    switch(status) {
      case 'Needs Research': return 'bg-amber-950/40 border border-amber-900/50 text-amber-400 border-amber-200';
      case 'Needs Photos': return 'bg-blue-950/40 border border-blue-900/50 text-blue-800 border-blue-200';
      case 'Ready to List': 
      case 'Draft Ready': return 'bg-indigo-950/40 border border-indigo-900/50 text-indigo-800 border-indigo-200';
      case 'Listed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Sold': return 'bg-zinc-800 text-primary border-slate-900';
      default: return 'bg-surface-hover text-primary border-subtle';
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-display font-black tracking-tight text-primary">Command Center</h2>
          <p className="text-sm text-secondary font-medium">Turn inventory into cash faster.</p>
        </div>
        <button 
          onClick={() => exportInventoryCSV(items)}
          className="flex items-center gap-2 px-3 py-2 bg-surface border border-subtle rounded-lg text-sm font-bold tracking-tight text-primary hover:bg-canvas "
        >
          <Download className="w-4 h-4" /> CSV Export
        </button>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card-3d p-4 ">
          <p className="text-[10px] font-bold tracking-tight text-secondary uppercase tracking-wider mb-1">Trapped Capital</p>
          <p className="font-mono">${totalInvested.toFixed(2)}</p>
        </div>
        <div className="card-3d p-4 ">
          <p className="text-[10px] font-bold tracking-tight text-secondary uppercase tracking-wider mb-1">Projected Net</p>
          <p className="font-mono">${projectedNet.toFixed(2)}</p>
        </div>
        <div className="card-3d p-4 ">
          <p className="text-[10px] font-bold tracking-tight text-secondary uppercase tracking-wider mb-1">Portfolio ROI</p>
          <p className="text-2xl font-display font-black tracking-tight text-accent">{avgROI.toFixed(0)}%</p>
        </div>
        <div className="bg-amber-950/20 p-4 rounded-xl border border-amber-200 ">
          <p className="text-[10px] font-bold tracking-tight text-amber-400 uppercase tracking-wider mb-1">Stale Listings</p>
          <p className="text-2xl font-display font-black tracking-tight text-amber-900">{staleCount}</p>
        </div>
      </div>

      {/* Smart Queues */}
      <div className="bg-surface border border-subtle rounded-xl  overflow-hidden flex flex-wrap">
        <button 
          onClick={() => setViewMode('action_required')}
          className={`flex-1 py-3 px-4 text-xs font-display font-black tracking-tight uppercase tracking-wider border-b-2 transition-colors ${viewMode === 'action_required' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-secondary hover:bg-canvas'}`}
        >
          Do This Today
        </button>
        <button 
          onClick={() => setViewMode('highest_roi')}
          className={`flex-1 py-3 px-4 text-xs font-display font-black tracking-tight uppercase tracking-wider border-b-2 transition-colors ${viewMode === 'highest_roi' ? 'border-emerald-600 text-emerald-700 bg-emerald-50' : 'border-transparent text-secondary hover:bg-canvas'}`}
        >
          Highest ROI
        </button>
        <button 
          onClick={() => setViewMode('stale_listings')}
          className={`flex-1 py-3 px-4 text-xs font-display font-black tracking-tight uppercase tracking-wider border-b-2 transition-colors ${viewMode === 'stale_listings' ? 'border-amber-600 text-amber-400 bg-amber-950/20' : 'border-transparent text-secondary hover:bg-canvas'}`}
        >
          Stale
        </button>
        <button 
          onClick={() => setViewMode('all')}
          className={`flex-1 py-3 px-4 text-xs font-display font-black tracking-tight uppercase tracking-wider border-b-2 transition-colors ${viewMode === 'all' ? 'border-slate-800 text-primary bg-surface-hover' : 'border-transparent text-secondary hover:bg-canvas'}`}
        >
          All Items
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted" />
        </div>
        <input
          type="text"
          placeholder="Search titles, descriptions, next actions..."
          className="w-full pl-10 pr-4 py-3 bg-surface border border-subtle rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Item List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-surface border border-subtle rounded-xl border-dashed">
            <Archive className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="text-lg font-bold tracking-tight text-secondary">No items match this view</p>
          </div>
        ) : (
          filtered.map(item => (
            <div key={item.id} className="bg-surface border border-subtle rounded-xl p-4  flex flex-col sm:flex-row gap-4 relative overflow-hidden group">
              {/* Image Thumbnail */}
              <div className="w-full sm:w-32 h-32 bg-surface-hover rounded-lg shrink-0 overflow-hidden relative">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted">
                    <Camera className="w-8 h-8 opacity-20" />
                  </div>
                )}
                {/* Age Badge */}
                {(() => {
                  const daysOld = Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / (1000 * 3600 * 24));
                  if (daysOld > 14 && item.status !== 'Sold') {
                    return (
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 backdrop-blur text-primary text-[10px] font-display font-black tracking-tight rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {daysOld}d
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
              
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-display font-black tracking-tight text-primary text-lg leading-tight line-clamp-1">{item.title}</h3>
                    <button 
                      onClick={() => onDelete(item.id)}
                      aria-label={`Delete ${item.title}`}
                      title="Delete item"
                      className="text-muted hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-display font-black tracking-tight uppercase tracking-wider border ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                    <span className="px-2 py-0.5 bg-surface-hover text-secondary rounded text-[10px] font-bold tracking-tight uppercase border border-subtle">
                      Cost: ${item.purchasePrice}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold tracking-tight uppercase border border-emerald-200">
                      Net: ${item.expectedNetProfit?.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-lg flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="bg-blue-200 text-blue-800 p-1.5 rounded shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-tight text-blue-500 uppercase tracking-wider mb-0.5">Next Best Action</p>
                      <p className="text-sm font-bold tracking-tight text-blue-900 leading-snug">
                        {item.decision?.nextBestAction || 'Needs manual review'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onOpen(item)}
                      className="bg-surface border border-subtle text-primary hover:bg-canvas hover:text-primary px-3 py-1.5 rounded-md text-xs font-display font-black tracking-tight uppercase tracking-wider transition-colors  shrink-0"
                    >
                      Open
                    </button>
                    {item.status !== 'Sold' && item.status !== 'Passed' && (
                      <button 
                        onClick={() => handleStatusAdvance(item)}
                        className="bg-surface border border-blue-200 text-blue-700 hover:bg-accent hover:text-primary px-3 py-1.5 rounded-md text-xs font-display font-black tracking-tight uppercase tracking-wider transition-colors  flex items-center gap-1 shrink-0"
                      >
                        Advance <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
