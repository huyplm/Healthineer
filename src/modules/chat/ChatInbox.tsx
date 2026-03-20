import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { chatApi } from '@/api';
import { useAuth } from '@/auth/AuthContext';

export function ChatInbox() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => chatApi.getConversations(user!.id),
    enabled: !!user?.id,
  });

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Messages
      </Typography>
      <Paper sx={{ maxWidth: 600 }}>
        {isLoading ? (
          <Typography sx={{ p: 2 }}>Loading...</Typography>
        ) : conversations.length === 0 ? (
          <Typography sx={{ p: 2 }} color="text.secondary">
            No conversations yet
          </Typography>
        ) : (
          <List>
            {conversations.map((conv) => (
              <ListItem key={conv.id} disablePadding>
                <ListItemButton onClick={() => conv.prescriptionId && navigate(`/prescriptions/${conv.prescriptionId}`)}>
                  <ListItemText
                    primary={`Prescription ${conv.prescriptionId ? conv.prescriptionId : conv.id}`}
                    secondary={new Date(conv.lastMessageAt).toLocaleString()}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}
