import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Drawer,
  List,
  ListItem,
  ListItemText,
  Chip,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SmartToyIcon from '@mui/icons-material/SmartToy';
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
import { useAuth } from '@/auth/AuthContext';
import type { PrescriptionItem } from '@/types';
import { useAiSuggestPrescription, useAiCheckDrugInteractions } from '@/ai';
import type { AiSuggestedMedication } from '@/ai/types';

const itemSchema = z.object({
  medicationId: z.string().min(1),
  dose: z.string().min(1),
  unit: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.number().min(1),
  route: z.string().min(1),
  instructions: z.string().optional(),
});

const schema = z.object({
  patientId: z.string().min(1, 'Select patient'),
  department: z.string().min(1, 'Select department'),
  diagnosis: z.string().min(1, 'Enter diagnosis'),
  clinicalNotes: z.string().optional(),
  items: z.array(itemSchema),
});

type FormData = z.infer<typeof schema>;

const frequencyOptions = ['1x', '2x', '3x', '4x', 'prn'];
const routeOptions = ['oral', 'injection', 'iv', 'topical', 'sublingual', 'rectal'];
const routeLabels: Record<string, string> = {
  oral: 'Uống',
  injection: 'Tiêm',
  iv: 'Truyền',
  topical: 'Bôi',
  sublingual: 'Ngậm dưới lưỡi',
  rectal: 'Đặt hậu môn',
};

export function CreatePrescription() {
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [allergyWarning, setAllergyWarning] = useState<string | null>(null);
  const [interactionWarning, setInteractionWarning] = useState<string | null>(null);
  const [aiSuggestOpen, setAiSuggestOpen] = useState(false);

  const { data: patients = [] } = useQuery({ queryKey: ['patients'], queryFn: () => patientsApi.getAll() });
  const { data: medications = [] } = useQuery({ queryKey: ['medications'], queryFn: () => medicationsApi.getAll() });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      patientId: preselectedPatientId || '',
      department: 'Internal Medicine',
      diagnosis: '',
      clinicalNotes: '',
      items: [],
    },
  });

  useEffect(() => {
    setValue('patientId', preselectedPatientId || '');
  }, [preselectedPatientId, setValue]);

  const items = watch('items') || [];
  const patientId = watch('patientId');
  const diagnosis = watch('diagnosis');

  const patient = patients.find((p) => p.id === patientId);

  const aiSuggest = useAiSuggestPrescription(
    patientId && diagnosis?.trim()
      ? { patientId, diagnosis: diagnosis.trim(), currentMedications: items.map((i) => ({ medicationId: i.medicationId })).filter((i) => i.medicationId) }
      : null
  );

  const aiInteractions = useAiCheckDrugInteractions(
    patientId && items.length > 0
      ? {
          patientId,
          medicationsInPrescription: items.map((it) => ({
            medicationId: it.medicationId,
            medication: medications.find((m) => m.id === it.medicationId),
          })),
        }
      : null,
    { autoRun: true }
  );

  useEffect(() => {
    if (!patient || items.length === 0) {
      setAllergyWarning(null);
      return;
    }
    const allergyNames = patient.allergies.map((a) => a.name.toLowerCase());
    for (const item of items) {
      if (!item.medicationId) continue;
      const med = medications.find((m) => m.id === item.medicationId);
      if (med && allergyNames.some((a) => med.contraindications?.toLowerCase().includes(a))) {
        setAllergyWarning(`Warning: Patient is allergic to ${med.tradeName}`);
        return;
      }
    }
    setAllergyWarning(null);
  }, [patient, items, medications]);

  useEffect(() => {
    const conflicts = checkDrugInteraction(items.map((i) => i.medicationId).filter(Boolean));
    if (conflicts.length > 0) {
      setInteractionWarning('Warning: Drug interaction between selected medications');
    } else {
      setInteractionWarning(null);
    }
  }, [items]);

  const mutation = useMutation({
    mutationFn: async ({ data, status }: { data: FormData; status: 'draft' | 'submitted' }) => {
      const rx = await prescriptionsApi.create({
        patientId: data.patientId,
        doctorId: user!.id,
        department: data.department,
        diagnosis: data.diagnosis,
        clinicalNotes: data.clinicalNotes,
        items: data.items.map((it, i) => ({
          ...it,
          id: `ri${Date.now()}_${i}`,
        })) as PrescriptionItem[],
        status: 'draft',
      });
      if (status === 'submitted') {
        return prescriptionsApi.update(rx.id, { status: 'submitted' });
      }
      return rx;
    },
    onSuccess: (rx) => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      navigate(`/prescriptions/${rx.id}`);
    },
  });

  const addItem = () => {
    setValue('items', [...items, { medicationId: '', dose: '', unit: 'mg', frequency: '2x', duration: 5, route: 'oral' }]);
  };

  const removeItem = (idx: number) => {
    setValue('items', items.filter((_, i) => i !== idx));
  };

  const normalizeFrequency = (freq: string): string => {
    const f = freq.toLowerCase().trim();
    if (frequencyOptions.includes(f)) return f;
    if (/1.?1.?1/.test(f) || /3\s*times|3x|three/i.test(f) || /every\s*8/i.test(f)) return '3x';
    if (/1.?0.?1/.test(f) || /2\s*times|2x|twice|every\s*12/i.test(f)) return '2x';
    if (/4\s*times|4x|every\s*6|every\s*4/i.test(f) || /q[46]h/i.test(f)) return '4x';
    if (/1.?0.?0/.test(f) || /once|1\s*time|1x|daily/i.test(f)) return '1x';
    if (/prn|as\s*needed|khi\s*cần/i.test(f)) return 'prn';
    return '2x';
  };

  const normalizeRoute = (route: string): string => {
    const r = route.toLowerCase().trim();
    if (routeOptions.includes(r)) return r;
    if (/oral|uống|mouth|po\b/i.test(r)) return 'oral';
    if (/inject|tiêm|im\b|sc\b/i.test(r)) return 'injection';
    if (/iv\b|truyền|infus/i.test(r)) return 'iv';
    if (/topical|bôi|cream|oint/i.test(r)) return 'topical';
    if (/sublingual|ngậm/i.test(r)) return 'sublingual';
    if (/rectal|hậu môn/i.test(r)) return 'rectal';
    return 'oral';
  };

  const resolveMedicationId = (s: AiSuggestedMedication): string => {
    if (s.medicationId) {
      const idStr = String(s.medicationId);
      if (medications.some((m) => m.id === idStr)) return idStr;
    }
    const nameLC = s.name.toLowerCase();
    const match =
      medications.find((m) => m.tradeName.toLowerCase() === nameLC) ||
      medications.find((m) => nameLC.includes(m.tradeName.toLowerCase())) ||
      medications.find((m) => m.tradeName.toLowerCase().includes(nameLC.split(' ')[0])) ||
      medications.find((m) => m.activeIngredient?.toLowerCase().includes(nameLC.split(' ')[0]));
    return match?.id ?? '';
  };

  const mapSuggestionToItem = (s: AiSuggestedMedication) => ({
    medicationId: resolveMedicationId(s),
    dose: s.dose.replace(/\s*mg$/i, '') || s.dose,
    unit: s.dose.includes('mg') ? 'mg' : 'viên',
    frequency: normalizeFrequency(s.frequency),
    duration: s.durationDays,
    route: normalizeRoute(s.route),
    instructions: undefined,
  });

  const addAiSuggestion = (s: AiSuggestedMedication) => {
    setValue('items', [...items, mapSuggestionToItem(s)]);
  };

  const addAllAiSuggestions = () => {
    if (!aiSuggest.data?.length) return;
    setValue('items', [...items, ...aiSuggest.data.map(mapSuggestionToItem)]);
  };

  const handleAiSuggestClick = () => {
    if (!patientId?.trim()) {
      return;
    }
    if (!diagnosis?.trim()) {
      return;
    }
    setAiSuggestOpen(true);
    aiSuggest.refetch();
  };

  const submitWithValidation = (status: 'draft' | 'submitted') => {
    if (items.length === 0) {
      return;
    }
    handleSubmit((d) => mutation.mutate({ data: d, status }))();
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        New Prescription
      </Typography>
      {(allergyWarning || interactionWarning) && (
        <Box sx={{ mb: 2 }}>
          {allergyWarning && <Alert severity="error" sx={{ mb: 1 }}>{allergyWarning}</Alert>}
          {interactionWarning && <Alert severity="warning">{interactionWarning}</Alert>}
        </Box>
      )}
      <form onSubmit={(e) => e.preventDefault()}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Prescription Details</Typography>
          <Autocomplete
            options={patients}
            getOptionLabel={(p) => `${p.code} - ${p.fullName}`}
            value={patients.find((p) => p.id === patientId) || null}
            onChange={(_, v) => setValue('patientId', v?.id ?? '')}
            renderInput={(params) => (
              <TextField {...params} label="Patient" error={!!errors.patientId} helperText={errors.patientId?.message} />
            )}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Department"
            {...register('department')}
            error={!!errors.department}
            helperText={errors.department?.message}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Prescribing Doctor"
            value={user?.name}
            disabled
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Diagnosis (ICD or description)"
            {...register('diagnosis')}
            error={!!errors.diagnosis}
            helperText={errors.diagnosis?.message}
            sx={{ mb: 2 }}
          />
          <TextField fullWidth label="Clinical Notes" {...register('clinicalNotes')} sx={{ mb: 2 }} />
        </Paper>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Medications</Typography>
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
                  <TableCell>Instructions</TableCell>
                  <TableCell width={50}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ color: 'text.secondary' }}>
                      No medications yet. Click &quot;Add medication&quot; or &quot;Suggest with AI&quot;.
                    </TableCell>
                  </TableRow>
                ) : (
                items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Autocomplete
                        size="small"
                        options={medications}
                        getOptionLabel={(m) => `${m.tradeName} ${m.strength}`}
                        value={medications.find((m) => m.id === item.medicationId) || null}
                        onChange={(_, v) => setValue(`items.${idx}.medicationId`, v?.id ?? '')}
                        renderInput={(params) => <TextField {...params} />}
                        sx={{ minWidth: 200 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" {...register(`items.${idx}.dose`)} sx={{ width: 70 }} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" {...register(`items.${idx}.unit`)} sx={{ width: 60 }} />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        select
                        {...register(`items.${idx}.frequency`)}
                        sx={{ width: 80 }}
                        SelectProps={{ native: true }}
                      >
                        {frequencyOptions.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        {...register(`items.${idx}.duration`, { valueAsNumber: true })}
                        sx={{ width: 60 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        select
                        {...register(`items.${idx}.route`)}
                        sx={{ width: 120 }}
                        SelectProps={{ native: true }}
                      >
                        {routeOptions.map((r) => (
                          <option key={r} value={r}>{routeLabels[r]}</option>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField size="small" {...register(`items.${idx}.instructions`)} placeholder="Notes" sx={{ width: 100 }} />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => removeItem(idx)} disabled={items.length <= 1}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Button startIcon={<AddIcon />} onClick={addItem} sx={{ mt: 1 }}>
            Thêm thuốc
          </Button>
        </Paper>

        {/* AI Drug Safety */}
        {items.length >= 2 && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmartToyIcon color="action" /> AI Drug Safety
            </Typography>
            {aiInteractions.isLoading ? (
              <Typography variant="body2" color="text.secondary">Checking...</Typography>
            ) : aiInteractions.data?.length ? (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {aiInteractions.data.filter((i) => i.severity === 'high').length} high,{' '}
                  {aiInteractions.data.filter((i) => i.severity === 'moderate').length} moderate,{' '}
                  {aiInteractions.data.filter((i) => i.severity === 'low').length} low
                </Typography>
                {aiInteractions.data
                  .filter((i) => !aiInteractions.acknowledged.has(i.id))
                  .map((i) => (
                    <Alert
                      key={i.id}
                      severity={i.severity === 'high' ? 'error' : i.severity === 'moderate' ? 'warning' : 'info'}
                      sx={{ mb: 1 }}
                      action={
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Button size="small" onClick={() => aiInteractions.acknowledge(i.id)}>
                            Acknowledge
                          </Button>
                          <Button size="small" onClick={() => aiInteractions.override(i.id, 'Doctor decision to keep prescription')}>
                            Override
                          </Button>
                        </Box>
                      }
                    >
                      <Typography variant="body2">{i.message}</Typography>
                      <Typography variant="caption" display="block">Drugs: {i.drugsInvolved.join(', ')}</Typography>
                      <Typography variant="caption" sx={{ fontStyle: 'italic' }}>{i.recommendation}</Typography>
                    </Alert>
                  ))}
              </Box>
            ) : aiInteractions.data && aiInteractions.data.length === 0 ? (
              <Typography variant="body2" color="success.main">No significant interactions detected.</Typography>
            ) : null}
          </Paper>
        )}

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            type="button"
            variant="outlined"
            startIcon={aiSuggest.isLoading ? <CircularProgress size={16} /> : <SmartToyIcon />}
            onClick={handleAiSuggestClick}
            disabled={aiSuggest.isLoading || !patientId || !diagnosis?.trim()}
          >
            AI gợi ý đơn thuốc
          </Button>
          <Button type="button" variant="contained" onClick={() => submitWithValidation('draft')}>
            Save as draft
          </Button>
          <Button type="button" variant="contained" color="primary" onClick={() => submitWithValidation('submitted')}>
            Submit to Pharmacy
          </Button>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </Box>
      </form>

      <Drawer
        anchor="right"
        open={aiSuggestOpen}
        onClose={() => setAiSuggestOpen(false)}
        PaperProps={{ sx: { width: 380 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>AI Suggestions</Typography>
          {!patientId || !diagnosis?.trim() ? (
            <Typography color="text.secondary">Select patient and enter diagnosis before calling AI.</Typography>
          ) : aiSuggest.isLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Loading suggestions...</Typography>
            </Box>
          ) : aiSuggest.error ? (
            <Typography color="error">{aiSuggest.error.message}</Typography>
          ) : aiSuggest.data?.length ? (
            <>
              <Button size="small" onClick={addAllAiSuggestions} sx={{ mb: 2 }}>
                Add all
              </Button>
              <List dense>
                {aiSuggest.data.map((s) => (
                  <ListItem
                    key={s.medicationId + s.dose}
                    secondaryAction={
                      <Button size="small" onClick={() => addAiSuggestion(s)}>Add to prescription</Button>
                    }
                  >
                    <ListItemText
                      primary={`${s.name} - ${s.dose} - ${s.frequency}/ngày - ${s.durationDays} ngày`}
                      secondary={
                        <Box>
                          <Tooltip title={s.reasoning}>
                            <Chip
                              size="small"
                              label={s.confidence >= 0.8 ? 'Cao' : s.confidence >= 0.5 ? 'TB' : 'Thấp'}
                              color={s.confidence >= 0.8 ? 'success' : s.confidence >= 0.5 ? 'warning' : 'default'}
                              sx={{ mr: 0.5 }}
                            />
                          </Tooltip>
                          <Typography variant="caption" display="block">{s.reasoning}</Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </>
          ) : (
            <Typography color="text.secondary">No suggestions yet. Click "Suggest with AI" to load.</Typography>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}
