import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  FileText, 
  Tag, 
  Archive, 
  Loader2, 
  Calculator, 
  Search, 
  Upload, 
  X, 
  ChevronDown, 
  ChevronRight, 
  AlertCircle, 
  Cpu, 
  Settings, 
  ShieldCheck, 
  Scale, 
  Lock, 
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { ProfitAssumptions, ValuationResult, InventoryItem, NavItem, UserPreferences, SavedAppraisal } from './types';
import { 
  fetchInventory, 
  saveInventoryItemFirebase, 
  deleteInventoryItemFirebase, 
  updateInventoryItemFirebase,
  getRecentAppraisals,
  saveRecentAppraisal,
  toggleAppraisalWatchlist,
  deleteRecentAppraisal
} from './utils/inventory';
import { useAuth } from './contexts/AuthContext';
import { calculateFinancials } from './utils/calculations';
import { requestJson } from './lib/api';
import ProfitAssumptionsEditor from './components/ProfitAssumptionsEditor';
import QuickCalculator from './components/QuickCalculator';
import InventoryView from './components/InventoryView';
import { AnalyticsView } from './components/AnalyticsView';
import WhyThisEstimate from './components/WhyThisEstimate';
import { EditableField } from './components/EditableField';
import { FieldDecisionCard } from './components/FieldDecisionCard';
import { ListingTab } from './components/ListingTab';
import { PWAInstallButton } from './components/PWAInstallButton';
import { SettingsView } from './components/SettingsView';
import { SavedAppraisalsDrawer } from './components/SavedAppraisalsDrawer';
import { LegalModal, LegalModalType } from './components/LegalModals';
import { optimizeImageFile } from './utils/imageOptimizer';
import { telemetry } from './lib/telemetry';

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
  
  // Drag & drop & optimization state
  const [isDragging, setIsDragging] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Loading & Result state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ValuationResult | null>(null);
  
  // Inventory state
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [supportedPlatforms, setSupportedPlatforms] = useState<string[]>(['eBay', 'Facebook Marketplace', 'Mercari', 'Poshmark', 'Etsy']);
  const [copied, setCopied] = useState(false);

  // Recent Appraisals & History Drawer
  const [recentAppraisals, setRecentAppraisals] = useState<SavedAppraisal[]>([]);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Legal & Support Modals
  const [activeLegalModal, setActiveLegalModal] = useState<LegalModalType>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load preferences, inventory, and recent appraisals
  useEffect(() => {
    setRecentAppraisals(getRecentAppraisals());
    try {
      const storedPrefs = localStorage.getItem('loot_ledger_user_prefs');
      if (storedPrefs) {
        const parsed = JSON.parse(storedPrefs);
        setAssumptions(prev => ({
          ...prev,
          marketplace: parsed.defaultMarketplace || prev.marketplace,
          marketplaceFeePercent: parsed.defaultFeePercent ?? prev.marketplaceFeePercent,
          packingMaterialsCost: parsed.defaultPackingCost ?? prev.packingMaterialsCost,
          desiredMinProfit: parsed.desiredMinProfit ?? prev.desiredMinProfit,
          desiredMinROI: parsed.desiredMinROI ?? prev.desiredMinROI,
        }));
      }
    } catch {
      // safe fallback
    }

    telemetry.track({
      name: 'app_initialized',
      data: { version: '2.4.0', isOnline: navigator.onLine }
    });
  }, []);

  useEffect(() => {
    fetchInventory().then(setInventory);
  }, [user]);

  const processFile = async (file: File) => {
    setIsOptimizing(true);
    setError(null);
    try {
      const optimized = await optimizeImageFile(file);
      setImage(optimized.dataUrl);
      setResult(null);
      setSaveSuccess(false);
    } catch (err: any) {
      setError(err.message || 'Failed to process image');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) {
      setError("Please add a photo first");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setSaveSuccess(false);

    telemetry.track({
      name: 'appraisal_started',
      data: {
        category,
        hasMarks: Boolean(marks.trim()),
        price: purchasePrice
      }
    });

    const startTime = Date.now();
    
    try {
      const data = await requestJson<ValuationResult>('/api/appraise', {
        method: 'POST',
        body: JSON.stringify({ 
          image, 
          category: category !== 'Auto-detect' ? category : undefined,
          marks: marks,
          condition: condition,
          targetPlatforms: supportedPlatforms,
          purchasePrice,
          assumptions,
          model: 'god-tier-auto'
        }),
      });
      
      setResult(data);
      setActiveNav('Results');
      window.scrollTo(0, 0);

      // Auto-save to recent appraisals
      const savedItem: SavedAppraisal = {
        id: 'appraisal_' + Date.now(),
        title: data.identification?.title || 'Appraised Item',
        timestamp: new Date().toISOString(),
        image: image || undefined,
        category: category !== 'Auto-detect' ? category : undefined,
        verdict: data.decision?.recommendation || 'RESEARCH FURTHER',
        lowSale: data.pricing?.lowSale || 0,
        expectedSale: data.pricing?.expectedSale || 0,
        highSale: data.pricing?.highSale || 0,
        netProfit: data.decision?.projectedNet || 0,
        roi: purchasePrice > 0 ? ((data.decision?.projectedNet || 0) / purchasePrice) * 100 : 0,
        confidence: data.researchConfidence?.overall || 70,
        authenticityRisk: data.authenticityRisk?.overall || 10,
        isWatchlist: false,
        purchasePrice: purchasePrice || 0,
        result: data
      };
      const updatedAppraisals = saveRecentAppraisal(savedItem);
      setRecentAppraisals(updatedAppraisals);

      telemetry.track({
        name: 'appraisal_completed',
        data: {
          verdict: data.decision?.recommendation || 'UNKNOWN',
          confidence: data.researchConfidence?.overall || 0,
          risk: data.authenticityRisk?.overall || 0,
          durationMs: Date.now() - startTime
        }
      });
    } catch (err: any) {
      const errMsg = err.message || "An unexpected error occurred during appraisal";
      setError(errMsg);
      telemetry.track({
        name: 'appraisal_failed',
        data: { error: errMsg }
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleWatchlist = (id: string) => {
    const updated = toggleAppraisalWatchlist(id);
    setRecentAppraisals(updated);
  };

  const handleDeleteRecentAppraisal = (id: string) => {
    const updated = deleteRecentAppraisal(id);
    setRecentAppraisals(updated);
  };

  const handleSelectSavedAppraisal = (saved: SavedAppraisal) => {
    setResult(saved.result);
    if (saved.image) setImage(saved.image);
    if (saved.purchasePrice) setPurchasePrice(saved.purchasePrice);
    if (saved.category) setCategory(saved.category);
    setActiveNav('Results');
  };

  const handleSaveToWatchlist = () => {
    if (!result) return;
    const existing = recentAppraisals.find(a => a.title === result.identification.title);
    if (existing) {
      handleToggleWatchlist(existing.id);
    } else {
      const savedItem: SavedAppraisal = {
        id: 'appraisal_' + Date.now(),
        title: result.identification.title || 'Appraised Item',
        timestamp: new Date().toISOString(),
        image: image || undefined,
        category: category !== 'Auto-detect' ? category : undefined,
        verdict: result.decision?.recommendation || 'RESEARCH FURTHER',
        lowSale: result.pricing.lowSale,
        expectedSale: result.pricing.expectedSale,
        highSale: result.pricing.highSale,
        netProfit: result.decision?.projectedNet || 0,
        roi: purchasePrice > 0 ? ((result.decision?.projectedNet || 0) / purchasePrice) * 100 : 0,
        confidence: result.researchConfidence?.overall || 70,
        authenticityRisk: result.authenticityRisk?.overall || 10,
        isWatchlist: true,
        purchasePrice: purchasePrice || 0,
        result
      };
      const updated = saveRecentAppraisal(savedItem);
      setRecentAppraisals(updated);
    }
  };

  const handleSaveToInventory = () => {
    if (!result) return;
    
    const fin = calculateFinancials(purchasePrice, result.pricing.expectedSale, assumptions);
    
    const newItem: InventoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'Needs Research',
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
    
    saveInventoryItemFirebase(newItem).then(() => {
      fetchInventory().then(setInventory);
      telemetry.track({
        name: 'inventory_item_saved',
        data: {
          itemId: newItem.id,
          status: newItem.status,
          netProfit: fin.netProfit
        }
      });
    });
    setSaveSuccess(true);
    
    setTimeout(() => {
      setActiveNav('Inventory');
    }, 1500);
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
      decision: item.decision,
      listingDraft: item.listingDraft || {
        title: item.title,
        suggestedListingPrice: item.expectedEstimate,
        suggestedOfferFloor: item.lowEstimate,
        suggestedShippingApproach: 'Standard Carrier Calculated',
        conditionDescription: item.condition,
        shortDescription: item.notes || item.title,
        itemSpecifics: [],
        marketplaces: [],
        stagingAdvice: { lighting: 'Natural light', background: 'Neutral white', angles: ['Front', 'Back'], photoChecklist: [] },
        disclosureNotes: []
      },
      disclaimer: item.disclaimer || 'Archived inventory valuation.',
      comparableSearchTerms: item.comparableSearchTerms || [],
      researchRecommendation: item.researchRecommendation || 'Verify comps prior to sale.',
      isConditionalEstimate: false,
      requiresCertifiedAuthentication: item.decision?.recommendation === 'HOLD FOR AUTHENTICATION',
      researchHold: item.decision?.recommendation === 'RESEARCH FURTHER',
      researchConfidence: {
        overall: 80,
        identityConfidence: 80,
        marketEvidenceQuality: 80,
        photoConditionQuality: 80,
        categoryKnowledge: 80,
        verificationCompleteness: 80,
        rating: 'High Confidence',
        formula: 'Loaded from inventory'
      },
      authenticityRisk: {
        overall: item.decision?.recommendation === 'HOLD FOR AUTHENTICATION' ? 75 : 20,
        brandCategoryExposure: 20,
        serialHallmarkUncertainty: 20,
        traitMismatch: 20,
        provenanceDocumentationGap: 20,
        rating: item.decision?.recommendation === 'HOLD FOR AUTHENTICATION' ? 'High Risk (Authentication Review Required)' : 'Low Risk',
        formula: 'Loaded from inventory',
        isCounterfeitProneBrand: false
      },
      gateEvaluation: {
        authenticityGate: { status: 'PASSED', reason: 'Saved inventory record', riskExposure: 20 },
        identityGate: { status: 'CONFIRMED', reason: 'Saved inventory record', identityScore: 85 },
        conditionGate: { status: 'VERIFIED', reason: 'Saved inventory record', conditionScore: 80 },
        marketEvidenceGate: { status: 'MODERATE', reason: 'Saved inventory record', compScore: 70 },
        financialExposureGate: { status: 'LOW_RISK', reason: 'Saved inventory record', capitalAtRisk: item.purchasePrice },
        policyGate: { status: 'CLEAR', reason: 'Saved inventory record' }
      },
      buyCeiling: item.decision?.buyCeiling || {
        conservativeExpectedSale: item.expectedEstimate,
        estimatedFees: item.expectedEstimate * 0.13,
        shipping: 0,
        returnsReserve: 0,
        prepCost: 0,
        targetProfit: 20,
        uncertaintyReserve: 0,
        maxBuyPrice: item.purchasePrice,
        formula: 'Loaded from inventory'
      },
      compEvidence: {
        compQueries: (item.comparableSearchTerms || []).map(q => ({
          query: q,
          source: 'Saved Search',
          recency: 'Historical',
          comparabilityGrade: 'Direct Match',
          notes: 'Saved from past appraisal'
        })),
        compCountEstimate: 'Available on platform',
        compQualityGrade: 'B',
        evidenceSufficiency: 'Sufficient',
        isLiveDatabaseIngested: false,
        compDisclaimer: 'Saved inventory record'
      },
      pipelineRouting: {
        lane: 'COMMODITY_FAST_LANE',
        laneTitle: 'Saved Inventory Appraisal',
        modelUsed: 'Saved Record',
        costProfile: 'Local Cache',
        rationale: 'Retrieved from persistent inventory storage.',
        gatesTriggered: [],
        escalationTriggered: false
      }
    };

    setResult(reconstructedResult);
    setImage(item.image || null);
    setPurchasePrice(item.purchasePrice);
    setCategory(item.category || 'Auto-detect');
    setCondition(item.condition || 'Used');
    setMarks(item.marks || '');
    setNotes(item.notes || '');
    if (item.assumptions) setAssumptions(item.assumptions);
    setSaveSuccess(true);
    setActiveNav('Results');
  };

  const handleResultUpdate = (newResult: ValuationResult) => {
    setResult(newResult);
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
    await updateInventoryItemFirebase(item);
    const updated = await fetchInventory();
    setInventory(updated);
  };

  const handleInventoryDelete = async (id: string) => {
    await deleteInventoryItemFirebase(id);
    const updated = await fetchInventory();
    setInventory(updated);
  };

  const copyListing = () => {
    if (!result?.listingDraft) return;
    const text = `${result.listingDraft.title}\n\n${result.listingDraft.shortDescription}\n\nCondition: ${result.listingDraft.conditionDescription}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    telemetry.track({
      name: 'listing_copied',
      data: { platform: assumptions.marketplace, field: 'all' }
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-canvas text-primary font-sans pb-20 sm:pb-0 flex flex-col justify-between">
      <div>
        {/* Header */}
        <header className="bg-canvas border-b border-subtle sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-10 h-10">
                <rect width="100" height="100" fill="var(--color-accent)" />
                <path d="M30 70 L50 30 L70 70" stroke="var(--color-accent-fg)" strokeWidth="12" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
                <line x1="40" y1="50" x2="60" y2="50" stroke="var(--color-accent-fg)" strokeWidth="12" strokeLinecap="square" />
              </svg>
              <h1 className="font-display font-black text-3xl tracking-tight text-primary uppercase">
                Loot<span className="text-3d-pop ml-0.5">Ledger</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-6">
              {/* Appraisal History & Watchlist Drawer Toggle */}
              <button
                onClick={() => setIsHistoryDrawerOpen(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-subtle bg-surface hover:bg-surface-hover text-xs font-bold text-secondary hover:text-primary transition-colors flex items-center gap-1.5"
                title="Appraisal History & Watchlist"
              >
                <Clock className="w-3.5 h-3.5 text-accent" />
                <span className="hidden md:inline">History</span>
                {recentAppraisals.length > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] bg-accent/20 text-accent font-mono font-bold rounded">
                    {recentAppraisals.length}
                  </span>
                )}
              </button>

              <nav className="hidden sm:flex items-center gap-1">
                {(['Scan', 'Results', 'Listing', 'Inventory', 'Analytics', 'Settings'] as NavItem[]).map((nav) => (
                  <button
                    key={nav}
                    onClick={() => setActiveNav(nav)}
                    className={`px-4 py-2 text-sm font-bold tracking-wide transition-all uppercase ${
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
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setActiveNav('Settings')}
                      className="text-xs font-mono font-bold text-secondary hover:text-primary border border-subtle px-3 py-1.5 rounded-lg hover:bg-surface transition-colors flex items-center gap-1.5"
                    >
                      <Settings className="w-3.5 h-3.5 text-accent" />
                      {user.displayName?.split(' ')[0] || 'ACCOUNT'}
                    </button>
                    <button onClick={signOut} className="text-xs font-mono font-bold text-secondary hover:text-red-400 border border-subtle px-3 py-1.5 rounded-lg hover:bg-surface transition-colors">
                      LOG OUT
                    </button>
                  </div>
                ) : (
                  <button onClick={signInWithGoogle} className="btn-3d-accent font-mono text-xs px-5 py-2">
                    SYS.LOGIN
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-4 sm:py-8">
          
          {/* SCAN TAB */}
          {activeNav === 'Scan' && (
            <div className="max-w-xl mx-auto">
              
              <div className="flex bg-surface-hover border border-subtle p-1 rounded-lg mb-6 border-strong">
                <button 
                  onClick={() => setScanMode('camera')}
                  className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-md text-sm font-bold tracking-tight transition-all ${scanMode === 'camera' ? 'bg-surface text-primary' : 'text-secondary hover:text-primary'}`}
                >
                  <Camera className="w-4 h-4" /> Camera Sourcing
                </button>
                <button 
                  onClick={() => setScanMode('calculator')}
                  className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-md text-sm font-bold tracking-tight transition-all ${scanMode === 'calculator' ? 'bg-surface text-primary' : 'text-secondary hover:text-primary'}`}
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
                  
                  {/* Image Upload with Drag & Drop & Camera */}
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`bg-surface border rounded-xl overflow-hidden transition-all ${
                      isDragging 
                        ? 'border-accent ring-2 ring-accent/30 bg-accent/5' 
                        : 'border-subtle'
                    }`}
                  >
                    {image ? (
                      <div className="relative aspect-video sm:aspect-[4/3] bg-zinc-950 flex items-center justify-center group">
                        <img src={image} alt="Upload" className="max-h-full object-contain" />
                        <button 
                          onClick={() => { setImage(null); setResult(null); setError(null); }}
                          className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 text-primary rounded-full transition-colors"
                          title="Remove photo"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/70 backdrop-blur rounded-lg text-[11px] font-bold text-emerald-400 border border-emerald-800/40 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> Photo Ready for Analysis
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-video sm:aspect-[4/3] bg-canvas flex flex-col items-center justify-center p-6 border-b border-subtle cursor-pointer hover:bg-surface-hover transition-colors text-center"
                      >
                        {isOptimizing ? (
                          <div className="flex flex-col items-center gap-2 text-secondary">
                            <Loader2 className="w-8 h-8 text-accent animate-spin" />
                            <p className="font-bold text-sm text-primary">Optimizing high-res image...</p>
                            <p className="text-xs text-muted">Downscaling for fast appraisal...</p>
                          </div>
                        ) : (
                          <>
                            <div className="w-16 h-16 bg-surface border border-subtle rounded-full flex items-center justify-center mb-4">
                              <Upload className="w-8 h-8 text-accent" />
                            </div>
                            <p className="font-bold tracking-tight text-primary text-lg mb-1">
                              {isDragging ? 'Drop photo here' : 'Take or upload photo'}
                            </p>
                            <p className="text-xs text-secondary max-w-xs leading-relaxed">
                              Drag and drop, click to browse, or snap a photo. High-res smartphone photos are automatically optimized.
                            </p>
                          </>
                        )}
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                  </div>
                  
                  {error && (
                    <div className="bg-red-950/20 border border-red-800/50 text-red-300 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                      <p>{error}</p>
                    </div>
                  )}
                  
                  {/* Intake Form */}
                  <div className="card-3d p-4 sm:p-5 space-y-4 relative">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-primary uppercase mb-1">Cost Paid ($)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={purchasePrice} 
                          onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)}
                          className="w-full px-3 py-3 border border-subtle rounded-lg text-base sm:text-lg font-bold tracking-tight text-primary bg-surface focus:ring-2 focus:ring-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-primary uppercase mb-1">Condition</label>
                        <select 
                          value={condition} 
                          onChange={(e) => setCondition(e.target.value)}
                          className="w-full px-3 py-3 border border-subtle rounded-lg text-base sm:text-lg font-bold tracking-tight text-primary bg-surface focus:ring-2 focus:ring-accent"
                        >
                          <option value="New">New</option>
                          <option value="Used">Used (Good)</option>
                          <option value="Used - Fair">Used (Flaws)</option>
                          <option value="For Parts">For Parts / Repair</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-primary uppercase mb-1">Category (Optional)</label>
                      <select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2.5 border border-subtle rounded-lg text-sm font-semibold text-primary bg-surface focus:ring-2 focus:ring-accent"
                      >
                        <option value="Auto-detect">Auto-detect from visual cues</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Luxury / Designer">Luxury / Designer</option>
                        <option value="Antiques & Collectibles">Antiques & Collectibles</option>
                        <option value="Clothing & Shoes">Clothing & Shoes</option>
                        <option value="Jewelry & Watches">Jewelry & Watches</option>
                        <option value="Toys & Games">Toys & Games</option>
                        <option value="Tools & Hardware">Tools & Hardware</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-primary uppercase mb-1">Marks, Model, or Serial # (Optional)</label>
                      <input 
                        type="text" 
                        value={marks} 
                        onChange={(e) => setMarks(e.target.value)} 
                        placeholder="e.g. Sony WH-1000XM4, Hallmark 925, Tag #..."
                        className="w-full px-3 py-2.5 border border-subtle rounded-lg text-sm text-primary bg-surface placeholder-muted focus:ring-2 focus:ring-accent"
                      />
                    </div>

                    <div>
                      <button 
                        onClick={() => setShowNotes(!showNotes)}
                        className="text-sm font-bold tracking-tight text-accent flex items-center gap-1 hover:underline"
                      >
                        {showNotes ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        {showNotes ? "Hide private notes" : "Add private notes"}
                      </button>
                      {showNotes && (
                        <textarea 
                          value={notes} 
                          onChange={(e) => setNotes(e.target.value)} 
                          placeholder="Storage location, lot number, defects observed..."
                          className="w-full px-3 py-2 border border-subtle rounded-lg text-sm bg-surface mt-2 h-20 placeholder-muted text-primary focus:ring-2 focus:ring-accent"
                        />
                      )}
                    </div>

                    <ProfitAssumptionsEditor assumptions={assumptions} onChange={setAssumptions} />

                    {/* Pipeline Monitor */}
                    <div className="pt-3 border-t border-subtle">
                      <div className="p-3.5 bg-gradient-to-br from-indigo-950/40 via-surface to-canvas border border-indigo-700/40 rounded-xl space-y-2.5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-bold text-indigo-200 tracking-wide uppercase flex items-center gap-1.5">
                              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                              Multi-Stage Appraisal Pipeline
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/50 font-semibold">
                            Gated Risk Evaluation
                          </span>
                        </div>

                        <p className="text-[11px] text-secondary leading-relaxed">
                          Combines visual trait extraction with real sold comps, authenticity risk screening, and fee-aware acquisition ceilings to protect your capital.
                        </p>
                      </div>
                    </div>

                    {/* Desktop Analyze Button */}
                    <div className="hidden sm:block pt-4">
                      <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className={`w-full py-4 rounded-xl text-lg font-display font-black transition-all flex items-center justify-center gap-2 ${
                          isAnalyzing ? 'bg-surface-hover border border-subtle text-secondary cursor-not-allowed' : 'bg-accent hover:bg-accent-hover text-primary shadow-lg shadow-accent/20'
                        }`}
                      >
                        {isAnalyzing ? (
                          <><Loader2 className="w-6 h-6 animate-spin text-primary" /> Appraising item with AI...</>
                        ) : (
                          <><Search className="w-6 h-6" /> Appraise Item</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Mobile Sticky Button */}
                  <div className="sm:hidden fixed bottom-16 left-0 right-0 p-4 bg-canvas/90 backdrop-blur border-t border-subtle z-20">
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className={`w-full py-3.5 rounded-xl text-lg font-display font-black transition-colors flex items-center justify-center gap-2 ${
                        isAnalyzing ? 'bg-surface-hover border border-subtle text-secondary cursor-not-allowed' : 'bg-accent hover:bg-accent-hover text-primary'
                      }`}
                    >
                      {isAnalyzing ? (
                        <><Loader2 className="w-6 h-6 animate-spin" /> Analyzing...</>
                      ) : (
                        <><Search className="w-6 h-6" /> Appraise Item</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* RESULTS & LISTING TABS */}
          {(activeNav === 'Results' || activeNav === 'Listing') && (
            <div className="max-w-3xl mx-auto space-y-4">
              {!result ? (
                <div className="text-center py-20 bg-surface border border-subtle rounded-2xl p-8">
                  <FileText className="w-12 h-12 text-muted mx-auto mb-4 opacity-40" />
                  <h2 className="text-xl font-bold tracking-tight text-primary">No appraisal in workspace</h2>
                  <p className="text-secondary text-sm mt-1">Scan an item or select one from your inventory.</p>
                  <button 
                    onClick={() => setActiveNav('Scan')}
                    className="mt-6 px-6 py-2.5 bg-accent hover:bg-accent-hover text-primary font-bold tracking-tight rounded-xl transition-colors"
                  >
                    Go to Camera Scan
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Non-Definitive Valuation Banner */}
                  <div className="bg-canvas border border-subtle rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-secondary">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
                      <span>
                        <strong>Opinion of Value:</strong> Algorithmic estimation for preliminary sourcing. Does not replace accredited appraisal or physical grading.
                      </span>
                    </div>
                    <button 
                      onClick={() => setActiveLegalModal('disclaimer')}
                      className="text-accent hover:underline font-bold shrink-0 text-xs"
                    >
                      Legal Disclaimer
                    </button>
                  </div>

                  {/* Decision Card */}
                  {activeNav === 'Results' && (
                    <FieldDecisionCard 
                      result={result} 
                      saveSuccess={saveSuccess} 
                      onSaveToInventory={handleSaveToInventory}
                      onSaveToWatchlist={handleSaveToWatchlist}
                      isWatchlistSaved={recentAppraisals.some(a => a.title === result.identification.title && a.isWatchlist)}
                      cost={purchasePrice}
                      onGoToListing={() => setActiveNav('Listing')}
                    />
                  )}
                  
                  {/* Identification & Financial Breakdown */}
                  {activeNav === 'Results' && (
                    <div className="space-y-4">
                      <div className="card-3d p-4 sm:p-5">
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
                          textClassName="text-sm text-secondary mb-4 leading-relaxed"
                          onSave={(val) => handleResultUpdate({
                            ...result,
                            likelyIdentification: val as string
                          })}
                        />
                        
                        <div className="grid grid-cols-3 gap-2 border-t border-subtle pt-4 text-center">
                          <div className="bg-canvas p-2.5 rounded-lg border border-subtle">
                            <p className="text-[10px] uppercase font-bold text-muted">Low comp</p>
                            <p className="text-base font-mono font-bold text-secondary">${result.pricing.lowSale}</p>
                          </div>
                          <div className="bg-canvas p-2.5 rounded-lg border border-accent/40 bg-accent/5">
                            <p className="text-[10px] uppercase font-bold text-accent">Expected</p>
                            <p className="text-lg font-mono font-black text-primary">${result.pricing.expectedSale}</p>
                          </div>
                          <div className="bg-canvas p-2.5 rounded-lg border border-subtle">
                            <p className="text-[10px] uppercase font-bold text-muted">High comp</p>
                            <p className="text-base font-mono font-bold text-secondary">${result.pricing.highSale}</p>
                          </div>
                        </div>
                      </div>

                      <WhyThisEstimate result={result} />
                    </div>
                  )}

                  {/* Cross-Listing Copy Draft Tab */}
                  {activeNav === 'Listing' && (
                    <ListingTab 
                      result={result} 
                      image={image} 
                      onResultUpdate={handleResultUpdate} 
                    />
                  )}

                </div>
              )}
            </div>
          )}
          
          {/* ANALYTICS TAB */}
          {activeNav === 'Analytics' && (
            <AnalyticsView inventory={inventory} />
          )}
          
          {/* INVENTORY COMMAND CENTER */}
          {activeNav === 'Inventory' && (
            <InventoryView 
              items={inventory} 
              onUpdate={handleInventoryUpdate} 
              onDelete={handleInventoryDelete} 
              onOpen={loadItemToWorkspace}
            />
          )}

          {/* SETTINGS TAB */}
          {activeNav === 'Settings' && (
            <SettingsView 
              onSaved={(newPrefs) => {
                setAssumptions(prev => ({
                  ...prev,
                  marketplace: newPrefs.defaultMarketplace,
                  marketplaceFeePercent: newPrefs.defaultFeePercent,
                  packingMaterialsCost: newPrefs.defaultPackingCost,
                  desiredMinProfit: newPrefs.desiredMinProfit,
                  desiredMinROI: newPrefs.desiredMinROI
                }));
              }}
            />
          )}
        </main>
      </div>

      {/* Compliance & Operations Footer */}
      <footer className="mt-16 border-t border-subtle py-8 px-6 bg-canvas/40">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-secondary">
          <div className="flex items-center gap-2">
            <span className="font-display font-black tracking-tight text-primary uppercase text-sm">LootLedger</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-subtle text-secondary">
              v2.4.0 Production
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
            <button onClick={() => setActiveLegalModal('terms')} className="hover:text-primary transition-colors">
              Terms of Service
            </button>
            <button onClick={() => setActiveLegalModal('privacy')} className="hover:text-primary transition-colors">
              Privacy Policy
            </button>
            <button onClick={() => setActiveLegalModal('disclaimer')} className="hover:text-primary transition-colors">
              Valuation Disclaimers
            </button>
            <button onClick={() => setActiveLegalModal('support')} className="hover:text-primary transition-colors">
              Help & Support
            </button>
          </div>

          <p className="text-[11px] text-muted text-center sm:text-right">
            © {new Date().getFullYear()} LootLedger Inc. Decision support software for professional resellers.
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur border-t border-subtle z-40 pb-safe">
        <nav className="flex justify-around items-center p-1">
          {(['Scan', 'Results', 'Listing', 'Inventory', 'Settings'] as NavItem[]).map((nav) => (
            <button
              key={nav}
              onClick={() => setActiveNav(nav)}
              className={`flex-1 flex flex-col items-center py-2 px-1 rounded-lg transition-colors ${
                activeNav === nav 
                  ? 'text-accent' 
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {nav === 'Scan' && <Camera className="w-5 h-5 mb-0.5" />}
              {nav === 'Results' && <FileText className="w-5 h-5 mb-0.5" />}
              {nav === 'Listing' && <Tag className="w-5 h-5 mb-0.5" />}
              {nav === 'Inventory' && <Archive className="w-5 h-5 mb-0.5" />}
              {nav === 'Settings' && <Settings className="w-5 h-5 mb-0.5" />}
              <span className="text-[10px] font-bold tracking-tight uppercase tracking-wider">{nav}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Appraisal History & Watchlist Drawer */}
      <SavedAppraisalsDrawer 
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        appraisals={recentAppraisals}
        onSelectAppraisal={handleSelectSavedAppraisal}
        onToggleWatchlist={handleToggleWatchlist}
        onDeleteAppraisal={handleDeleteRecentAppraisal}
      />

      {/* Legal & Help Modals */}
      <LegalModal 
        type={activeLegalModal} 
        onClose={() => setActiveLegalModal(null)} 
      />
    </div>
  );
}
