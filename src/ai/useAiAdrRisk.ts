import { useQuery } from '@tanstack/react-query';
import type { AiAdrRisk } from './types';
import { apiFetch } from '@/api/apiFetch';

async function fetchAdrRisk(patientId: string): Promise<AiAdrRisk> {
  return apiFetch<AiAdrRisk>(`/api/ai/patients/${patientId}/adr-risk`);
}

export interface UseAiAdrRiskParams {
  patientId: string;
  context?: { age?: number; currentMedicationCount?: number };
}

export function useAiAdrRisk(params: UseAiAdrRiskParams | null) {
  return useQuery({
    queryKey: ['ai-adr-risk', params?.patientId],
    queryFn: () => fetchAdrRisk(params!.patientId),
    enabled: !!params?.patientId,
    staleTime: 60_000,
  });
}
