import { useState, useCallback } from 'react';
import type { AiSuggestedMedication } from './types';

const MOCK_DELAY_MS = 1500;

const mockSuggestions: AiSuggestedMedication[] = [
  {
    medicationId: 'm2',
    name: 'Paracetamol 500mg',
    dose: '500',
    frequency: '3x',
    durationDays: 5,
    route: 'oral',
    reasoning: 'Giảm đau, hạ sốt phù hợp chẩn đoán viêm họng.',
    confidence: 0.92,
  },
  {
    medicationId: 'm5',
    name: 'Omeprazole 20mg',
    dose: '20',
    frequency: '1x',
    durationDays: 7,
    route: 'oral',
    reasoning: 'Bảo vệ dạ dày khi dùng thuốc giảm đau kéo dài.',
    confidence: 0.78,
  },
  {
    medicationId: 'm3',
    name: 'Ibuprofen 400mg',
    dose: '400',
    frequency: '2x',
    durationDays: 3,
    route: 'oral',
    reasoning: 'Kháng viêm hỗ trợ trong trường hợp đau nhiều.',
    confidence: 0.65,
  },
  {
    medicationId: 'm4',
    name: 'Loperamide 2mg',
    dose: '2',
    frequency: '2x',
    durationDays: 2,
    route: 'oral',
    reasoning: 'Chỉ bổ sung nếu bệnh nhân có triệu chứng rối loạn tiêu hóa.',
    confidence: 0.5,
  },
];

async function fetchSuggestions(
  _patientId: string,
  _diagnosis: string,
  _currentMedications: { medicationId: string }[]
): Promise<AiSuggestedMedication[]> {
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
  return [...mockSuggestions];
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
    fetchSuggestions(params.patientId, params.diagnosis, params.currentMedications)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setIsLoading(false));
  }, [params?.patientId, params?.diagnosis, params?.currentMedications]);

  return { data, isLoading, error, refetch };
}
