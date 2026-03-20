import { useQuery } from '@tanstack/react-query';
import type { AiAdrRisk } from './types';

const MOCK_DELAY_MS = 600;

async function fetchAdrRisk(_patientId: string, context?: { age?: number; currentMedicationCount?: number }): Promise<AiAdrRisk> {
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
  const age = context?.age ?? 45;
  const medCount = context?.currentMedicationCount ?? 2;
  const factors: string[] = [];
  let score = 20;
  if (age >= 65) {
    factors.push('Elderly (≥65)');
    score += 25;
  }
  if (medCount >= 5) {
    factors.push('Polypharmacy');
    score += 30;
  }
  if (medCount >= 3) {
    factors.push('Multiple concurrent medications');
    score += 15;
  }
  if (factors.length === 0) {
    factors.push('No major risk factors');
  }
  score = Math.min(100, score);
  const level: AiAdrRisk['level'] = score >= 60 ? 'high' : score >= 35 ? 'medium' : 'low';
  return { level, score, factors };
}

export interface UseAiAdrRiskParams {
  patientId: string;
  /** Optional: để mock logic theo tuổi/số thuốc */
  context?: { age?: number; currentMedicationCount?: number };
}

export function useAiAdrRisk(params: UseAiAdrRiskParams | null) {
  return useQuery({
    queryKey: ['ai-adr-risk', params?.patientId, params?.context],
    queryFn: () => fetchAdrRisk(params!.patientId, params!.context),
    enabled: !!params?.patientId,
    staleTime: 60000,
  });
}
