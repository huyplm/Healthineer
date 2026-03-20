import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { prescriptionsApi } from '@/api';
import { DiscussionPanel } from '@/modules/chat/DiscussionPanel';

export function PrescriptionReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: prescription, isLoading } = useQuery({
    queryKey: ['prescription', id],
    queryFn: () => prescriptionsApi.getById(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (status: 'reviewed' | 'approved' | 'dispensed') =>
      prescriptionsApi.update(id!, { status }),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['prescription', id] });
      queryClient.invalidateQueries({ queryKey: ['prescription-queue'] });
      if (status === 'dispensed') {
        navigate(`/pharmacy/dispense/${id}`);
      }
    },
  });

  if (isLoading || !prescription) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h5" gutterBottom>
          Review Prescription {prescription.code}
        </Typography>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Patient Info</Typography>
          <Typography>Name: {prescription.patient?.fullName}</Typography>
          <Typography>Allergies: {prescription.patient?.allergies?.length
            ? prescription.patient.allergies.map((a) => a.name).join(', ')
            : 'None'}</Typography>
          <Typography>Conditions: {prescription.patient?.conditions?.length
            ? prescription.patient.conditions.map((c) => c.name).join(', ')
            : 'None'}</Typography>
        </Paper>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Medications & Stock (mock)</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Medication</TableCell>
                  <TableCell>Dose / Qty</TableCell>
                  <TableCell>Stock</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {prescription.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.medication?.tradeName}</TableCell>
                    <TableCell>{item.dose} {item.unit} x {item.duration} days</TableCell>
                    <TableCell>In stock (mock)</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        {prescription.patient?.allergies && prescription.patient.allergies.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Allergy warning: {prescription.patient.allergies.map((a) => a.name).join(', ')}
          </Alert>
        )}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<CheckCircleIcon />}
            onClick={() => updateMutation.mutate(prescription.status === 'submitted' ? 'reviewed' : 'approved')}
            disabled={updateMutation.isPending}
          >
            {prescription.status === 'submitted' ? 'Review' : 'Approve'}
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<LocalShippingIcon />}
            onClick={() => updateMutation.mutate('dispensed')}
            disabled={updateMutation.isPending}
          >
            Dispense
          </Button>
        </Box>
      </Box>
      <Box sx={{ width: 360 }}>
        <DiscussionPanel prescriptionId={id!} />
      </Box>
    </Box>
  );
}
