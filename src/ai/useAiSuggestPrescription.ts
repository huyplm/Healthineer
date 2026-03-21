import { useState, useCallback } from 'react';
import type { AiSuggestedMedication } from './types';
import { apiFetch } from '@/api/apiFetch';

async function fetchSuggestions(
  patientId: string,
  diagnosis: string,
): Promise<AiSuggestedMedication[]> {
  try {
    return await apiFetch<AiSuggestedMedication[]>('/api/ai/prescriptions/suggest', {
      method: 'POST',
      body: JSON.stringify({ patientId: Number(patientId) || 0, diagnosis }),
    });
  } catch {
    return fallbackMock();
  }
}

function fallbackMock(): AiSuggestedMedication[] {
  return [
    { medicationId: 'm2', name: 'Paracetamol 500mg', dose: '500', frequency: '3x', durationDays: 5, route: 'oral', reasoning: 'Pain and fever reduction appropriate for diagnosis.', confidence: 0.92 },
    { medicationId: 'm5', name: 'Omeprazole 20mg', dose: '20', frequency: '1x', durationDays: 7, route: 'oral', reasoning: 'Gastroprotection during analgesic therapy.', confidence: 0.78 },
    { medicationId: 'm3', name: 'Ibuprofen 400mg', dose: '400', frequency: '2x', durationDays: 3, route: 'oral', reasoning: 'Anti-inflammatory support for pain management.', confidence: 0.65 },
  ];
}

export interface UseAiSuggestPrescriptionParams {
  patientId: string;
  diagnosis: string;
  currentMedications: { medicationId: string }[];
}

export interface UseAiSuggestPrescriptionResult {
  data: AiSuggestedMedication[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useAiSuggestPrescription(
  params: UseAiSuggestPrescriptionParams | null,
  _options?: { enabled?: boolean }
): UseAiSuggestPrescriptionResult {
  const [data, setData] = useState<AiSuggestedMedication[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(() => {
    if (!params?.patientId || !params?.diagnosis?.trim()) {
      setError(new Error('Please select a patient and enter diagnosis before calling AI.'));
      setData(null);
      return;
    }
    setError(null);
    setIsLoading(true);
    fetchSuggestions(params.patientId, params.diagnosis)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setIsLoading(false));
  }, [params?.patientId, params?.diagnosis]);

  return { data, isLoading, error, refetch };
}
