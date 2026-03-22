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
  const res = await apiFetch<AiChatApiResponse>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({
      prescriptionId: Number(prescriptionId),
      message: question,
    }),
  });
  return res.content;
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

export function useAiChatForPrescription(
  params: UseAiChatForPrescriptionParams | null,
): UseAiChatForPrescriptionResult {
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
    [params?.prescriptionId],
  );

  return { messages, isLoading, error, ask, quickQuestions: QUICK_QUESTIONS };
}
