import { useQuery } from '@tanstack/react-query';
import type { AiInventoryForecastItem, AiInventoryForecastSummary } from './types';
import { apiFetch } from '@/api/apiFetch';

interface ForecastApiResponse {
  items: AiInventoryForecastItem[];
  summary: AiInventoryForecastSummary;
}

async function fetchForecast(locationId: string): Promise<ForecastApiResponse> {
  return apiFetch<ForecastApiResponse>(
    `/api/ai/inventory/forecast?locationId=${encodeURIComponent(locationId)}`,
  );
}

export interface UseAiInventoryForecastParams {
  locationId: string;
}

export function useAiInventoryForecast(params: UseAiInventoryForecastParams | null) {
  return useQuery({
    queryKey: ['ai-inventory-forecast', params?.locationId],
    queryFn: () => fetchForecast(params!.locationId),
    enabled: !!params?.locationId,
    staleTime: 60_000,
  });
}
