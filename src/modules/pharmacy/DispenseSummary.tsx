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
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { prescriptionsApi } from '@/api';

export function DispenseSummary() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: prescription, isLoading } = useQuery({
    queryKey: ['prescription', id],
    queryFn: () => prescriptionsApi.getById(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: () => prescriptionsApi.update(id!, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescription', id] });
      navigate('/pharmacy/queue');
    },
  });

  if (isLoading || !prescription) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Dispense Summary – {prescription.code}
      </Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2">Patient: {prescription.patient?.fullName}</Typography>
        <Typography variant="subtitle2">Diagnosis: {prescription.diagnosis}</Typography>
      </Paper>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Dispensed Medications</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Medication</TableCell>
                <TableCell>Dose</TableCell>
                <TableCell>Frequency</TableCell>
                <TableCell>Duration</TableCell>
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
                  <TableCell>{item.instructions || item.route}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" startIcon={<PrintIcon />}>
          Print (mock)
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<CheckCircleIcon />}
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          Mark as Completed
        </Button>
        <Button variant="outlined" onClick={() => navigate('/pharmacy/queue')}>
          Back
        </Button>
      </Box>
    </Box>
  );
}
