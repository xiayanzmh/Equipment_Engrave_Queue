import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { QueueEntry, QueueContextType, CartItem, QueueStatus, WaitTimeEstimate } from '../types';

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const QueueProvider = ({ children }: { children?: ReactNode }) => {
  const [queue, setQueue] = useState<QueueEntry[]>([]);

  useEffect(() => {
    const q = query(collection(db, "queue"), orderBy("submittedAt", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const queueData: QueueEntry[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        queueData.push({ 
          ...data, 
          id: doc.id,
          // Convert Firestore Timestamp to ISO string
          submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate().toISOString() : new Date().toISOString(),
          completedAt: data.completedAt?.toDate ? data.completedAt.toDate().toISOString() : undefined
        } as QueueEntry);
      });
      setQueue(queueData);
    });

    return () => unsubscribe();
  }, []);

  const addEntries = async (name: string, email: string, items: CartItem[]) => {
    const newEntries = items.map(item => ({
      customerName: name,
      email,
      type: item.type,
      item: item.item,
      quantity: item.number,
      status: 'pending',
      submittedAt: serverTimestamp(), // Use server-side timestamp
      costPerItem: item.costPerItem,
      timePerItem: item.timePerItem,
      completedAt: null,
    }));

    for (const entry of newEntries) {
      await addDoc(collection(db, "queue"), entry);
    }
  };

  const updateStatus = async (id: string, status: QueueStatus) => {
    const entryRef = doc(db, "queue", id);
    const updates: { status: QueueStatus; completedAt?: any } = { status };
    
    if (status === 'completed') {
      updates.completedAt = serverTimestamp();
    } else if (status === 'processing') {
      updates.completedAt = null; 
    }
    
    await updateDoc(entryRef, updates);
  };

  const deleteEntry = async (id: string) => {
    await deleteDoc(doc(db, "queue", id));
  };

  const getPendingCount = () => {
    const pendingCustomers = new Set(
      queue.filter(q => q.status === 'pending').map(q => q.customerName)
    );
    return pendingCustomers.size;
  };

  const calculateWaitTime = (items: CartItem[]): WaitTimeEstimate => {
    const aheadEntries = queue.filter(q => q.status === 'pending' || q.status === 'processing');
    const uniqueCustomersAhead = new Set(aheadEntries.map(q => q.customerName)).size;
    const aheadProcessingMinutes = aheadEntries.reduce((acc, entry) => acc + (entry.timePerItem * entry.quantity), 0);
    const userProcessingMinutes = items.reduce((acc, item) => acc + (item.timePerItem * item.number), 0);

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
