import { useState } from 'react';
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { useQuery } from '@tanstack/react-query';
import { medicationsApi } from '@/api';

export function MedicationCatalog() {
  const [search, setSearch] = useState('');
  const { data: medications = [] } = useQuery({
    queryKey: ['medications', search],
    queryFn: () => medicationsApi.getAll({ search: search || undefined }),
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Medication Catalog</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add medication
        </Button>
      </Box>
      <TextField
        size="small"
        label="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, minWidth: 250 }}
      />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Trade name</TableCell>
              <TableCell>Active ingredient</TableCell>
              <TableCell>Form</TableCell>
              <TableCell>Strength</TableCell>
              <TableCell>Route</TableCell>
              <TableCell>Group</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {medications.map((m) => (
              <TableRow key={m.id} hover>
                <TableCell>{m.code}</TableCell>
                <TableCell>{m.tradeName}</TableCell>
                <TableCell>{m.activeIngredient}</TableCell>
                <TableCell>{m.form}</TableCell>
                <TableCell>{m.strength}</TableCell>
                <TableCell>{m.route}</TableCell>
                <TableCell>{m.group}</TableCell>
                <TableCell align="right">
                  <Button size="small" startIcon={<EditIcon />}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
