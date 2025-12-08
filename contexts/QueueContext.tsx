import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { QueueEntry, QueueContextType, CartItem, QueueStatus, WaitTimeEstimate } from '../types';
import { db } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy
} from 'firebase/firestore';
import type { QuerySnapshot, DocumentData } from 'firebase/firestore';

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const QueueProvider = ({ children }: { children?: ReactNode }) => {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time Firestore Listener
  useEffect(() => {
    setLoading(true);
    // Connect to the 'queue' collection in the database
    const q = query(collection(db, 'queue'), orderBy('submittedAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const entries: QueueEntry[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        } as QueueEntry));
        setQueue(entries);
        setLoading(false);
        setError(null);
        console.log("Queue updated from Firestore:", entries.length, "entries");
      },
      (err: any) => {
        console.error("Error connecting to Firestore:", err);
        setLoading(false);
        if (err.code === 'permission-denied') {
            setError("Permission Denied: Please update Firestore Rules to 'allow read, write: if true;'");
        } else {
            setError("Connection Failed: Could not connect to database. Check internet or project config.");
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const addEntries = async (name: string, email: string, items: CartItem[]) => {
    console.log("Starting write to Firestore...");
    
    // Safety timeout
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out. Check internet connection.")), 30000)
    );

    const performWrite = async () => {
        const batchPromises = items.map(item => {
            return addDoc(collection(db, 'queue'), {
                customerName: name,
                email,
                type: item.type,
                item: item.item,
                quantity: item.number,
                status: 'pending',
                submittedAt: new Date().toISOString(),
                costPerItem: item.costPerItem,
                timePerItem: item.timePerItem,
                engravingText: item.engravingText || ''
            });
        });
        await Promise.all(batchPromises);
        console.log("Write complete!");
    };

    await Promise.race([performWrite(), timeoutPromise]);
  };

  const updateStatus = async (id: string, status: QueueStatus) => {
    const updates: any = { status };
    
    if (status === 'completed') {
      updates.completedAt = new Date().toISOString();
    } else if (status === 'processing') {
      updates.completedAt = null;
    }
    
    try {
      const entryRef = doc(db, 'queue', id);
      await updateDoc(entryRef, updates);
    } catch (e) {
      console.error("Error updating status:", e);
      alert("Failed to update status. Check console.");
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      console.log("Attempting to delete doc:", id);
      const entryRef = doc(db, 'queue', id);
      await deleteDoc(entryRef);
      console.log("Delete successful");
    } catch (e: any) {
      console.error("Error deleting entry:", e);
      if (e.code === 'permission-denied') {
        alert("Permission Denied: You do not have permission to delete this entry. Check Firestore Rules.");
      } else {
        alert(`Failed to delete entry: ${e.message}`);
      }
    }
  };

  const getPendingCount = () => {
    const pendingCustomers = new Set(
      queue.filter(q => q.status === 'pending').map(q => q.customerName)
    );
    return pendingCustomers.size;
  };

  const calculateWaitTime = (items: CartItem[]): WaitTimeEstimate => {
    // Only pending and processing items count towards wait time
    // Cancelled items are ignored
    const aheadEntries = queue.filter(q => q.status === 'pending' || q.status === 'processing');
    
    const uniqueCustomersAhead = new Set(
      aheadEntries.map(q => q.customerName)
    ).size;

    const aheadProcessingMinutes = aheadEntries.reduce((acc, entry) => {
      return acc + (entry.timePerItem * entry.quantity);
    }, 0);

    const userProcessingMinutes = items.reduce((acc, item) => {
      return acc + (item.timePerItem * item.number);
    }, 0);

    return {
      entriesAhead: uniqueCustomersAhead,
      totalWaitMinutes: aheadProcessingMinutes + userProcessingMinutes,
      userProcessingMinutes,
      aheadProcessingMinutes
    };
  };

  const stats = {
    pending: queue.filter(q => q.status === 'pending').length,
    processing: queue.filter(q => q.status === 'processing').length,
    completed: queue.filter(q => q.status === 'completed').length,
    cancelled: queue.filter(q => q.status === 'cancelled').length,
    total: queue.length
  };

  return (
    <QueueContext.Provider value={{ queue, addEntries, updateStatus, deleteEntry, getPendingCount, calculateWaitTime, stats }}>
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
            <strong>Database Error:</strong> {error}
        </div>
      )}
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};