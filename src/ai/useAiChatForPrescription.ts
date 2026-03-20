import { useState, useCallback } from 'react';
import type { AiChatMessage } from './types';

const MOCK_DELAY_MS = 1000;

const MOCK_ANSWERS: Record<string, string> = {
  default: 'Dựa trên đơn thuốc hiện tại, các thuốc đã được kê phù hợp với chẩn đoán. Bệnh nhân cần tuân thủ liều và thời gian dùng. Nếu có tương tác thuốc đã được cảnh báo, vui lòng xem mục AI Drug Safety.',
  interaction: 'Trong đơn có Paracetamol và Ibuprofen. Không nên uống cùng lúc; nên cách nhau ít nhất 4 giờ. Omeprazole giúp bảo vệ dạ dày khi dùng thuốc giảm đau.',
  kidney: 'Theo hồ sơ, cần chỉnh liều theo chức năng thận cho các thuốc thải qua thận. Paracetamol thường an toàn; nên giảm liều hoặc tránh NSAID nếu eGFR < 30.',
  summary: 'Đơn hiện tại gồm: (1) Thuốc giảm đau hạ sốt 3 lần/ngày trong 5 ngày. (2) Thuốc bảo vệ dạ dày uống buổi sáng. Bệnh nhân nên uống sau ăn, không tự ý tăng liều.',
};

function getMockAnswer(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('tương tác') || q.includes('interaction')) return MOCK_ANSWERS.interaction;
  if (q.includes('thận') || q.includes('kidney') || q.includes('chức năng thận')) return MOCK_ANSWERS.kidney;
  if (q.includes('tóm tắt') || q.includes('summary') || q.includes('bệnh nhân')) return MOCK_ANSWERS.summary;
  return MOCK_ANSWERS.default;
}

async function sendToAi(_prescriptionId: string, question: string): Promise<string> {
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
  return getMockAnswer(question);
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
