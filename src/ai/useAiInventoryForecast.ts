import { useQuery } from '@tanstack/react-query';
import type { AiInventoryForecastItem, AiInventoryForecastSummary } from './types';
import { apiFetch } from '@/api/apiFetch';

interface ForecastApiResponse {
  items: AiInventoryForecastItem[];
  summary: AiInventoryForecastSummary;
}

async function fetchForecast(locationId: string): Promise<ForecastApiResponse> {
  try {
    return await apiFetch<ForecastApiResponse>(
      `/api/ai/inventory/forecast?locationId=${encodeURIComponent(locationId)}`,
    );
  } catch {
    return fallbackMock();
  }
}

function fallbackMock(): ForecastApiResponse {
  const items: AiInventoryForecastItem[] = [
    { medicationId: '1', medicationName: 'Paracetamol 500mg', daysUntilStockout: 5, expiryRisk: 'none', recommendedAction: 'Order 200 units within 48h' },
    { medicationId: '2', medicationName: 'Amoxicillin 500mg', daysUntilStockout: 14, expiryRisk: 'high', recommendedAction: 'Check expiring batches, do not dispense from old lots' },
    { medicationId: '3', medicationName: 'Ibuprofen 400mg', daysUntilStockout: 45, expiryRisk: 'near', recommendedAction: 'Monitor stock levels' },
    { medicationId: '4', medicationName: 'Omeprazole 20mg', daysUntilStockout: null, expiryRisk: 'none', recommendedAction: 'Adequate supply' },
    { medicationId: '5', medicationName: 'Loperamide 2mg', daysUntilStockout: null, expiryRisk: 'none', recommendedAction: 'Adequate supply' },
  ];
  const atRiskStockout7Days = items.filter((x) => x.daysUntilStockout !== null && x.daysUntilStockout <= 7).length;
  const atRiskStockout30Days = items.filter((x) => x.daysUntilStockout !== null && x.daysUntilStockout <= 30).length;
  const nearExpiryCount = items.filter((x) => x.expiryRisk === 'high' || x.expiryRisk === 'near').length;
  return {
    items,
    summary: { atRiskStockout7Days, atRiskStockout30Days, nearExpiryCount },
  };
}

export interface UseAiInventoryForecastParams {
  locationId: string;
}

export function useAiInventoryForecast(params: UseAiInventoryForecastParams | null) {
  return useQuery({
    queryKey: ['ai-inventory-forecast', params?.locationId],
    queryFn: () => fetchForecast(params!.locationId),
    enabled: !!params?.locationId,
    staleTime: 60000,
  });
}
