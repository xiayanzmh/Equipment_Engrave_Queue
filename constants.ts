import { PricingConfig } from './types';

export const ADMIN_EMAIL = "admin@engravequeue.com";

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
  // Placeholder endpoint
  ENDPOINT: "https://api.engravequeue.com/v1/ingest",
  ENABLED: true
};

export const MOCK_INITIAL_DATA = [];