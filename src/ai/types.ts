// AI 1 - Gợi ý kê đơn
export interface AiSuggestedMedication {
  medicationId: string;
  name: string;
  dose: string;
  frequency: string;
  durationDays: number;
  route: string;
  reasoning: string;
  confidence: number; // 0-1
}

// AI 2 - Tương tác thuốc
export type InteractionSeverity = 'low' | 'moderate' | 'high';

export interface AiDrugInteraction {
  id: string;
  severity: InteractionSeverity;
  message: string;
  drugsInvolved: string[];
  recommendation: string;
}

// AI 3 - ADR Risk
export type AdrRiskLevel = 'low' | 'medium' | 'high';

export interface AiAdrRisk {
  level: AdrRiskLevel;
  score: number; // 0-100
  factors: string[];
}

// AI 4 - Patient Summary
export interface AiPatientSummary {
  summary: string;
  updatedAt: string; // ISO
  sources: string[];
}

// AI 5 - Chat (message shape for AI)
export interface AiChatMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  createdAt: string;
}

// AI 6 - Inventory Forecast
export type ExpiryRisk = 'none' | 'near' | 'high';

export interface AiInventoryForecastItem {
  medicationId: string;
  medicationName: string;
  daysUntilStockout: number | null;
  expiryRisk: ExpiryRisk;
  recommendedAction: string;
}

export interface AiInventoryForecastSummary {
  atRiskStockout7Days: number;
  atRiskStockout30Days: number;
  nearExpiryCount: number;
}
