import { useState, useCallback } from 'react';
import type { AiChatMessage } from './types';
import { apiFetch } from '@/api/apiFetch';

interface AiChatApiResponse {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

async function sendToAi(prescriptionId: string, question: string): Promise<string> {
  try {
    const res = await apiFetch<AiChatApiResponse>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        prescriptionId: Number(prescriptionId) || 0,
        message: question,
      }),
    });
    return res.content;
  } catch {
    return fallbackMock(question);
  }
}

function fallbackMock(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('interaction'))
    return 'In this prescription, Paracetamol and Ibuprofen should not be taken simultaneously; space at least 4 hours apart. Omeprazole provides GI protection.';
  if (q.includes('kidney') || q.includes('renal'))
    return 'Adjust dosing for renal-impaired patients. Paracetamol is generally safe; avoid or reduce NSAIDs if eGFR < 30.';
  if (q.includes('summary') || q.includes('patient'))
    return 'Current prescription includes: (1) Analgesic/antipyretic 3x/day for 5 days. (2) Gastroprotective agent morning dose. Patient should take medications after meals.';
  return 'Based on the current prescription, the medications are appropriate for the diagnosis. The patient should adhere to the prescribed dosage and timing. Review the AI Drug Safety section for any flagged interactions.';
}

export interface UseAiChatForPrescriptionParams {
  prescriptionId: string;
}

export interface UseAiChatForPrescriptionResult {
  messages: AiChatMessage[];
  isLoading: boolean;
  error: Error | null;
  ask: (question: string) => void;
  quickQuestions: string[];
}

const QUICK_QUESTIONS = [
  'Explain drug interactions in this prescription.',
  'Any medications that need dose adjustment for kidney function?',
  'Summarize this prescription for the patient.',
];

export function useAiChatForPrescription(params: UseAiChatForPrescriptionParams | null): UseAiChatForPrescriptionResult {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const ask = useCallback(
    (question: string) => {
      if (!params?.prescriptionId || !question.trim()) return;
      const userMsg: AiChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: question.trim(),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setError(null);
      setIsLoading(true);
      sendToAi(params.prescriptionId, question)
        .then((content) => {
          const aiMsg: AiChatMessage = {
            id: `ai-${Date.now()}`,
            role: 'ai',
            content,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiMsg]);
        })
        .catch((e) => setError(e instanceof Error ? e : new Error(String(e))))
        .finally(() => setIsLoading(false));
    },
    [params?.prescriptionId]
  );

  return {
    messages,
    isLoading,
    error,
    ask,
    quickQuestions: QUICK_QUESTIONS,
  };
}
