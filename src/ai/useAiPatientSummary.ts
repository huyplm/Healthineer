import { useQuery } from '@tanstack/react-query';
import type { AiPatientSummary } from './types';

const MOCK_DELAY_MS = 1200;

async function fetchSummary(patientId: string): Promise<AiPatientSummary> {
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
  const now = new Date().toISOString();
  return {
    summary: `Patient ${patientId.slice(-3)} has history of visits to Internal Medicine and Surgery. Prescribed for pharyngitis, digestive disorder. Notable conditions (hypertension, diabetes). Allergy: Penicillin. Last visit 18/02/2025, diagnosis acute pharyngitis, prescription sent to pharmacy. Monitor blood glucose and BP when on new medications.`,
    updatedAt: now,
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
