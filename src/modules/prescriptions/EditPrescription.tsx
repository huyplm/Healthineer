import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  patientsApi,
  medicationsApi,
  prescriptionsApi,
  checkDrugInteraction,
} from '@/api';
import type { PrescriptionItem } from '@/types';

const itemSchema = z.object({
  id: z.string(),
  medicationId: z.string().min(1),
  dose: z.string().min(1),
  unit: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.number().min(1),
  route: z.string().min(1),
  instructions: z.string().optional(),
});

const schema = z.object({
  patientId: z.string().min(1),
  department: z.string().min(1),
  diagnosis: z.string().min(1),
  clinicalNotes: z.string().optional(),
  items: z.array(itemSchema).min(1),
});

type FormData = z.infer<typeof schema>;

const frequencyOptions = ['1x', '2x', '3x', '4x', 'prn'];
const routeOptions = ['oral', 'injection', 'iv', 'topical', 'sublingual', 'rectal'];
const routeLabels: Record<string, string> = {
  oral: 'Oral',
  injection: 'Injection',
  iv: 'IV',
  topical: 'Topical',
  sublingual: 'Sublingual',
  rectal: 'Rectal',
};

export function EditPrescription() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [allergyWarning, setAllergyWarning] = useState<string | null>(null);
  const [interactionWarning, setInteractionWarning] = useState<string | null>(null);

  const { data: prescription } = useQuery({
    queryKey: ['prescription', id],
    queryFn: () => prescriptionsApi.getById(id!),
    enabled: !!id,
  });

  const { data: patients = [] } = useQuery({ queryKey: ['patients'], queryFn: () => patientsApi.getAll() });
  const { data: medications = [] } = useQuery({ queryKey: ['medications'], queryFn: () => medicationsApi.getAll() });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors: formErrors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      patientId: '',
      department: '',
      diagnosis: '',
      clinicalNotes: '',
      items: [],
    },
  });

  useEffect(() => {
    if (prescription) {
      reset({
        patientId: prescription.patientId,
        department: prescription.department,
        diagnosis: prescription.diagnosis,
        clinicalNotes: prescription.clinicalNotes,
        items: prescription.items.map((i) => ({
          id: i.id,
          medicationId: i.medicationId,
          dose: i.dose,
          unit: i.unit,
          frequency: i.frequency,
          duration: i.duration,
          route: i.route,
          instructions: i.instructions,
        })),
      });
    }
  }, [prescription, reset]);

  const items = watch('items') || [];
  const patientId = watch('patientId');
  const patient = patients.find((p) => p.id === patientId);

  useEffect(() => {
    if (!patient || items.length === 0) {
      setAllergyWarning(null);
      return;
    }
    const allergyNames = patient.allergies.map((a) => a.name.toLowerCase());
    for (const item of items) {
      if (!item.medicationId) continue;
      const med = medications.find((m) => m.id === item.medicationId);
      if (med?.contraindications && allergyNames.some((a) => med.contraindications!.toLowerCase().includes(a))) {
        setAllergyWarning(`Warning: Patient is allergic to ${med.tradeName}`);
        return;
      }
    }
    setAllergyWarning(null);
  }, [patient, items, medications]);

  useEffect(() => {
    const medIds = items.map((i) => i.medicationId).filter(Boolean);
    setInteractionWarning(checkDrugInteraction(medIds).length > 0 ? 'Drug interaction detected' : null);
  }, [items]);

  const mutation = useMutation({
    mutationFn: ({ data, status }: { data: FormData; status?: 'submitted' }) =>
      prescriptionsApi.update(id!, {
        patientId: data.patientId,
        department: data.department,
        diagnosis: data.diagnosis,
        clinicalNotes: data.clinicalNotes,
        items: data.items as PrescriptionItem[],
        ...(status && { status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      navigate(`/prescriptions/${id}`);
    },
  });

  const addItem = () => {
    setValue('items', [...items, { id: `ri${Date.now()}`, medicationId: '', dose: '', unit: 'mg', frequency: '2x', duration: 5, route: 'oral' }]);
  };

  const removeItem = (idx: number) => {
    setValue('items', items.filter((_, i) => i !== idx));
  };

  if (!prescription || prescription.status !== 'draft') {
    return <Typography>This prescription cannot be edited</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Edit Prescription {prescription.code}</Typography>
      {(allergyWarning || interactionWarning) && (
        <Box sx={{ mb: 2 }}>
          {allergyWarning && <Alert severity="error" sx={{ mb: 1 }}>{allergyWarning}</Alert>}
          {interactionWarning && <Alert severity="warning">{interactionWarning}</Alert>}
        </Box>
      )}
      <form onSubmit={(e) => e.preventDefault()}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Autocomplete
            options={patients}
            getOptionLabel={(p) => `${p.code} - ${p.fullName}`}
            value={patients.find((p) => p.id === patientId) || null}
            onChange={(_, v) => setValue('patientId', v?.id ?? '')}
            renderInput={(params) => <TextField {...params} label="Patient" error={!!formErrors.patientId} helperText={formErrors.patientId?.message} />}
            sx={{ mb: 2 }}
          />
          <TextField fullWidth label="Department" {...register('department')} sx={{ mb: 2 }} />
          <TextField fullWidth label="Diagnosis" {...register('diagnosis')} sx={{ mb: 2 }} />
          <TextField fullWidth label="Notes" {...register('clinicalNotes')} sx={{ mb: 2 }} />
        </Paper>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1">Medications</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Medication</TableCell>
                  <TableCell>Dose</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Days</TableCell>
                  <TableCell>Route</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Autocomplete
                        size="small"
                        options={medications}
                        getOptionLabel={(m) => `${m.tradeName} ${m.strength}`}
                        value={medications.find((m) => m.id === item.medicationId) || null}
                        onChange={(_, v) => setValue(`items.${idx}.medicationId`, v?.id ?? '')}
                        renderInput={(params) => <TextField {...params} />}
                        sx={{ minWidth: 180 }}
                      />
                    </TableCell>
                    <TableCell><TextField size="small" {...register(`items.${idx}.dose`)} sx={{ width: 70 }} /></TableCell>
                    <TableCell><TextField size="small" {...register(`items.${idx}.unit`)} sx={{ width: 60 }} /></TableCell>
                    <TableCell>
                      <TextField size="small" select {...register(`items.${idx}.frequency`)} sx={{ width: 80 }} SelectProps={{ native: true }}>
                        {frequencyOptions.map((f) => <option key={f} value={f}>{f}</option>)}
                      </TextField>
                    </TableCell>
                    <TableCell><TextField size="small" type="number" {...register(`items.${idx}.duration`, { valueAsNumber: true })} sx={{ width: 60 }} /></TableCell>
                    <TableCell>
                      <TextField size="small" select {...register(`items.${idx}.route`)} sx={{ width: 120 }} SelectProps={{ native: true }}>
                        {routeOptions.map((r) => <option key={r} value={r}>{routeLabels[r]}</option>)}
                      </TextField>
                    </TableCell>
                    <TableCell><IconButton size="small" onClick={() => removeItem(idx)} disabled={items.length <= 1}><DeleteIcon /></IconButton></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button startIcon={<AddIcon />} onClick={addItem}>Add medication</Button>
        </Paper>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button type="button" variant="contained" onClick={handleSubmit((d) => mutation.mutate({ data: d }))} disabled={mutation.isPending}>
            Save
          </Button>
          <Button
            type="button"
            variant="contained"
            color="primary"
            onClick={handleSubmit((d) => mutation.mutate({ data: d, status: 'submitted' }))}
            disabled={mutation.isPending}
          >
            Submit to Pharmacy
          </Button>
          <Button variant="outlined" onClick={() => navigate(-1)}>Cancel</Button>
        </Box>
      </form>
    </Box>
  );
}
