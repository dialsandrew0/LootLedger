import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { InventoryItem } from '../types';

export async function fetchInventory(): Promise<InventoryItem[]> {
  if (!auth.currentUser) return [];
  const uid = auth.currentUser.uid;
  const colRef = collection(db, 'users', uid, 'inventory');
  try {
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => doc.data() as InventoryItem);
  } catch (err) {
    console.error("Error fetching inventory", err);
    return [];
  }
}

export async function saveInventoryItemFirebase(item: InventoryItem): Promise<void> {
  if (!auth.currentUser) throw new Error("Must be logged in to save.");
  const uid = auth.currentUser.uid;
  item.userId = uid; // add userId to item
  const docRef = doc(db, 'users', uid, 'inventory', item.id);
  await setDoc(docRef, item);
}

export async function updateInventoryItemFirebase(item: InventoryItem): Promise<void> {
  if (!auth.currentUser) throw new Error("Must be logged in to update.");
  const uid = auth.currentUser.uid;
  item.userId = uid;
  const docRef = doc(db, 'users', uid, 'inventory', item.id);
  await setDoc(docRef, item, { merge: true });
}

export async function deleteInventoryItemFirebase(id: string): Promise<void> {
  if (!auth.currentUser) throw new Error("Must be logged in to delete.");
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
