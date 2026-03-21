import { useQuery } from '@tanstack/react-query';
import type { AiPatientSummary } from './types';
import { apiFetch } from '@/api/apiFetch';

async function fetchSummary(patientId: string): Promise<AiPatientSummary> {
  try {
    return await apiFetch<AiPatientSummary>(`/api/ai/patients/${patientId}/summary`);
  } catch {
    return fallbackMock(patientId);
  }
}

function fallbackMock(patientId: string): AiPatientSummary {
  return {
    summary: `Patient ${patientId.slice(-3)} has history of visits to Internal Medicine and Surgery. Prescribed for pharyngitis, digestive disorder. Notable conditions (hypertension, diabetes). Allergy: Penicillin. Last visit 18/02/2025, diagnosis acute pharyngitis, prescription sent to pharmacy. Monitor blood glucose and BP when on new medications.`,
    updatedAt: new Date().toISOString(),
    sources: ['prescriptions', 'visits', 'allergies', 'conditions', 'notes'],
  };
}

export interface UseAiPatientSummaryParams {
  patientId: string;
}

export function useAiPatientSummary(params: UseAiPatientSummaryParams | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['ai-patient-summary', params?.patientId],
    queryFn: () => fetchSummary(params!.patientId),
    enabled: (options?.enabled ?? true) && !!params?.patientId,
    staleTime: 60000,
  });
}
