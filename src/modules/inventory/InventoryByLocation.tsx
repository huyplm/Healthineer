import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  Button,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/api';

const alertColors: Record<string, 'default' | 'warning' | 'error'> = {
  ok: 'default',
  low: 'warning',
  expiring: 'error',
};

export function InventoryByLocation() {
  const [locationId, setLocationId] = useState('');
  const navigate = useNavigate();

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => inventoryApi.getLocations(),
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['inventory', locationId],
    queryFn: () => inventoryApi.getByLocation(locationId),
    enabled: !!locationId,
  });

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Inventory by Location
      </Typography>
      <FormControl size="small" sx={{ minWidth: 200, mb: 2 }}>
        <InputLabel>Select location</InputLabel>
        <Select
          value={locationId}
          label="Select location"
          onChange={(e) => setLocationId(e.target.value)}
        >
          {locations.map((l) => (
            <MenuItem key={l.id} value={l.id}>
              {l.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {locationId && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
<TableCell>Medication</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Batches</TableCell>
              <TableCell>Nearest expiry</TableCell>
              <TableCell>Alert</TableCell>
              <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Loading...</TableCell>
                </TableRow>
              ) : (
                records.map((r) => (
                  <TableRow key={r.medicationId} hover>
                    <TableCell>{r.medication?.tradeName}</TableCell>
                    <TableCell>{r.totalQuantity}</TableCell>
                    <TableCell>{r.medication?.unit || 'units'}</TableCell>
                    <TableCell>{r.batches.length}</TableCell>
                    <TableCell>{r.nearestExpiry ? new Date(r.nearestExpiry).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={r.alertLevel === 'ok' ? 'OK' : r.alertLevel === 'low' ? 'Low' : 'Expiring'}
                        size="small"
                        color={alertColors[r.alertLevel]}
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => navigate(`/inventory/${r.medicationId}?location=${locationId}`)}>
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
