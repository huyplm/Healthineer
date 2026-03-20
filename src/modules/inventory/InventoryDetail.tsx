import { useParams, useSearchParams } from 'react-router-dom';
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
import AddIcon from '@mui/icons-material/Add';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi, medicationsApi } from '@/api';

export function InventoryDetail() {
  const { medicationId } = useParams<{ medicationId: string }>();
  const [searchParams] = useSearchParams();
  const locationId = searchParams.get('location') || '';

  const { data: medication } = useQuery({
    queryKey: ['medication', medicationId],
    queryFn: () => medicationsApi.getById(medicationId!),
    enabled: !!medicationId,
  });

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['batches', medicationId, locationId],
    queryFn: () => inventoryApi.getMedicationBatches(medicationId!, locationId || undefined),
    enabled: !!medicationId,
  });

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Inventory detail – {medication?.tradeName}
      </Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2">Medication: {medication?.tradeName} {medication?.strength}</Typography>
        <Typography variant="body2">Code: {medication?.code}</Typography>
      </Paper>
      <Typography variant="subtitle1" gutterBottom>Batches</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Batch</TableCell>
              <TableCell>Mfg date</TableCell>
              <TableCell>Expiry</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Unit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">Loading...</TableCell>
              </TableRow>
            ) : (
              batches.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{b.batchNumber}</TableCell>
                  <TableCell>{new Date(b.manufactureDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(b.expiryDate).toLocaleDateString()}</TableCell>
                  <TableCell>{b.quantity}</TableCell>
                  <TableCell>{medication?.unit || 'units'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Button startIcon={<AddIcon />} sx={{ mt: 2 }}>
        Import batch (mock)
      </Button>
    </Box>
  );
}
