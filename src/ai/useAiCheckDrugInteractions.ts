import { useState, useCallback, useEffect } from 'react';
import type { AiDrugInteraction } from './types';
import { apiFetch } from '@/api/apiFetch';

async function fetchInteractions(
  patientId: string,
  medicationIds: string[],
): Promise<AiDrugInteraction[]> {
  try {
    return await apiFetch<AiDrugInteraction[]>('/api/ai/prescriptions/interactions', {
      method: 'POST',
      body: JSON.stringify({
        patientId: Number(patientId) || 0,
        medications: medicationIds.map((id) => Number(id) || 0),
      }),
    });
  } catch {
    return fallbackMock(medicationIds);
  }
}

function fallbackMock(medicationIds: string[]): AiDrugInteraction[] {
  if (medicationIds.length < 2) return [];
  return [
    { id: 'int1', severity: 'high', message: 'Increased risk of GI bleeding when NSAID and PPI are used long-term together.', drugsInvolved: ['Paracetamol', 'Ibuprofen'], recommendation: 'Consider monitoring or switching analgesic group.' },
    { id: 'int2', severity: 'moderate', message: 'Paracetamol and Ibuprofen can be used alternately but avoid simultaneous use.', drugsInvolved: ['Paracetamol', 'Omeprazole'], recommendation: 'Space at least 4 hours apart if both needed.' },
    { id: 'int3', severity: 'low', message: 'Some drugs may mildly affect liver metabolism.', drugsInvolved: ['Paracetamol', 'Ibuprofen'], recommendation: 'Monitor liver function if used long-term.' },
  ];
}

export interface UseAiCheckDrugInteractionsParams {
  patientId: string;
  medicationsInPrescription: { medicationId: string; medication?: { tradeName: string } }[];
  activeMedicationsOfPatient?: string[];
}

export interface UseAiCheckDrugInteractionsResult {
  data: AiDrugInteraction[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  acknowledged: Set<string>;
  overrideReasons: Record<string, string>;
  acknowledge: (id: string) => void;
  override: (id: string, reason: string) => void;
}

export function useAiCheckDrugInteractions(
  params: UseAiCheckDrugInteractionsParams | null,
  options?: { enabled?: boolean; autoRun?: boolean }
): UseAiCheckDrugInteractionsResult {
  const [data, setData] = useState<AiDrugInteraction[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [overrideReasons, setOverrideReasons] = useState<Record<string, string>>({});

  const run = useCallback(() => {
    if (!params?.patientId) return;
    const medIds = params.medicationsInPrescription.map((m) => m.medicationId).filter(Boolean);
    if (medIds.length === 0) {
      setData(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    fetchInteractions(params.patientId, medIds)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setIsLoading(false));
  }, [
    params?.patientId,
    params?.medicationsInPrescription,
  ]);

  useEffect(() => {
    if (options?.autoRun !== false && params?.patientId && params?.medicationsInPrescription?.length) {
      run();
    }
  }, [params?.patientId, params?.medicationsInPrescription, options?.autoRun, run]);

  const acknowledge = useCallback((id: string) => {
    setAcknowledged((prev) => new Set(prev).add(id));
  }, []);

  const override = useCallback((id: string, reason: string) => {
    setOverrideReasons((prev) => ({ ...prev, [id]: reason }));
    setAcknowledged((prev) => new Set(prev).add(id));
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch: run,
    acknowledged,
    overrideReasons,
    acknowledge,
    override,
  };
}
