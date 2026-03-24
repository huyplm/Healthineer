import { useState, useCallback, useEffect, useRef } from 'react';
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
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const lastKeyRef = useRef<string>('');

  const medIds = params?.medicationsInPrescription?.map((m) => m.medicationId).filter(Boolean) ?? [];
  const stableKey = params?.patientId ? `${params.patientId}:${medIds.sort().join(',')}` : '';

  const run = useCallback(() => {
    if (!params?.patientId || medIds.length === 0) {
      setData(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    fetchInteractions(params.patientId, medIds)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableKey]);

  useEffect(() => {
    if (options?.autoRun === false || !stableKey || stableKey === lastKeyRef.current) return;
    lastKeyRef.current = stableKey;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(run, 800);

    return () => clearTimeout(debounceRef.current);
  }, [stableKey, options?.autoRun, run]);

  const acknowledge = useCallback((id: string) => {
    setAcknowledged((prev) => new Set(prev).add(id));
  }, []);

  const override = useCallback((id: string, reason: string) => {
    setOverrideReasons((prev) => ({ ...prev, [id]: reason }));
    setAcknowledged((prev) => new Set(prev).add(id));
  }, []);

  return { data, isLoading, error, refetch: run, acknowledged, overrideReasons, acknowledge, override };
}
