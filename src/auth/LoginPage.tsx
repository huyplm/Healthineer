import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Divider,
  Chip,
  Stack,
} from '@mui/material';
import { useAuth } from './AuthContext';

const DEMO_ACCOUNTS = [
  { username: 'doctor1', password: 'password', label: 'Doctor' },
  { username: 'pharm1', password: 'password', label: 'Pharmacist' },
  { username: 'admin', password: 'password', label: 'Admin' },
];

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password');
      return;
    }
    setError(null);
    setLoading(true);
    const err = await login(username.trim(), password);
    setLoading(false);
    if (err) {
      setError('Invalid username or password');
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleQuickLogin = async (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
    setLoading(true);
    const err = await login(u, p);
    setLoading(false);
    if (err) {
      setError('Backend not reachable. Please start the backend server.');
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Card sx={{ maxWidth: 420, width: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom textAlign="center">
            Healthineer – Sign in
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. doctor1"
              sx={{ mb: 2 }}
              autoComplete="username"
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              sx={{ mb: 2 }}
              autoComplete="current-password"
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <Divider sx={{ my: 2 }}>
            <Chip label="Quick login" size="small" />
          </Divider>

          <Stack direction="row" spacing={1} justifyContent="center">
            {DEMO_ACCOUNTS.map((acc) => (
              <Button
                key={acc.username}
                variant="outlined"
                size="small"
                disabled={loading}
                onClick={() => handleQuickLogin(acc.username, acc.password)}
              >
                {acc.label}
              </Button>
            ))}
          </Stack>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: 'block', textAlign: 'center' }}
          >
            Demo accounts: doctor1 / pharm1 / admin (password: password)
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
