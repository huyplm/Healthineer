import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
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
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useQuery } from '@tanstack/react-query';
import { patientsApi } from '@/api';

const statusLabels: Record<string, string> = {
  examining: 'Examining',
  admitted: 'Admitted',
  discharged: 'Discharged',
};

export function PatientList() {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients', search, department, status],
    queryFn: () =>
      patientsApi.getAll({
        search: search || undefined,
        department: department || undefined,
        status: status || undefined,
      }),
  });

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Patient List
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          label="Search (name, code, phone)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Department</InputLabel>
          <Select value={department} label="Department" onChange={(e) => setDepartment(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Internal Medicine">Internal Medicine</MenuItem>
            <MenuItem value="Surgery">Surgery</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="examining">Examining</MenuItem>
            <MenuItem value="admitted">Admitted</MenuItem>
            <MenuItem value="discharged">Discharged</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/patients/new')}>
          New Patient
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>Date of Birth</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Room / Dept</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              patients.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.code}</TableCell>
                  <TableCell>{p.fullName}</TableCell>
                  <TableCell>{p.dateOfBirth}</TableCell>
                  <TableCell>{p.gender === 'male' ? 'Male' : p.gender === 'female' ? 'Female' : 'Other'}</TableCell>
                  <TableCell>{p.phone}</TableCell>
                  <TableCell>{p.room || p.department || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={statusLabels[p.status]}
                      size="small"
                      color={
                        p.status === 'examining'
                          ? 'primary'
                          : p.status === 'discharged'
                            ? 'default'
                            : 'secondary'
                      }
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => navigate(`/patients/${p.id}`)}>
                      <VisibilityIcon />
                    </IconButton>
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
