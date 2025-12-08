export type QueueStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface QueueEntry {
  id: string;
  customerName: string;
  email: string;
  type: string;
  item: string;
  quantity: number;
  status: QueueStatus;
  submittedAt: string; // ISO string
  completedAt?: string; // ISO string
  costPerItem: number;
  timePerItem: number; // minutes
  engravingText?: string;
}

export interface CartItem {
  type: string;
  item: string;
  number: number;
  costPerItem: number;
  timePerItem: number;
  engravingText?: string;
}

export interface PricingDetail {
  time_per_item_minutes: number;
  cost_per_item: number;
}

export interface PricingConfig {
  [category: string]: {
    [item: string]: PricingDetail;
  };
}

export interface WaitTimeEstimate {
  entriesAhead: number;
  totalWaitMinutes: number;
  userProcessingMinutes: number;
  aheadProcessingMinutes: number;
}

export interface QueueContextType {
  queue: QueueEntry[];
  addEntries: (name: string, email: string, items: CartItem[]) => Promise<void>;
  updateStatus: (id: string, status: QueueStatus) => void;
  deleteEntry: (id: string) => void;
  getPendingCount: () => number;
  calculateWaitTime: (items: CartItem[]) => WaitTimeEstimate;
  stats: {
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    total: number;
  };
}