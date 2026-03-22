import { useQuery } from '@tanstack/react-query';
import type { AiPatientSummary } from './types';
import { apiFetch } from '@/api/apiFetch';

async function fetchSummary(patientId: string): Promise<AiPatientSummary> {
  return apiFetch<AiPatientSummary>(`/api/ai/patients/${patientId}/summary`);
}

export interface UseAiPatientSummaryParams {
  patientId: string;
}

export function useAiPatientSummary(params: UseAiPatientSummaryParams | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['ai-patient-summary', params?.patientId],
    queryFn: () => fetchSummary(params!.patientId),
    enabled: (options?.enabled ?? true) && !!params?.patientId,
    staleTime: 60_000,
  });
}
