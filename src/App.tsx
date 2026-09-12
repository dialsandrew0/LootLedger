import React, { useState, useRef, useEffect } from 'react';
import { Camera, FileText, Tag, Archive, Loader2, Info, Copy, Check, Calculator, Search, Upload, X, ChevronDown, ChevronRight, AlertCircle, TrendingUp } from 'lucide-react';
import { ProfitAssumptions, ValuationResult, InventoryItem, NavItem } from './types';
import { fetchInventory, saveInventoryItemFirebase, deleteInventoryItemFirebase, updateInventoryItemFirebase } from './utils/inventory';
import { useAuth } from './contexts/AuthContext';
import { calculateFinancials, determineVerdict } from './utils/calculations';
import ProfitAssumptionsEditor from './components/ProfitAssumptionsEditor';
import QuickCalculator from './components/QuickCalculator';
import InventoryView from './components/InventoryView';
import { AnalyticsView } from './components/AnalyticsView';
import WhyThisEstimate from './components/WhyThisEstimate';
import { EditableField } from './components/EditableField';

import { FieldDecisionCard } from './components/FieldDecisionCard';
import { ListingTab } from './components/ListingTab';
import { PWAInstallButton } from './components/PWAInstallButton';

const defaultAssumptions: ProfitAssumptions = {
  marketplace: 'eBay',
  marketplaceFeePercent: 13.25,
  paymentProcessingFeePercent: 0,
  shippingChargedToBuyer: 0,
  estimatedShippingCost: 0,
  packingMaterialsCost: 1.5,
  salesTaxPaidAtPurchase: 0,
  desiredMinProfit: 20,
  desiredMinROI: 50,
};

export default function App() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [activeNav, setActiveNav] = useState<NavItem>('Scan');
  const [scanMode, setScanMode] = useState<'camera' | 'calculator'>('camera');
  
  // Intake state
  const [image, setImage] = useState<string | null>(null);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [category, setCategory] = useState<string>('Auto-detect');
  const [marks, setMarks] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [condition, setCondition] = useState<string>('Used');
  const [assumptions, setAssumptions] = useState<ProfitAssumptions>(defaultAssumptions);
  const [showNotes, setShowNotes] = useState(false);
  
  // Loading & Result state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ValuationResult | null>(null);
  
  // Inventory state
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [supportedPlatforms, setSupportedPlatforms] = useState<string[]>(['eBay', 'Facebook Marketplace', 'Mercari', 'Poshmark', 'Etsy']);
  const [copied, setCopied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchInventory()
        .then(setInventory)
        .catch(() => setError('We could not load your inventory. Please try again.'));
    } else {
      setInventory([]); // clear inventory on logout
    }
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setError(null);
      setResult(null);
      setSaveSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!image) {
      setError("Please add a photo first");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      const response = await fetch('/api/appraise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image, 
          category: category !== 'Auto-detect' ? category : undefined,
          marks: marks,
          condition: condition,
          targetPlatforms: supportedPlatforms,
          purchasePrice,
          assumptions 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze image');
      }
      
      setResult(data);
      setActiveNav('Results');
      window.scrollTo(0, 0);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToInventory = () => {
    if (!result) return;
    if (!user) {
      setError('Sign in to save this item to your inventory. Your appraisal is still available in this session.');
      return;
    }
    
    const fin = calculateFinancials(purchasePrice, result.pricing.expectedSale, assumptions);
    
    const newItem: InventoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: result.decision.recommendation === 'PASS' ? 'Passed' : 'Needs Research',
      title: result.identification.title,
      likelyIdentification: result.likelyIdentification,
      category: category,
      condition: condition,
      purchasePrice,
      image: image || undefined,
      marks,
      notes,
      lowEstimate: result.pricing.lowSale,
      expectedEstimate: result.pricing.expectedSale,
      highEstimate: result.pricing.highSale,
      expectedNetProfit: fin.netProfit,
      expectedROI: fin.roi,
      decision: result.decision,
      evidenceObserved: result.evidenceObserved,
      missingVerification: result.missingVerification,
            comparableSearchTerms: result.comparableSearchTerms,
      researchRecommendation: result.researchRecommendation,
      disclaimer: result.disclaimer,
      assumptions,
      listingDraft: result.listingDraft,
      platformStatuses: {},
      platformUrls: {},
      activityTimeline: [{ date: new Date().toISOString(), action: 'Sourced via Scan' }]
    };
    
    saveInventoryItemFirebase(newItem)
      .then(() => fetchInventory())
      .then((updated) => {
        setInventory(updated);
        setSaveSuccess(true);
        setTimeout(() => {
          setActiveNav('Inventory');
        }, 1500);
      })
      .catch(() => setError('We could not save this item. Please try again.'));
  };

  const loadItemToWorkspace = (item: InventoryItem) => {
    // Reconstruct a ValuationResult from the InventoryItem
    const reconstructedResult: ValuationResult = {
      identification: {
        title: item.title,
        brandOrMaker: '',
        modelOrEra: '',
        material: ''
      },
      identificationConfidence: 0.85,
      likelyIdentification: item.likelyIdentification,
            evidenceObserved: item.evidenceObserved || [],
      missingVerification: item.missingVerification || [],
      pricing: {
        lowSale: item.lowEstimate,
        expectedSale: item.expectedEstimate,
        highSale: item.highEstimate
      },
      comparableSearchTerms: item.comparableSearchTerms || [],
      decision: item.decision,
      listingDraft: item.listingDraft,
      researchRecommendation: item.researchRecommendation || '',
      disclaimer: item.disclaimer || '',
          };

    setResult(reconstructedResult);
    setImage(item.image || null);
    setPurchasePrice(item.purchasePrice);
    setCategory(item.category || 'Auto-detect');
    setCondition(item.condition || 'Used');
    setMarks(item.marks || '');
    setNotes(item.notes || '');
    if (item.assumptions) setAssumptions(item.assumptions);
    setSaveSuccess(true); // Already saved
    setActiveNav('Results');
  };

  
  const handleResultUpdate = (newResult: ValuationResult) => {
    setResult(newResult);
    
    // If it's already in inventory (has an active ID), update it there too
    // We can find it by checking if it matches the current inventory
    const existing = inventory.find(i => i.title === result?.identification.title && i.createdAt);
    if (existing) {
      handleInventoryUpdate({
        ...existing,
        title: newResult.identification.title,
        likelyIdentification: newResult.likelyIdentification,
        expectedEstimate: newResult.pricing.expectedSale,
        lowEstimate: newResult.pricing.lowSale,
        highEstimate: newResult.pricing.highSale,
        listingDraft: newResult.listingDraft,
        decision: newResult.decision
      });
    }
  };

  const handleInventoryUpdate = async (item: InventoryItem) => {
    if (!user) return;
    await updateInventoryItemFirebase(item);
    const updated = await fetchInventory();
    setInventory(updated);
  };

  const handleInventoryDelete = async (id: string) => {
    if (!user) return;
    await deleteInventoryItemFirebase(id);
    const updated = await fetchInventory();
    setInventory(updated);
  };

  const copyListing = () => {
    if (!result?.listingDraft) return;
    const text = `${result.listingDraft.title}\n\n${result.listingDraft.shortDescription}\n\nCondition: ${result.listingDraft.conditionDescription}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // derived data
  const fin = result ? calculateFinancials(purchasePrice, result.pricing.expectedSale, assumptions) : null;
  const verdictData = (result && fin) ? determineVerdict(fin.netProfit, fin.roi, result.confidenceLevel, result.riskFlags, result.missingVerification, assumptions) : null;

  return (
    <div className="min-h-screen bg-canvas text-primary font-sans pb-20 sm:pb-0">
      {/* Header */}
      <header className="bg-canvas border-b border-subtle sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-10 h-10">
              <rect width="100" height="100" fill="var(--color-accent)" />
              <path d="M30 70 L50 30 L70 70" stroke="var(--color-accent-fg)" strokeWidth="12" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
              <line x1="40" y1="50" x2="60" y2="50" stroke="var(--color-accent-fg)" strokeWidth="12" strokeLinecap="square" />
            </svg>
            <h1 className="font-display font-black text-3xl tracking-tight text-primary uppercase">Loot<span className="text-3d-pop ml-0.5">Ledger</span></h1>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden sm:flex items-center gap-1">
              {(['Scan', 'Results', 'Listing', 'Inventory', 'Analytics'] as NavItem[]).map((nav) => (
                <button
                  key={nav}
                  onClick={() => setActiveNav(nav)}
                  className={`px-5 py-2 text-sm font-bold tracking-wide transition-all uppercase ${
                    activeNav === nav 
                      ? 'text-accent border-b-2 border-accent' 
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  {nav}
                </button>
              ))}
            </nav>
            <div className="hidden sm:flex items-center gap-4 border-l border-subtle pl-6">
              <PWAInstallButton />
              {user ? (
                <button onClick={signOut} className="text-xs font-mono font-bold text-secondary hover:text-primary border border-subtle px-4 py-2 hover:bg-surface transition-colors">
                  LOG OUT
                </button>
              ) : (
                <button onClick={signInWithGoogle} className="btn-3d-accent font-mono text-xs px-5 py-2">
                  SYS.LOGIN
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {error && activeNav !== 'Scan' && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed left-4 right-4 top-24 z-40 mx-auto max-w-xl rounded-xl border border-red-400/50 bg-red-950/95 px-4 py-3 text-sm font-medium text-red-100 shadow-2xl"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
            <button
              type="button"
              aria-label="Dismiss error"
              onClick={() => setError(null)}
              className="ml-auto text-red-200 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-4 sm:py-8">
        
        {/* SCAN TAB */}
        {activeNav === 'Scan' && (
          <div className="max-w-xl mx-auto">
            
            <div className="flex bg-surface-hover border border-subtle p-1 rounded-lg mb-6 border border-strong">
              <button 
                onClick={() => setScanMode('camera')}
                className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-md text-sm font-bold tracking-tight transition-all ${scanMode === 'camera' ? 'bg-surface text-primary ' : 'text-secondary hover:text-primary'}`}
              >
                <Camera className="w-4 h-4" /> Camera
              </button>
              <button 
                onClick={() => setScanMode('calculator')}
                className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-md text-sm font-bold tracking-tight transition-all ${scanMode === 'calculator' ? 'bg-surface text-primary ' : 'text-secondary hover:text-primary'}`}
              >
                <Calculator className="w-4 h-4" /> Quick Calc
              </button>
            </div>

            {scanMode === 'calculator' ? (
              <QuickCalculator 
                defaultAssumptions={assumptions} 
                onUseForAppraisal={(a) => {
                  setAssumptions(a);
                  setScanMode('camera');
                }} 
              />
            ) : (
              <div className="space-y-4">
                
                {/* Image Upload */}
                <div className="bg-surface border border-subtle rounded-xl overflow-hidden ">
                  {image ? (
                    <div className="relative aspect-video sm:aspect-[4/3] bg-zinc-900 flex items-center justify-center group">
                      <img src={image} alt="Upload" className="max-h-full object-contain" />
                      <button 
                        onClick={() => { setImage(null); setResult(null); setError(null); }}
                        className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-primary rounded-full transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-video sm:aspect-[4/3] bg-canvas flex flex-col items-center justify-center p-6 border-b border-subtle cursor-pointer hover:bg-surface-hover transition-colors"
                    >
                      <div className="w-16 h-16 bg-surface border border-subtle rounded-full flex items-center justify-center mb-4 ">
                        <Upload className="w-8 h-8 text-accent" />
                      </div>
                      <p className="font-bold tracking-tight text-primary text-lg mb-1">Add front photo</p>
                      <p className="text-sm text-secondary text-center max-w-xs">Capture a clear photo of the item, plus any marks, signatures, or labels.</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                </div>
                
                {error && (
                  <div className="bg-red-950/20 border border-red-200 text-red-400 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}
                
                {/* Intake Form */}
                <div className="card-3d p-4 sm:p-5  space-y-4 relative">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-primary uppercase mb-1">Cost Paid ($)</label>
                      <input 
                        type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)}
                        className="w-full px-3 py-3 border border-strong rounded-lg text-base sm:text-lg font-bold tracking-tight text-primary bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-primary uppercase mb-1">Condition</label>
                      <select 
                        value={condition} onChange={(e) => setCondition(e.target.value)}
                        className="w-full px-3 py-3 border border-strong rounded-lg text-base sm:text-lg font-bold tracking-tight text-primary bg-surface"
                      >
                        <option value="New">New</option>
                        <option value="Used">Used</option>
                        <option value="For Parts">For Parts</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-primary uppercase mb-1">Category</label>
                    <select 
                      value={category} onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-strong rounded-lg text-base bg-surface"
                    >
                      <option value="Auto-detect">Auto-detect (AI decides)</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Clothing & Shoes">Clothing & Shoes</option>
                      <option value="Antiques & Vintage">Antiques & Vintage</option>
                      <option value="Collectibles">Collectibles</option>
                      <option value="Home & Kitchen">Home & Kitchen</option>
                      <option value="Toys & Hobbies">Toys & Hobbies</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-primary uppercase mb-1">Marks, Model, or Signature</label>
                    <input 
                      type="text" value={marks} onChange={(e) => setMarks(e.target.value)} placeholder="e.g. 'Sony', '925', 'Made in Japan'"
                      className="w-full px-3 py-2 border border-strong rounded-lg text-base bg-surface placeholder-slate-400"
                    />
                  </div>
                  
                  <div>
                    <button 
                      onClick={() => setShowNotes(!showNotes)}
                      className="text-sm font-bold tracking-tight text-accent flex items-center gap-1 hover:text-blue-700"
                    >
                      {showNotes ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      {showNotes ? "Hide notes" : "Add private notes"}
                    </button>
                    {showNotes && (
                      <textarea 
                        value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Flaws, location found, testing status..."
                        className="w-full px-3 py-2 border border-strong rounded-lg text-base bg-surface mt-2 h-24 placeholder-slate-400"
                      />
                    )}
                  </div>

                  <ProfitAssumptionsEditor assumptions={assumptions} onChange={setAssumptions} />

                  {/* Desktop Analyze Button */}
                  <div className="hidden sm:block pt-4">
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || !image}
                      className={`w-full py-4 rounded-xl text-lg font-display font-black transition-colors flex items-center justify-center gap-2 ${
                        isAnalyzing ? 'bg-surface-hover border border-subtle text-secondary cursor-not-allowed' :
                        image ? 'bg-accent hover:bg-accent-hover text-primary ' :
                        'bg-surface-hover text-muted cursor-not-allowed'
                      }`}
                    >
                      {isAnalyzing ? (
                        <><Loader2 className="w-6 h-6 animate-spin" /> Checking visual details...</>
                      ) : (
                        <><Search className="w-6 h-6" /> Analyze Item</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Mobile Sticky Analyze Button */}
                {image && (
                  <div className="sm:hidden fixed bottom-14 left-0 right-0 p-4 bg-surface/95 backdrop-blur-sm border-t border-subtle z-30 ">
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className={`w-full py-3.5 rounded-xl text-lg font-display font-black transition-colors flex items-center justify-center gap-2 ${
                        isAnalyzing ? 'bg-surface-hover border border-subtle text-secondary cursor-not-allowed' : 'bg-accent active:bg-blue-700 text-primary '
                      }`}
                    >
                      {isAnalyzing ? (
                        <><Loader2 className="w-6 h-6 animate-spin" /> Checking visual details...</>
                      ) : (
                        <><Search className="w-6 h-6" /> Analyze Item</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* RESULTS & LISTING TABS */}
        {(activeNav === 'Results' || activeNav === 'Listing') && (
          <div className="max-w-3xl mx-auto">
            {!result ? (
              <div className="text-center py-20">
                <FileText className="w-12 h-12 text-muted mx-auto mb-4" />
                <h2 className="text-xl font-bold tracking-tight text-primary">No results yet</h2>
                <p className="text-secondary mt-2">Scan an item first to see the appraisal.</p>
                <button 
                  onClick={() => setActiveNav('Scan')}
                  className="mt-6 px-6 py-2 bg-accent text-primary font-bold tracking-tight rounded-lg hover:bg-accent-hover"
                >
                  Go to Scan
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Decision Card */}
                {activeNav === 'Results' && (
                  <FieldDecisionCard 
                    result={result} 
                    saveSuccess={saveSuccess} 
                    onSaveToInventory={handleSaveToInventory} 
                  />
                )}
                
                {/* Identification & Financial Breakdown */}{/* Identification & Financial Breakdown */}
                {activeNav === 'Results' && (
                  <div className="space-y-4">
                    <div className="card-3d p-4 sm:p-5 ">
                      <EditableField 
    value={result.identification.title} 
    textClassName="font-bold tracking-tight text-lg text-primary mb-1"
    onSave={(val) => handleResultUpdate({
      ...result,
      identification: { ...result.identification, title: val as string }
    })}
  />
                      <EditableField 
    type="textarea"
    value={result.likelyIdentification} 
    textClassName="text-sm font-medium text-secondary leading-relaxed mb-4"
    onSave={(val) => handleResultUpdate({
      ...result,
      likelyIdentification: val as string
    })}
  />
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-canvas border border-subtle p-2.5 rounded-lg">
                          <span className="text-xs text-secondary font-bold tracking-tight uppercase block mb-0.5">Brand / Maker</span>
                          <span className="font-medium text-primary">{result.identification.brandOrMaker || 'Unknown'}</span>
                        </div>
                        <div className="bg-canvas border border-subtle p-2.5 rounded-lg">
                          <span className="text-xs text-secondary font-bold tracking-tight uppercase block mb-0.5">Model / Era</span>
                          <span className="font-medium text-primary">{result.identification.modelOrEra || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Valuation */}
                      <div className="card-3d p-4  space-y-3">
                        <div className="mb-2">
                          <h3 className="text-[10px] font-bold tracking-tight text-secondary uppercase tracking-wider">AI market estimate</h3>
                          <p className="mt-1 text-[11px] text-muted">Range to validate against recent sold comps.</p>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-secondary">Low End (Quick Sale)</span>
                          <span className="font-mono text-accent">${result.pricing.lowSale}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm bg-canvas p-2 rounded-md border border-subtle">
                          <span className="text-primary font-bold tracking-tight">Expected Sale</span>
                          <span className="font-mono text-accent">${result.pricing.expectedSale}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-secondary">High End (Mint/Retail)</span>
                          <span className="font-mono text-accent">${result.pricing.highSale}</span>
                        </div>
                      </div>
                      
                      {/* Profitability */}
                      {fin && (
                        <div className="card-3d p-4  space-y-3">
                          <h3 className="text-[10px] font-bold tracking-tight text-secondary uppercase tracking-wider mb-2">Cost & Fee Breakdown</h3>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-secondary">Total Investment</span>
                            <span className="font-bold tracking-tight text-primary">-${fin.totalCost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-secondary">Estimated Fees</span>
                            <span className="font-bold tracking-tight text-primary">-${(fin.marketplaceFee + fin.paymentProcessingFee).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm bg-canvas p-2 rounded-md border border-subtle">
                            <span className="text-primary font-bold tracking-tight">Gross Revenue</span>
                            <span className="font-mono text-accent">${fin.grossRevenue.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <WhyThisEstimate result={result} />
                  </div>
                )}
                
                {/* Listing Tab Context */}
                {activeNav === 'Listing' && (
                  <ListingTab result={result} image={image} supportedPlatforms={supportedPlatforms} onResultUpdate={handleResultUpdate} />
                )}
              </div>
            )}
          </div>
        )}
                
                {activeNav === 'Analytics' && (
          <AnalyticsView inventory={inventory} />
        )}
        
        {activeNav === 'Inventory' && (
          <InventoryView 
            items={inventory} 
            onUpdate={handleInventoryUpdate} 
            onDelete={handleInventoryDelete} 
            onOpen={loadItemToWorkspace}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-subtle z-40 pb-safe ">
        <nav className="flex justify-around items-center p-1">
          {(['Scan', 'Results', 'Listing', 'Inventory', 'Analytics'] as NavItem[]).map((nav) => (
            <button
              key={nav}
              onClick={() => setActiveNav(nav)}
              aria-label={`Open ${nav}`}
              className={`flex-1 flex flex-col items-center py-2.5 px-1 rounded-lg transition-colors ${
                activeNav === nav 
                  ? 'text-accent' 
                  : 'text-secondary hover:text-primary hover:bg-canvas'
              }`}
            >
              {nav === 'Scan' && <Camera className="w-5 h-5 mb-1" />}
              {nav === 'Results' && <FileText className="w-5 h-5 mb-1" />}
              {nav === 'Listing' && <Tag className="w-5 h-5 mb-1" />}
              {nav === 'Inventory' && <Archive className="w-5 h-5 mb-1" />}
              {nav === 'Analytics' && <TrendingUp className="w-5 h-5 mb-1" />}
              <span className="text-[10px] font-bold tracking-tight uppercase tracking-wide">{nav}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
