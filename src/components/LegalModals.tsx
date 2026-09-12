import React from 'react';
import { X, ShieldCheck, Scale, Lock, HelpCircle, Mail, ExternalLink, CheckCircle2, FileText } from 'lucide-react';

export type LegalModalType = 'terms' | 'privacy' | 'disclaimer' | 'support' | null;

interface LegalModalProps {
  type: LegalModalType;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-subtle w-full max-w-2xl max-h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-subtle bg-canvas/50">
          <div className="flex items-center gap-2.5">
            {type === 'terms' && <Scale className="w-5 h-5 text-accent" />}
            {type === 'privacy' && <Lock className="w-5 h-5 text-emerald-400" />}
            {type === 'disclaimer' && <ShieldCheck className="w-5 h-5 text-amber-400" />}
            {type === 'support' && <HelpCircle className="w-5 h-5 text-blue-400" />}
            
            <h2 className="text-lg font-bold tracking-tight text-primary">
              {type === 'terms' && 'Terms of Service'}
              {type === 'privacy' && 'Privacy Policy'}
              {type === 'disclaimer' && 'Valuation & Legal Disclaimers'}
              {type === 'support' && 'Help & Customer Support'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-primary rounded-lg hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm leading-relaxed text-secondary">
          
          {/* TERMS OF SERVICE */}
          {type === 'terms' && (
            <>
              <p className="font-medium text-primary">
                Last Updated: March 2026. By accessing or using LootLedger ("the Service"), you agree to be bound by these Terms.
              </p>
              
              <section className="space-y-2">
                <h3 className="font-bold text-primary text-base">1. Nature of the Service</h3>
                <p>
                  LootLedger is a decision-support and workflow software for collectors, estate liquidators, antique dealers, and resellers. All appraisals, valuations, market comp syntaxes, and cross-listing copy are generated through automated algorithmic and heuristic models for preliminary sourcing insights.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-primary text-base">2. No Guarantee of Sale or Valuation</h3>
                <p>
                  LootLedger does NOT guarantee that any item analyzed will sell for the estimated price or sell on any platform. Resale markets fluctuate based on condition, buyer demand, season, location, and economic conditions. Users assume 100% of the financial risk of their sourcing, purchasing, and pricing decisions.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-primary text-base">3. Authentication & Counterfeit Items</h3>
                <p>
                  The automated authenticity risk scores and flags provided by the Service are non-definitive indicators based on visual pattern matching. They do NOT constitute a physical certification of authenticity. You are solely responsible for ensuring that goods you purchase or resell do not violate third-party trademark rights or counterfeit laws.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-primary text-base">4. User Account & Data Storage</h3>
                <p>
                  Users may use the app as a guest (data stored locally in browser) or sign in via Google Authentication to synchronize inventory records to their private Firebase Firestore store. You are responsible for safeguarding your credentials.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-primary text-base">5. Limitation of Liability</h3>
                <p>
                  To the maximum extent permitted by applicable law, LootLedger and its operators shall not be liable for any indirect, punitive, incidental, special, or consequential damages resulting from the use or inability to use the Service.
                </p>
              </section>
            </>
          )}

          {/* PRIVACY POLICY */}
          {type === 'privacy' && (
            <>
              <p className="font-medium text-primary">
                Last Updated: March 2026. Your privacy is paramount. LootLedger treats your inventory records and commercial sourcing insights with strict confidentiality.
              </p>

              <section className="space-y-2">
                <h3 className="font-bold text-primary text-base">1. Information We Collect</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Account Information:</strong> When signing in with Google, we receive your public profile identifier (email, display name, user UID).</li>
                  <li><strong>Uploaded Media:</strong> Photographs you capture or upload for appraisal are processed server-side through Google Gemini APIs to extract visual traits and comps.</li>
                  <li><strong>Inventory Records:</strong> Item titles, notes, cost paid, and status flags created by you are saved under your private user UID in Firebase Firestore.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-primary text-base">2. How We Use Data</h3>
                <p>
                  We use your data solely to provide appraisal analysis, compute financial ROI metrics, generate listing drafts, and persist your inventory catalog across sessions. We DO NOT sell, rent, or monetize your personal data or sourcing records.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-primary text-base">3. Security & Cloud Storage</h3>
                <p>
                  User data is protected via Firestore Security Rules where each user can only read and write their own documents (<code className="bg-canvas px-1.5 py-0.5 rounded text-primary">users/&#123;userId&#125;/**</code>). All server-to-client communications are encrypted over TLS.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-primary text-base">4. Data Deletion</h3>
                <p>
                  You may delete any individual inventory item at any time from the Command Center, which immediately removes it from Firestore. To request complete account deletion, contact support below.
                </p>
              </section>
            </>
          )}

          {/* VALUATION DISCLAIMER */}
          {type === 'disclaimer' && (
            <>
              <div className="bg-amber-950/30 border border-amber-800/60 p-4 rounded-xl text-amber-200">
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Non-Definitive Valuation Notice
                </p>
                <p className="text-xs text-secondary leading-relaxed">
                  LootLedger is an algorithmic decision-support tool. It does not provide certified physical appraisal documents or formal authentication certificates.
                </p>
              </div>

              <section className="space-y-2">
                <h3 className="font-bold text-primary text-base">Independent Professional Appraisals</h3>
                <p>
                  For items of substantial historical importance, high-value fine art, certified investment numismatics, or fine jewelry, users should consult certified specialists accredited by the International Society of Appraisers (ISA), the Appraisers Association of America (AAA), or the American Society of Appraisers (ASA).
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-primary text-base">Counterfeit High-Exposure Warning</h3>
                <p>
                  Items identified with counterfeit-prone designer trademarks (such as Rolex, Louis Vuitton, Chanel, Cartier, Hermès) cannot be definitively certified by photographs alone. Physical hallmarks, weight, serial fonts, metal purity, and interior stitching require hands-on inspection.
                </p>
              </section>
            </>
          )}

          {/* SUPPORT & CONTACT */}
          {type === 'support' && (
            <>
              <p className="font-medium text-primary">
                Need assistance with your inventory, an appraisal query, or account settings? Our team is here to support your workflow.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-canvas border border-subtle p-4 rounded-xl space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">Email Support</p>
                  <p className="font-bold text-primary">dialsandrew0@gmail.com</p>
                  <p className="text-xs text-secondary">General inquiries & feedback</p>
                </div>
                <div className="bg-canvas border border-subtle p-4 rounded-xl space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">Technical Status</p>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Systems Operational
                  </div>
                  <p className="text-xs text-secondary">Cloud Run & Firestore Live</p>
                </div>
              </div>

              <div className="bg-surface-hover border border-subtle p-4 rounded-xl space-y-2 text-xs">
                <p className="font-bold text-primary text-sm">Frequently Asked Questions</p>
                <p>
                  <strong>Q: How do I backup my inventory?</strong><br />
                  Navigate to the Inventory tab and click "CSV Export". This generates a full spreadsheet of all your items, purchase costs, expected profit, and listing notes.
                </p>
                <p>
                  <strong>Q: Why is my appraisal marked "Conditional"?</strong><br />
                  When items have high counterfeit exposure or missing internal hallmarks/tags, LootLedger flags them as conditional until verified with physical proofs.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-subtle bg-canvas/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-accent hover:bg-accent-hover text-primary font-bold text-sm rounded-xl transition-colors"
          >
            Understood
          </button>
        </div>

      </div>
    </div>
  );
};
