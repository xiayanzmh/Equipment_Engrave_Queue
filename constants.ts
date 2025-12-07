import { PricingConfig } from './types';

export const PRICING_CONFIG: PricingConfig = {
  "Foil": {
    "Blade": { "time_per_item_minutes": 2, "cost_per_item": 5 },
    "Guard": { "time_per_item_minutes": 6, "cost_per_item": 20 }
  },
  "Saber": {
    "Blade": { "time_per_item_minutes": 2, "cost_per_item": 5 },
    "Guard": { "time_per_item_minutes": 6, "cost_per_item": 20 }
  },
  "Epee": {
    "Blade": { "time_per_item_minutes": 2, "cost_per_item": 5 },
    "Guard": { "time_per_item_minutes": 6, "cost_per_item": 20 }
  }
};

export const API_CONFIG = {
  // Placeholder endpoint: In a real app, this would point to your Cloud Function or Backend Service
  // which handles the secure connection to BigQuery.
  ENDPOINT: "https://api.engravequeue.com/v1/ingest",
  ENABLED: true
};

export const MOCK_INITIAL_DATA = [
  // Keeping empty for a fresh start, or add mocks here if needed for demo
];