import { Box, Typography, Card, CardContent } from '@mui/material';
import { useAuth } from '@/auth/AuthContext';

export function HomePage() {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Welcome, {user?.name}
      </Typography>
      <Card sx={{ maxWidth: 500 }}>
        <CardContent>
          <Typography variant="subtitle1">
            Drug & prescription management system – Healthineer
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Role: {user?.role === 'doctor' ? 'Doctor' : user?.role === 'pharmacist' ? 'Pharmacist' : user?.role === 'admin' ? 'Admin' : user?.role}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Use the sidebar menu to navigate.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
