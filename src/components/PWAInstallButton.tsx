import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 border border-accent bg-accent/10 px-4 py-2 text-xs font-mono font-bold text-accent hover:bg-accent/20 transition-colors"
      >
        <Download className="w-4 h-4" />
        INSTALL APP
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 border border-accent bg-accent/10 px-4 py-2 text-xs font-mono font-bold text-accent hover:bg-accent/20 transition-colors"
        >
          <Download className="w-4 h-4" />
          INSTALL ON IOS
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm border border-subtle bg-surface p-6 shadow-2xl relative">
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-secondary hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-display font-black text-primary tracking-tight">Install on iPhone / iPad</h3>
              <p className="mt-4 text-sm text-secondary font-medium leading-relaxed">
                1. Tap the <strong className="text-primary">Share</strong> button in the Safari toolbar.<br /><br />
                2. Scroll down and tap <strong className="text-primary">Add to Home Screen</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full bg-accent py-2 text-sm font-mono font-bold text-accent-fg hover:bg-accent-hover transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
