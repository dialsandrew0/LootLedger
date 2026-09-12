import React, { useState, useEffect } from 'react';
import { Settings, Save, Check, RotateCcw, Shield, Database, User, Mail, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserPreferences } from '../types';
import { telemetry } from '../lib/telemetry';

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultMarketplace: 'eBay',
  defaultFeePercent: 13.25,
  defaultPackingCost: 1.50,
  desiredMinProfit: 20.00,
  desiredMinROI: 50,
  autoOptimizePhotos: true,
  supportedPlatforms: ['eBay', 'Facebook Marketplace', 'Mercari', 'Poshmark', 'Etsy']
};

interface Props {
  onSaved?: (prefs: UserPreferences) => void;
}

export const SettingsView: React.FC<Props> = ({ onSaved }) => {
  const { user, signOut, signInWithGoogle } = useAuth();
  const [prefs, setPrefs] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem('loot_ledger_user_prefs');
      if (stored) return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    } catch {
      // ignore
    }
    return DEFAULT_PREFERENCES;
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    try {
      localStorage.setItem('loot_ledger_user_prefs', JSON.stringify(prefs));
      telemetry.track({
        name: 'settings_updated',
        data: {
          defaultMarketplace: prefs.defaultMarketplace,
          feePercent: prefs.defaultFeePercent
        }
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      if (onSaved) onSaved(prefs);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    }
  };

  const handleResetDefaults = () => {
    setPrefs(DEFAULT_PREFERENCES);
    localStorage.removeItem('loot_ledger_user_prefs');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    if (onSaved) onSaved(DEFAULT_PREFERENCES);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-display font-black tracking-tight text-primary flex items-center gap-2">
            <Settings className="w-5 h-5 text-accent" /> Preferences & Settings
          </h2>
          <p className="text-sm text-secondary font-medium">Configure your default margins and financial assumptions.</p>
        </div>
        
        <button
          onClick={handleResetDefaults}
          className="text-xs font-bold text-secondary hover:text-primary flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-subtle rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
        </button>
      </div>

      {/* Account Section */}
      <div className="card-3d p-5 space-y-4">
        <h3 className="text-xs font-bold tracking-tight text-secondary uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-accent" /> Account & Cloud Synchronization
        </h3>

        {user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-canvas p-3.5 rounded-xl border border-subtle">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full border border-subtle" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/40 text-accent font-bold flex items-center justify-center">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-bold text-primary text-sm">{user.displayName || 'Reseller Operator'}</p>
                <p className="text-xs text-secondary font-mono">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Cloud Synced
              </span>
              <button
                onClick={signOut}
                className="px-3 py-1.5 bg-surface hover:bg-surface-hover border border-subtle text-secondary hover:text-red-400 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-canvas p-4 rounded-xl border border-subtle space-y-3">
            <div>
              <p className="font-bold text-primary text-sm">Guest Mode (Local Storage)</p>
              <p className="text-xs text-secondary mt-0.5">
                Your inventory is currently stored in this browser only. Sign in with Google to enable automatic cloud backup across devices.
              </p>
            </div>
            <button
              onClick={signInWithGoogle}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-primary font-bold text-xs rounded-lg transition-colors flex items-center gap-2"
            >
              Sign In with Google for Cloud Sync
            </button>
          </div>
        )}
      </div>

      {/* Financial Assumptions */}
      <div className="card-3d p-5 space-y-4">
        <h3 className="text-xs font-bold tracking-tight text-secondary uppercase tracking-wider">
          Default Profit & Fee Defaults
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">
              Primary Marketplace
            </label>
            <select
              value={prefs.defaultMarketplace}
              onChange={(e) => setPrefs({ ...prefs, defaultMarketplace: e.target.value })}
              className="w-full bg-canvas border border-subtle rounded-xl p-3 text-sm font-semibold text-primary focus:ring-2 focus:ring-accent"
            >
              <option value="eBay">eBay</option>
              <option value="Facebook Marketplace">Facebook Marketplace</option>
              <option value="Mercari">Mercari</option>
              <option value="Poshmark">Poshmark</option>
              <option value="Etsy">Etsy</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">
              Platform Fee (%)
            </label>
            <input
              type="number"
              step="0.25"
              value={prefs.defaultFeePercent}
              onChange={(e) => setPrefs({ ...prefs, defaultFeePercent: Number(e.target.value) })}
              className="w-full bg-canvas border border-subtle rounded-xl p-3 text-sm font-mono text-primary focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">
              Packing Materials ($)
            </label>
            <input
              type="number"
              step="0.25"
              value={prefs.defaultPackingCost}
              onChange={(e) => setPrefs({ ...prefs, defaultPackingCost: Number(e.target.value) })}
              className="w-full bg-canvas border border-subtle rounded-xl p-3 text-sm font-mono text-primary focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">
              Target Minimum Profit ($)
            </label>
            <input
              type="number"
              step="5"
              value={prefs.desiredMinProfit}
              onChange={(e) => setPrefs({ ...prefs, desiredMinProfit: Number(e.target.value) })}
              className="w-full bg-canvas border border-subtle rounded-xl p-3 text-sm font-mono text-primary focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">
              Target Minimum ROI (%)
            </label>
            <input
              type="number"
              step="10"
              value={prefs.desiredMinROI}
              onChange={(e) => setPrefs({ ...prefs, desiredMinROI: Number(e.target.value) })}
              className="w-full bg-canvas border border-subtle rounded-xl p-3 text-sm font-mono text-primary focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="autoOptimize"
              checked={prefs.autoOptimizePhotos}
              onChange={(e) => setPrefs({ ...prefs, autoOptimizePhotos: e.target.checked })}
              className="w-4 h-4 rounded border-subtle text-accent focus:ring-accent bg-canvas"
            />
            <label htmlFor="autoOptimize" className="text-xs font-bold text-primary cursor-pointer">
              Auto-compress camera photos before upload
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {savedSuccess && (
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
            <Check className="w-4 h-4" /> Preferences saved!
          </span>
        )}
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-accent hover:bg-accent-hover text-primary font-display font-black text-sm rounded-xl transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> Save Preferences
        </button>
      </div>

    </div>
  );
};
