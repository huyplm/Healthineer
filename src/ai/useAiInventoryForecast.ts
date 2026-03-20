import { useQuery } from '@tanstack/react-query';
import type { AiInventoryForecastItem, AiInventoryForecastSummary } from './types';

const MOCK_DELAY_MS = 900;

const MOCK_MED_NAMES = ['Paracetamol 500mg', 'Amoxicillin 500mg', 'Ibuprofen 400mg', 'Omeprazole 20mg', 'Loperamide 2mg'];

async function fetchForecast(_locationId: string): Promise<{
  items: AiInventoryForecastItem[];
  summary: AiInventoryForecastSummary;
}> {
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
  const items: AiInventoryForecastItem[] = MOCK_MED_NAMES.map((name, i) => {
    const daysOut = i === 0 ? 5 : i === 1 ? 14 : i === 2 ? 45 : null;
    const expiryRisk: AiInventoryForecastItem['expiryRisk'] =
      i === 1 ? 'high' : i === 2 ? 'near' : 'none';
    return {
      medicationId: `m${i + 1}`,
      medicationName: name,
      daysUntilStockout: daysOut,
      expiryRisk,
      recommendedAction:
        daysOut !== null && daysOut <= 7
          ? `Đặt mua thêm 200 đơn vị trong 48h`
          : expiryRisk === 'high'
            ? 'Kiểm tra lô hết hạn, không xuất từ lô cũ'
            : 'Dự trữ đủ dùng',
    };
  });
  const atRiskStockout7Days = items.filter((x) => x.daysUntilStockout !== null && x.daysUntilStockout <= 7).length;
  const atRiskStockout30Days = items.filter((x) => x.daysUntilStockout !== null && x.daysUntilStockout <= 30).length;
  const nearExpiryCount = items.filter((x) => x.expiryRisk === 'high' || x.expiryRisk === 'near').length;
  return {
    items,
    summary: {
      atRiskStockout7Days,
      atRiskStockout30Days,
      nearExpiryCount,
    },
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
