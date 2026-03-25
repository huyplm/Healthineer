import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Chip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { useAiChatForPrescription } from '@/ai';

const POLL_INTERVAL = 5000;

interface DiscussionPanelProps {
  prescriptionId: string;
}

export function DiscussionPanel({ prescriptionId }: DiscussionPanelProps) {
  const [message, setMessage] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const aiChat = useAiChatForPrescription({ prescriptionId });

  const { data: conversation, isLoading } = useQuery({
    queryKey: ['conversation', prescriptionId],
    queryFn: () => chatApi.getOrCreateByPrescription(prescriptionId, user!.id),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', prescriptionId],
    queryFn: () => chatApi.getMessages(prescriptionId),
    enabled: !!prescriptionId,
    refetchInterval: POLL_INTERVAL,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => chatApi.sendMessage(prescriptionId, user!.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', prescriptionId] });
      setMessage('');
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    sendMutation.mutate(message.trim());
  };

  const handleAskAi = () => {
    if (aiQuestion.trim()) {
      aiChat.ask(aiQuestion.trim());
      setAiQuestion('');
    }
  };

  if (isLoading || !conversation) {
    return (
      <Paper sx={{ p: 2, height: 300 }}>
        <CircularProgress size={24} />
      </Paper>
    );
  }

  const formatSender = (m: { senderName?: string; senderRole?: string; sender?: { name?: string } }) => {
    const name = m.senderName || m.sender?.name || 'Unknown';
    const role = (m.senderRole || '').toUpperCase();
    if (role === 'DOCTOR') return name.startsWith('Dr.') ? name : `Dr. ${name}`;
    if (role === 'PHARMACIST') return name.includes(', RPh') ? name : `${name}, RPh`;
    if (role === 'ADMIN') return `${name} (Admin)`;
    return name;
  };

  return (
    <Paper sx={{ p: 2, height: 560, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle1" gutterBottom>
        Discussion
      </Typography>
      <List sx={{ flex: 1, overflow: 'auto', maxHeight: 220 }}>
        {messages.map((m) => (
          <ListItem key={m.id} alignItems="flex-start">
            <ListItemText
              primary={m.content}
              secondary={`${formatSender(m)} • ${new Date(m.createdAt).toLocaleString('en-US')}`}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItem>
        ))}
      </List>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <SmartToyIcon fontSize="small" /> AI Assistant
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
        {aiChat.quickQuestions.map((q) => (
          <Chip key={q} label={q} size="small" onClick={() => aiChat.ask(q)} sx={{ maxWidth: '100%' }} />
        ))}
      </Box>
      <List dense sx={{ overflow: 'auto', maxHeight: 120 }}>
        {aiChat.messages.map((m) => (
          <ListItem
            key={m.id}
            alignItems="flex-start"
            sx={{
              bgcolor: m.role === 'ai' ? 'action.hover' : 'transparent',
              borderRadius: 1,
              mb: 0.5,
            }}
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {m.role === 'ai' && <Chip size="small" label="AI" color="primary" />}
              {m.content}
                </Box>
              }
              secondary={new Date(m.createdAt).toLocaleString('en-US')}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItem>
        ))}
        {aiChat.isLoading && (
          <ListItem>
            <CircularProgress size={16} />
            <Typography variant="caption" sx={{ ml: 1 }}>AI is typing...</Typography>
          </ListItem>
        )}
      </List>
      <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Ask AI..."
          value={aiQuestion}
          onChange={(e) => setAiQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAskAi())}
        />
        <Button variant="outlined" startIcon={<SmartToyIcon />} onClick={handleAskAi} disabled={!aiQuestion.trim() || aiChat.isLoading}>
          Ask AI
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
        />
        <Button variant="contained" onClick={handleSend} disabled={!message.trim() || sendMutation.isPending}>
          <SendIcon />
        </Button>
      </Box>
    </Paper>
  );
}
