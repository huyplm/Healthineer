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
  Chip,
  Button,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useQuery } from '@tanstack/react-query';
import { prescriptionsApi } from '@/api';

const statusLabels: Record<string, string> = {
  submitted: 'Submitted',
  reviewed: 'Reviewed',
};

export function PrescriptionQueue() {
  const navigate = useNavigate();

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['prescription-queue'],
    queryFn: () => prescriptionsApi.getQueue(),
  });

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Prescription Queue
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Date & Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Loading...</TableCell>
              </TableRow>
            ) : (
              queue.map((rx) => (
                <TableRow key={rx.id} hover>
                  <TableCell>{rx.code}</TableCell>
                  <TableCell>{rx.patientName || rx.patient?.fullName}</TableCell>
                  <TableCell>{rx.doctor?.name}</TableCell>
                  <TableCell>{rx.department}</TableCell>
                  <TableCell>{new Date(rx.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip label={statusLabels[rx.status] || rx.status} size="small" color="info" />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => navigate(`/pharmacy/review/${rx.id}`)}
                    >
                      View / Review
                    </Button>
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
