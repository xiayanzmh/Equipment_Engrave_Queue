
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

// Import types separately to avoid runtime errors if the module doesn't export them as values
import type { QuerySnapshot, DocumentData } from 'firebase/firestore';

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const QueueProvider = ({ children }: { children?: ReactNode }) => {
  const [queue, setQueue] = useState<QueueEntry[]>([]);

  // Real-time Firestore Listener
  useEffect(() => {
    // Modular Syntax: query(collection(...), orderBy(...))
    const q = query(collection(db, 'queue'), orderBy('submittedAt', 'asc'));

    // Modular Syntax: onSnapshot(query, callback)
    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const entries: QueueEntry[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        } as QueueEntry));
        setQueue(entries);
        console.log("Queue updated from Firestore:", entries.length, "entries");
      },
      (error: any) => {
        console.error("Error connecting to Firestore:", error);
        if (error.code === 'permission-denied') {
            console.warn("⚠️ PERMISSION DENIED: Please go to Firebase Console > Firestore Database > Rules and change them to 'allow read, write: if true;'");
        }
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const addEntries = async (name: string, email: string, items: CartItem[]) => {
    console.log("Starting write to Firestore...");
    
    // Create a Promise that rejects after 30 seconds to handle hanging connections
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out. Please check if your computer can access Google Cloud, or if the database ID 'customer-orders' exists.")), 30000)
    );

    const performWrite = async () => {
        const batchPromises = items.map(item => {
            // Modular Syntax: addDoc(collection(...), data)
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

    // Race the write against the timeout
    await Promise.race([performWrite(), timeoutPromise]);
  };

  const updateStatus = async (id: string, status: QueueStatus) => {
    const updates: any = { status };
    
    if (status === 'completed') {
      updates.completedAt = new Date().toISOString();
    } else if (status === 'processing') {
      updates.completedAt = null; // Reset if moving back
    }
    
    try {
      // Modular Syntax: updateDoc(doc(...), data)
      const entryRef = doc(db, 'queue', id);
      await updateDoc(entryRef, updates);
    } catch (e) {
      console.error("Error updating status:", e);
      alert("Failed to update status. Check console.");
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      // Modular Syntax: deleteDoc(doc(...))
      const entryRef = doc(db, 'queue', id);
      await deleteDoc(entryRef);
    } catch (e) {
      console.error("Error deleting entry:", e);
      alert("Failed to delete entry.");
    }
  };

  const getPendingCount = () => {
    // Count distinct customer names in the pending queue
    const pendingCustomers = new Set(
      queue.filter(q => q.status === 'pending').map(q => q.customerName)
    );
    return pendingCustomers.size;
  };

  const calculateWaitTime = (items: CartItem[]): WaitTimeEstimate => {
    // 1. Calculate time for entries ahead (pending + processing)
    const aheadEntries = queue.filter(q => q.status === 'pending' || q.status === 'processing');
    
    // Count distinct customer names ahead
    const uniqueCustomersAhead = new Set(
      aheadEntries.map(q => q.customerName)
    ).size;

    // Time is still the sum of all individual items
    const aheadProcessingMinutes = aheadEntries.reduce((acc, entry) => {
      return acc + (entry.timePerItem * entry.quantity);
    }, 0);

    // 2. Calculate time for user items
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
    total: queue.length
  };

  return (
    <QueueContext.Provider value={{ queue, addEntries, updateStatus, deleteEntry, getPendingCount, calculateWaitTime, stats }}>
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
