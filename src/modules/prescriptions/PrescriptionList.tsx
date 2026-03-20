import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useQuery } from '@tanstack/react-query';
import { prescriptionsApi } from '@/api';
import { useAuth } from '@/auth/AuthContext';

const statusConfig: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' }> = {
  draft: { label: 'Draft', color: 'default' },
  submitted: { label: 'Submitted', color: 'info' },
  reviewed: { label: 'Reviewed', color: 'primary' },
  approved: { label: 'Approved', color: 'primary' },
  dispensed: { label: 'Dispensed', color: 'secondary' },
  completed: { label: 'Completed', color: 'success' },
};

export function PrescriptionList() {
  const [status, setStatus] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ['prescriptions', user?.id, status],
    queryFn: () =>
      prescriptionsApi.getAll({
        doctorId: user?.id,
        status: status || undefined,
      }),
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">My Prescriptions</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/prescriptions/new')}>
          New Prescription
        </Button>
      </Box>
      <Box sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {Object.entries(statusConfig).map(([k, v]) => (
              <MenuItem key={k} value={k}>
                {v.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">Loading...</TableCell>
              </TableRow>
            ) : (
              prescriptions.map((rx) => (
                <TableRow key={rx.id} hover>
                  <TableCell>{rx.code}</TableCell>
                  <TableCell>{rx.patient?.fullName}</TableCell>
                  <TableCell>{new Date(rx.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={statusConfig[rx.status]?.label || rx.status}
                      size="small"
                      color={statusConfig[rx.status]?.color || 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<VisibilityIcon />} onClick={() => navigate(`/prescriptions/${rx.id}`)}>
                      View
                    </Button>
                    {rx.status === 'draft' && (
                      <Button size="small" onClick={() => navigate(`/prescriptions/${rx.id}/edit`)}>
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
