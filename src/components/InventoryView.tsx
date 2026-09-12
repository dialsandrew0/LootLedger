import React, { useState } from 'react';
import { 
  Archive, 
  Search, 
  Trash2, 
  Download, 
  Zap, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  ChevronRight, 
  Check, 
  Camera, 
  Edit3, 
  X, 
  Save,
  Tag,
  ExternalLink
} from 'lucide-react';
import { InventoryItem, InventoryStatus } from '../types';
import { exportInventoryCSV } from '../utils/inventory';
import { telemetry } from '../lib/telemetry';

interface Props {
  items: InventoryItem[];
  onUpdate: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onOpen: (item: InventoryItem) => void;
}

type ViewMode = 'all' | 'action_required' | 'watchlist' | 'highest_roi' | 'stale_listings' | 'trapped_money';

const ALL_STATUSES: InventoryStatus[] = [
  'Needs Research',
  'Needs Photos',
  'Ready to List',
  'Draft Ready',
  'Listed',
  'Offer Received',
  'Sold',
  'Needs Relist',
  'Bundle Candidate',
  'Markdown Candidate',
  'Watchlist',
  'Reconsider',
  'Passed'
];

export default function InventoryView({ items, onUpdate, onDelete, onOpen }: Props) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('action_required');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Core metrics
  const totalInvested = items.reduce((sum, item) => sum + (Number(item.purchasePrice) || 0), 0);
  const projectedNet = items.reduce((sum, item) => sum + (Number(item.expectedNetProfit) || 0), 0);
  const avgROI = totalInvested > 0 ? (projectedNet / totalInvested) * 100 : 0;
  
  const staleCount = items.filter(i => {
    const daysOld = (new Date().getTime() - new Date(i.createdAt).getTime()) / (1000 * 3600 * 24);
    return daysOld > 30 && i.status !== 'Sold' && i.status !== 'Passed';
  }).length;

  const getFilteredItems = () => {
    let filtered = [...items];
    
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(item => 
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.likelyIdentification && item.likelyIdentification.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q)) ||
        (item.decision?.nextBestAction && item.decision.nextBestAction.toLowerCase().includes(q))
      );
    }

    switch (viewMode) {
      case 'action_required':
        return filtered.filter(i => i.status === 'Needs Research' || i.status === 'Needs Photos' || i.status === 'Draft Ready');
      case 'watchlist':
        return filtered.filter(i => i.status === 'Watchlist' || i.status === 'Reconsider');
      case 'highest_roi':
        return filtered.filter(i => i.status !== 'Sold' && i.status !== 'Passed').sort((a, b) => (b.expectedROI || 0) - (a.expectedROI || 0));
      case 'stale_listings':
        return filtered.filter(i => {
          const daysOld = (new Date().getTime() - new Date(i.createdAt).getTime()) / (1000 * 3600 * 24);
          return daysOld > 30 && i.status !== 'Sold' && i.status !== 'Passed';
        });
      case 'trapped_money':
        return filtered.filter(i => i.status !== 'Sold' && i.status !== 'Passed').sort((a, b) => (b.purchasePrice || 0) - (a.purchasePrice || 0));
      case 'all':
      default:
        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  };

  const filtered = getFilteredItems();

  const handleStatusChange = (item: InventoryItem, newStatus: InventoryStatus) => {
    const updated: InventoryItem = {
      ...item,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      activityTimeline: [
        ...(item.activityTimeline || []),
        { date: new Date().toISOString(), action: `Status changed to ${newStatus}` }
      ]
    };
    onUpdate(updated);
    telemetry.track({
      name: 'inventory_item_updated',
      data: { itemId: item.id, newStatus }
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const updated: InventoryItem = {
      ...editingItem,
      updatedAt: new Date().toISOString(),
      purchasePrice: Number(editingItem.purchasePrice) || 0,
      expectedEstimate: Number(editingItem.expectedEstimate) || 0,
      expectedNetProfit: Number(editingItem.expectedNetProfit) || 0,
    };

    onUpdate(updated);
    setEditingItem(null);
  };

  const confirmDelete = (id: string) => {
    onDelete(id);
    setDeletingId(null);
    telemetry.track({
      name: 'inventory_item_deleted',
      data: { itemId: id }
    });
  };

  const getStatusBadge = (status: InventoryStatus) => {
    switch(status) {
      case 'Needs Research': return 'bg-amber-950/40 text-amber-300 border-amber-800/50';
      case 'Needs Photos': return 'bg-blue-950/40 text-blue-300 border-blue-800/50';
      case 'Ready to List': 
      case 'Draft Ready': return 'bg-purple-950/40 text-purple-300 border-purple-800/50';
      case 'Listed': return 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50';
      case 'Watchlist': return 'bg-indigo-950/40 text-indigo-300 border-indigo-800/50';
      case 'Reconsider': return 'bg-amber-950/40 text-amber-300 border-amber-800/50';
      case 'Sold': return 'bg-zinc-800 text-zinc-300 border-zinc-700';
      case 'Passed': return 'bg-red-950/40 text-red-300 border-red-800/50';
      default: return 'bg-surface-hover text-secondary border-subtle';
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* Header & CSV Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-display font-black tracking-tight text-primary">Command Center</h2>
          <p className="text-sm text-secondary font-medium">Turn inventory into profit with disciplined workflow tracking.</p>
        </div>
        <button 
          onClick={() => {
            exportInventoryCSV(items);
            telemetry.track({ name: 'inventory_exported_csv', data: { itemCount: items.length } });
          }}
          disabled={items.length === 0}
          className="flex items-center gap-2 px-3.5 py-2 bg-surface hover:bg-surface-hover border border-subtle rounded-xl text-sm font-bold tracking-tight text-primary transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-accent" /> CSV Export ({items.length})
        </button>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card-3d p-4">
          <p className="text-[10px] font-bold tracking-tight text-secondary uppercase tracking-wider mb-1">Trapped Capital</p>
          <p className="font-mono text-xl text-primary font-bold">${totalInvested.toFixed(2)}</p>
        </div>
        <div className="card-3d p-4">
          <p className="text-[10px] font-bold tracking-tight text-secondary uppercase tracking-wider mb-1">Projected Net Profit</p>
          <p className="font-mono text-xl text-emerald-400 font-bold">${projectedNet.toFixed(2)}</p>
        </div>
        <div className="card-3d p-4">
          <p className="text-[10px] font-bold tracking-tight text-secondary uppercase tracking-wider mb-1">Portfolio ROI</p>
          <p className="text-xl font-display font-black tracking-tight text-accent">{avgROI.toFixed(0)}%</p>
        </div>
        <div className="card-3d p-4">
          <p className="text-[10px] font-bold tracking-tight text-secondary uppercase tracking-wider mb-1">Stale Listings (&gt;30d)</p>
          <p className="text-xl font-display font-black tracking-tight text-amber-400">{staleCount}</p>
        </div>
      </div>

      {/* Smart Filter Queues */}
      <div className="bg-surface border border-subtle rounded-xl overflow-hidden flex flex-wrap">
        <button 
          onClick={() => setViewMode('action_required')}
          className={`flex-1 py-3 px-3 text-xs font-display font-black tracking-tight uppercase tracking-wider border-b-2 transition-colors ${
            viewMode === 'action_required' 
              ? 'border-accent text-accent bg-accent/10' 
              : 'border-transparent text-secondary hover:bg-canvas'
          }`}
        >
          Action Required
        </button>
        <button 
          onClick={() => setViewMode('watchlist')}
          className={`flex-1 py-3 px-3 text-xs font-display font-black tracking-tight uppercase tracking-wider border-b-2 transition-colors ${
            viewMode === 'watchlist' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20' 
              : 'border-transparent text-secondary hover:bg-canvas'
          }`}
        >
          Watchlist ({items.filter(i => i.status === 'Watchlist' || i.status === 'Reconsider').length})
        </button>
        <button 
          onClick={() => setViewMode('highest_roi')}
          className={`flex-1 py-3 px-3 text-xs font-display font-black tracking-tight uppercase tracking-wider border-b-2 transition-colors ${
            viewMode === 'highest_roi' 
              ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20' 
              : 'border-transparent text-secondary hover:bg-canvas'
          }`}
        >
          Highest ROI
        </button>
        <button 
          onClick={() => setViewMode('stale_listings')}
          className={`flex-1 py-3 px-3 text-xs font-display font-black tracking-tight uppercase tracking-wider border-b-2 transition-colors ${
            viewMode === 'stale_listings' 
              ? 'border-amber-500 text-amber-400 bg-amber-950/20' 
              : 'border-transparent text-secondary hover:bg-canvas'
          }`}
        >
          Stale (&gt;30d)
        </button>
        <button 
          onClick={() => setViewMode('trapped_money')}
          className={`flex-1 py-3 px-3 text-xs font-display font-black tracking-tight uppercase tracking-wider border-b-2 transition-colors ${
            viewMode === 'trapped_money' 
              ? 'border-purple-500 text-purple-400 bg-purple-950/20' 
              : 'border-transparent text-secondary hover:bg-canvas'
          }`}
        >
          Trapped Money
        </button>
        <button 
          onClick={() => setViewMode('all')}
          className={`flex-1 py-3 px-3 text-xs font-display font-black tracking-tight uppercase tracking-wider border-b-2 transition-colors ${
            viewMode === 'all' 
              ? 'border-primary text-primary bg-surface-hover' 
              : 'border-transparent text-secondary hover:bg-canvas'
          }`}
        >
          All Items ({items.length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted" />
        </div>
        <input
          type="text"
          placeholder="Search by title, brand, notes, or next action..."
          className="w-full pl-10 pr-4 py-2.5 bg-surface border border-subtle rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent font-medium text-sm text-primary placeholder-muted"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Item List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-surface border border-subtle rounded-xl border-dashed">
            <Archive className="w-12 h-12 text-muted mx-auto mb-3 opacity-40" />
            <p className="text-base font-bold tracking-tight text-primary">No inventory items in this view</p>
            <p className="text-xs text-secondary mt-1">Scan an item or switch to another queue filter.</p>
          </div>
        ) : (
          filtered.map(item => {
            const daysOld = Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / (1000 * 3600 * 24));
            
            return (
              <div key={item.id} className="bg-surface border border-subtle rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 relative overflow-hidden transition-all hover:border-subtle/80">
                {/* Thumbnail */}
                <div className="w-full sm:w-32 h-32 bg-canvas rounded-lg shrink-0 overflow-hidden relative border border-subtle flex items-center justify-center">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-muted opacity-30" />
                  )}
                  {daysOld > 14 && item.status !== 'Sold' && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/80 backdrop-blur text-primary text-[10px] font-mono font-bold rounded flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" /> {daysOld}d
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h3 className="font-bold tracking-tight text-primary text-base leading-snug line-clamp-1">
                        {item.title || 'Untitled Item'}
                      </h3>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 text-secondary hover:text-primary rounded hover:bg-canvas transition-colors"
                          title="Edit Item"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeletingId(item.id)}
                          className="p-1.5 text-muted hover:text-red-400 rounded hover:bg-canvas transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Status & Metrics Chips */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item, e.target.value as InventoryStatus)}
                        className={`text-[11px] font-bold uppercase tracking-wider py-0.5 px-2 rounded border transition-colors cursor-pointer bg-canvas ${getStatusBadge(item.status)}`}
                      >
                        {ALL_STATUSES.map(s => (
                          <option key={s} value={s} className="bg-surface text-primary">{s}</option>
                        ))}
                      </select>

                      <span className="px-2 py-0.5 bg-canvas text-secondary rounded text-[11px] font-mono font-medium border border-subtle">
                        Cost: ${(Number(item.purchasePrice) || 0).toFixed(2)}
                      </span>

                      <span className="px-2 py-0.5 bg-canvas text-emerald-400 rounded text-[11px] font-mono font-medium border border-subtle">
                        Est Net: ${(Number(item.expectedNetProfit) || 0).toFixed(2)}
                      </span>

                      {item.expectedROI !== undefined && (
                        <span className="px-2 py-0.5 bg-canvas text-accent rounded text-[11px] font-mono font-medium border border-subtle">
                          ROI: {item.expectedROI.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Next Best Action Banner */}
                  <div className="bg-canvas border border-subtle p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Next Best Action</p>
                        <p className="text-xs font-semibold text-primary leading-snug">
                          {item.decision?.nextBestAction || 'Review listing parameters and photos.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button 
                        onClick={() => onOpen(item)}
                        className="bg-surface border border-subtle text-primary hover:bg-surface-hover px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        Open Workspace
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface border border-subtle p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-primary text-base">Delete Item?</h3>
            </div>
            <p className="text-xs text-secondary leading-relaxed">
              This will permanently delete this inventory record from your catalog and Cloud database. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 bg-surface hover:bg-surface-hover border border-subtle text-secondary font-semibold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deletingId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface border border-subtle rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <h3 className="font-bold text-primary text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-accent" /> Edit Inventory Item
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-secondary hover:text-primary rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">
                  Item Title
                </label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full bg-canvas border border-subtle rounded-xl p-3 text-sm text-primary font-medium focus:ring-2 focus:ring-accent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">
                    Purchase Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.purchasePrice}
                    onChange={(e) => setEditingItem({ ...editingItem, purchasePrice: Number(e.target.value) })}
                    className="w-full bg-canvas border border-subtle rounded-xl p-3 text-sm font-mono text-primary focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">
                    Expected Sale ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.expectedEstimate}
                    onChange={(e) => setEditingItem({ ...editingItem, expectedEstimate: Number(e.target.value) })}
                    className="w-full bg-canvas border border-subtle rounded-xl p-3 text-sm font-mono text-primary focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">
                  Workflow Status
                </label>
                <select
                  value={editingItem.status}
                  onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as InventoryStatus })}
                  className="w-full bg-canvas border border-subtle rounded-xl p-3 text-sm font-medium text-primary focus:ring-2 focus:ring-accent"
                >
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">
                  Private Reseller Notes
                </label>
                <textarea
                  rows={3}
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  placeholder="Storage bin location, lot number, provenance history..."
                  className="w-full bg-canvas border border-subtle rounded-xl p-3 text-sm text-primary focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-surface hover:bg-surface-hover border border-subtle text-secondary font-semibold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent hover:bg-accent-hover text-primary font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
