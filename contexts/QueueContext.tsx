import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { QueueEntry, QueueContextType, CartItem, QueueStatus, WaitTimeEstimate } from '../types';

const QueueContext = createContext<QueueContextType | undefined>(undefined);

const STORAGE_KEY = 'engrave_queue_data_v1';

export const QueueProvider = ({ children }: { children?: ReactNode }) => {
  const [queue, setQueue] = useState<QueueEntry[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setQueue(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse queue data", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  }, [queue]);

  const addEntries = (name: string, email: string, items: CartItem[]) => {
    const newEntries: QueueEntry[] = items.map(item => ({
      id: crypto.randomUUID(),
      customerName: name,
      email,
      type: item.type,
      item: item.item,
      quantity: item.number,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      costPerItem: item.costPerItem,
      timePerItem: item.timePerItem
    }));

    setQueue(prev => [...prev, ...newEntries]);
  };

  const updateStatus = (id: string, status: QueueStatus) => {
    setQueue(prev => prev.map(entry => {
      if (entry.id !== id) return entry;
      
      const updates: Partial<QueueEntry> = { status };
      if (status === 'completed') {
        updates.completedAt = new Date().toISOString();
      } else if (status === 'processing') {
        // Clear completedAt if moving back to processing (optional logic)
        updates.completedAt = undefined; 
      }
      
      return { ...entry, ...updates };
    }));
  };

  const deleteEntry = (id: string) => {
    setQueue(prev => prev.filter(entry => entry.id !== id));
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