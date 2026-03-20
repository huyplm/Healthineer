import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { patientsApi } from '@/api';
import { useAiAdrRisk, useAiPatientSummary } from '@/ai';
import { AdrRiskBadge } from '@/components/AdrRiskBadge';

interface TabPanelProps {
  children: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientsApi.getById(id!),
    enabled: !!id,
  });

  const { data: adrRisk, isLoading: adrLoading } = useAiAdrRisk(
    id ? { patientId: id, context: { age: patient ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : 0, currentMedicationCount: 3 } } : null
  );
  const { data: aiSummary, isLoading: summaryLoading, refetch: refetchSummary } = useAiPatientSummary(id ? { patientId: id } : null);

  if (isLoading || !patient) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5">
            {patient.fullName} ({patient.code})
          </Typography>
          <AdrRiskBadge data={adrRisk} isLoading={adrLoading} />
        </Box>
        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/patients/${id}/edit`)}>
          Edit
        </Button>
      </Box>
      <Paper>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="General Info" />
          <Tab label="Allergies & Conditions" />
          <Tab label="Visit History" />
          <Tab label="Prescriptions" />
          <Tab label="AI Summary" />
        </Tabs>
        <Box sx={{ px: 2 }}>
          <TabPanel value={tab} index={0}>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Date of Birth</TableCell>
                    <TableCell>{patient.dateOfBirth}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Gender</TableCell>
                    <TableCell>{patient.gender === 'male' ? 'Male' : patient.gender === 'female' ? 'Female' : 'Other'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                    <TableCell>{patient.phone}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Address</TableCell>
                    <TableCell>{patient.address || '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Insurance No.</TableCell>
                    <TableCell>{patient.insuranceNumber || '-'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
          <TabPanel value={tab} index={1}>
            <Typography variant="subtitle2" gutterBottom>Drug Allergies</Typography>
            <Box sx={{ mb: 2 }}>
              {patient.allergies.length > 0
                ? patient.allergies.map((a) => (
                    <Typography key={a.id}>• {a.name} {a.severity && `(${a.severity})`}</Typography>
                  ))
                : <Typography color="text.secondary">None</Typography>}
            </Box>
            <Typography variant="subtitle2" gutterBottom>Conditions</Typography>
            <Box>
              {patient.conditions.length > 0
                ? patient.conditions.map((c) => (
                    <Typography key={c.id}>• {c.name} {c.icdCode && `(${c.icdCode})`}</Typography>
                  ))
                : <Typography color="text.secondary">None</Typography>}
            </Box>
          </TabPanel>
          <TabPanel value={tab} index={2}>
            <Typography color="text.secondary">Visit history (mock – no data)</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Doctor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={3} align="center">No data</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
          <TabPanel value={tab} index={3}>
            <Typography color="text.secondary">Prescription history</Typography>
            <Button
              size="small"
              sx={{ mt: 1 }}
              onClick={() => navigate(`/prescriptions/new?patientId=${patient.id}`)}
            >
              View prescriptions
            </Button>
          </TabPanel>
          <TabPanel value={tab} index={4}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">AI Patient Summary</Typography>
              <Button size="small" variant="outlined" onClick={() => refetchSummary()} disabled={summaryLoading}>
                {summaryLoading ? 'Loading...' : 'Regenerate'}
              </Button>
            </Box>
            {summaryLoading ? (
              <Box>
                <Skeleton variant="text" width="100%" height={32} />
                <Skeleton variant="text" width="90%" height={32} />
                <Skeleton variant="text" width="95%" height={32} />
              </Box>
            ) : aiSummary ? (
              <Box>
                <Typography variant="body1" paragraph>{aiSummary.summary}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Last updated: {new Date(aiSummary.updatedAt).toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                  {aiSummary.sources.map((s) => (
                    <Chip key={s} label={s} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            ) : (
              <Typography color="text.secondary">Could not load summary. Try again later.</Typography>
            )}
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
}
