import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/api';
import { useAiInventoryForecast } from '@/ai';

const expiryRiskColors: Record<string, 'default' | 'warning' | 'error'> = {
  none: 'default',
  near: 'warning',
  high: 'error',
};

const expiryRiskLabels: Record<string, string> = {
  none: 'None',
  near: 'Near expiry',
  high: 'Expired',
};

export function InventoryAIDashboard() {
  const [locationId, setLocationId] = useState('');
  const [highRiskOnly, setHighRiskOnly] = useState(false);

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => inventoryApi.getLocations(),
  });

  const { data, isLoading } = useAiInventoryForecast(
    locationId ? { locationId } : null
  );

  const items = data?.items ?? [];
  const summary = data?.summary;
  const filteredItems = highRiskOnly
    ? items.filter(
        (i) =>
          (i.daysUntilStockout !== null && i.daysUntilStockout < 7) ||
          i.expiryRisk === 'high'
      )
    : items;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Inventory AI Dashboard
      </Typography>

      <FormControl size="small" sx={{ minWidth: 200, mb: 2 }}>
        <InputLabel>Location</InputLabel>
        <Select
          value={locationId}
          label="Location"
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
        <>
          {summary && (
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" variant="body2">
                    At risk of stockout in 7 days
                  </Typography>
                  <Typography variant="h6">{summary.atRiskStockout7Days}</Typography>
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" variant="body2">
                    At risk of stockout in 30 days
                  </Typography>
                  <Typography variant="h6">{summary.atRiskStockout30Days}</Typography>
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" variant="body2">
                    Near expiry
                  </Typography>
                  <Typography variant="h6">{summary.nearExpiryCount}</Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={highRiskOnly}
                onChange={(e) => setHighRiskOnly(e.target.checked)}
              />
            }
            label="Show high risk only (stockout &lt; 7 days or expiry)"
            sx={{ mb: 2 }}
          />

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
<TableCell>Medication</TableCell>
              <TableCell>Days until stockout</TableCell>
              <TableCell>Expiry risk</TableCell>
              <TableCell>Recommended action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      {highRiskOnly ? 'No medications in high-risk group.' : 'No data.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((row) => (
                    <TableRow key={row.medicationId} hover>
                      <TableCell>{row.medicationName}</TableCell>
                      <TableCell>
                        {row.daysUntilStockout === null
                          ? '—'
                          : `${row.daysUntilStockout} days`}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={expiryRiskLabels[row.expiryRisk]}
                          color={expiryRiskColors[row.expiryRisk]}
                        />
                      </TableCell>
                      <TableCell>{row.recommendedAction}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
