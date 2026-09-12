import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { InventoryItem, SavedAppraisal } from '../types';

const LOCAL_STORAGE_KEY = 'lootledger_local_inventory';
const LOCAL_APPRAISALS_KEY = 'lootledger_recent_appraisals';

export function getRecentAppraisals(): SavedAppraisal[] {
  try {
    const raw = localStorage.getItem(LOCAL_APPRAISALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading recent appraisals', err);
    return [];
  }
}

export function saveRecentAppraisal(appraisal: SavedAppraisal): SavedAppraisal[] {
  try {
    const current = getRecentAppraisals();
    // Keep top 50 recent appraisals, updating if same id
    const filtered = current.filter(a => a.id !== appraisal.id);
    const updated = [appraisal, ...filtered].slice(0, 50);
    localStorage.setItem(LOCAL_APPRAISALS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error saving recent appraisal', err);
    return [];
  }
}

export function toggleAppraisalWatchlist(id: string): SavedAppraisal[] {
  try {
    const current = getRecentAppraisals();
    const updated = current.map(item => {
      if (item.id === id) {
        return { ...item, isWatchlist: !item.isWatchlist };
      }
      return item;
    });
    localStorage.setItem(LOCAL_APPRAISALS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error toggling watchlist', err);
    return [];
  }
}

export function deleteRecentAppraisal(id: string): SavedAppraisal[] {
  try {
    const current = getRecentAppraisals();
    const updated = current.filter(a => a.id !== id);
    localStorage.setItem(LOCAL_APPRAISALS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error deleting appraisal', err);
    return [];
  }
}

function getLocalInventory(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading local inventory', err);
    return [];
  }
}

function saveLocalInventory(items: InventoryItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Error saving local inventory', err);
  }
}

export async function fetchInventory(): Promise<InventoryItem[]> {
  const localItems = getLocalInventory();
  if (!auth.currentUser) return localItems;
  const uid = auth.currentUser.uid;
  const colRef = collection(db, 'users', uid, 'inventory');
  try {
    const snapshot = await getDocs(colRef);
    const remoteItems = snapshot.docs.map(doc => doc.data() as InventoryItem);
    // Merge local items that are not in remote
    const merged = [...remoteItems];
    for (const local of localItems) {
      if (!merged.some(r => r.id === local.id)) {
        merged.push(local);
      }
    }
    return merged;
  } catch (err) {
    console.error("Error fetching inventory from Firebase, using local cache", err);
    return localItems;
  }
}

export async function saveInventoryItemFirebase(item: InventoryItem): Promise<void> {
  // Always persist locally first
  const current = getLocalInventory();
  const updated = [item, ...current.filter(i => i.id !== item.id)];
  saveLocalInventory(updated);

  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  item.userId = uid;
  const docRef = doc(db, 'users', uid, 'inventory', item.id);
  await setDoc(docRef, item);
}

export async function updateInventoryItemFirebase(item: InventoryItem): Promise<void> {
  const current = getLocalInventory();
  const updated = current.map(i => i.id === item.id ? { ...i, ...item } : i);
  saveLocalInventory(updated);

  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  item.userId = uid;
  const docRef = doc(db, 'users', uid, 'inventory', item.id);
  await setDoc(docRef, item, { merge: true });
}

export async function deleteInventoryItemFirebase(id: string): Promise<void> {
  const current = getLocalInventory();
  const updated = current.filter(i => i.id !== id);
  saveLocalInventory(updated);

  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  const docRef = doc(db, 'users', uid, 'inventory', id);
  await deleteDoc(docRef);
}

export function exportInventoryCSV(items: InventoryItem[]) {
  const headers = ['ID', 'Date', 'Title', 'Status', 'Category', 'Condition', 'Cost', 'Est. Net', 'Next Action'];
  
  const rows = items.map(item => [
    item.id,
    new Date(item.createdAt).toLocaleDateString(),
    `"${item.title.replace(/"/g, '""')}"`,
    item.status,
    item.category,
    item.condition,
    item.purchasePrice,
    item.expectedNetProfit,
    item.decision?.action || ''
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `loot_ledger_inventory_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}
