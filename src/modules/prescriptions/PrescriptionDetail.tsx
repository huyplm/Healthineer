import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Button,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { prescriptionsApi } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { DiscussionPanel } from '@/modules/chat/DiscussionPanel';
import { useAiAdrRisk } from '@/ai';
import { AdrRiskBadge } from '@/components/AdrRiskBadge';

const statusSteps = ['draft', 'submitted', 'reviewed', 'approved', 'dispensed', 'completed'];
const statusLabels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  reviewed: 'Reviewed',
  approved: 'Approved',
  dispensed: 'Dispensed',
  completed: 'Completed',
};

export function PrescriptionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: prescription, isLoading, error } = useQuery({
    queryKey: ['prescription', id],
    queryFn: () => prescriptionsApi.getById(id!),
    enabled: !!id,
    retry: 1,
  });

  const { data: adrRisk, isLoading: adrLoading } = useAiAdrRisk(
    prescription?.patientId ? { patientId: prescription.patientId, context: { currentMedicationCount: prescription.items?.length ?? 0 } } : null
  );

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (error || !prescription) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error ? `Failed to load prescription: ${error.message}` : 'Prescription not found.'}
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/prescriptions')}>
          Back to Prescriptions
        </Button>
      </Box>
    );
  }

  const currentStepIndex = statusSteps.indexOf(prescription.status);

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h5" gutterBottom>
          Prescription {prescription.code}
        </Typography>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stepper activeStep={currentStepIndex} alternativeLabel>
            {statusSteps.map((s, i) => (
              <Step key={s} completed={i < currentStepIndex}>
                <StepLabel>{statusLabels[s]}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Details</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography>Patient: {prescription.patient?.fullName} ({prescription.patient?.code})</Typography>
            <AdrRiskBadge data={adrRisk} isLoading={adrLoading} />
          </Box>
          <Typography>Doctor: {prescription.doctor?.name}</Typography>
          <Typography>Department: {prescription.department}</Typography>
          <Typography>Diagnosis: {prescription.diagnosis}</Typography>
          {prescription.clinicalNotes && <Typography>Notes: {prescription.clinicalNotes}</Typography>}
        </Paper>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Medications</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Medication</TableCell>
                  <TableCell>Dose</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Route</TableCell>
                  <TableCell>Instructions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {prescription.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.medication?.tradeName} {item.medication?.strength}</TableCell>
                    <TableCell>{item.dose} {item.unit}</TableCell>
                    <TableCell>{item.frequency}/day</TableCell>
                    <TableCell>{item.duration} days</TableCell>
                    <TableCell>{item.route}</TableCell>
                    <TableCell>{item.instructions || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        {prescription.patient?.allergies && prescription.patient.allergies.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Allergies: {prescription.patient.allergies.map((a) => a.name).join(', ')}
          </Alert>
        )}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip label={statusLabels[prescription.status]} color="primary" />
          {prescription.status === 'draft' && (
            <Typography
              component="button"
              onClick={() => navigate(`/prescriptions/${id}/edit`)}
              sx={{ cursor: 'pointer', color: 'primary.main', textDecoration: 'underline' }}
            >
              Edit
            </Typography>
          )}
        </Box>
      </Box>
      {(user?.role === 'doctor' || user?.role === 'pharmacist') && (
        <Box sx={{ width: 360 }}>
          <DiscussionPanel prescriptionId={id!} />
        </Box>
      )}
    </Box>
  );
}
