import { useState, useCallback, useEffect } from 'react';
import type { AiDrugInteraction } from './types';
import { apiFetch } from '@/api/apiFetch';

async function fetchInteractions(
  patientId: string,
  medicationIds: string[],
): Promise<AiDrugInteraction[]> {
  return apiFetch<AiDrugInteraction[]>('/api/ai/prescriptions/interactions', {
    method: 'POST',
    body: JSON.stringify({
      patientId: Number(patientId),
      medications: medicationIds.map(Number),
    }),
  });
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
  options?: { enabled?: boolean; autoRun?: boolean },
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
  }, [params?.patientId, params?.medicationsInPrescription]);

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

  return { data, isLoading, error, refetch: run, acknowledged, overrideReasons, acknowledge, override };
}
