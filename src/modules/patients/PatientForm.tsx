import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsApi, allergiesCatalog, conditionsCatalog } from '@/api';
import type { Patient } from '@/types';

const schema = z.object({
  code: z.string().optional(),
  fullName: z.string().min(1, 'Full name is required'),
  dateOfBirth: z.string(),
  gender: z.enum(['male', 'female', 'other']),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().optional(),
  insuranceNumber: z.string().optional(),
  status: z.enum(['examining', 'admitted', 'discharged']),
  allergyIds: z.array(z.string()),
  conditionIds: z.array(z.string()),
});

type FormData = z.infer<typeof schema>;

export function PatientForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: patient } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientsApi.getById(id!),
    enabled: isEdit,
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload: Omit<Patient, 'id'> = {
        code: data.code || '',
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        phone: data.phone,
        address: data.address,
        insuranceNumber: data.insuranceNumber,
        status: data.status,
        allergies: data.allergyIds.map((aid) => allergiesCatalog.find((a) => a.id === aid)!).filter(Boolean),
        conditions: data.conditionIds.map((cid) => conditionsCatalog.find((c) => c.id === cid)!).filter(Boolean),
      };
      if (isEdit) return patientsApi.update(id!, payload);
      return patientsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      navigate(isEdit ? `/patients/${id}` : '/patients');
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: isEdit && patient
      ? {
          code: patient.code,
          fullName: patient.fullName,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          phone: patient.phone,
          address: patient.address,
          insuranceNumber: patient.insuranceNumber,
          status: patient.status,
          allergyIds: patient.allergies.map((a) => a.id),
          conditionIds: patient.conditions.map((c) => c.id),
        }
      : {
          code: `BN${String((patient ? 0 : 0) + 1).padStart(3, '0')}`,
          fullName: '',
          dateOfBirth: dayjs().format('YYYY-MM-DD'),
          gender: 'male',
          phone: '',
          address: '',
          insuranceNumber: '',
          status: 'examining',
          allergyIds: [],
          conditionIds: [],
        },
  });

  useEffect(() => {
    if (patient && isEdit) {
      reset({
        code: patient.code,
        fullName: patient.fullName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        phone: patient.phone,
        address: patient.address,
        insuranceNumber: patient.insuranceNumber,
        status: patient.status,
        allergyIds: patient.allergies.map((a) => a.id),
        conditionIds: patient.conditions.map((c) => c.id),
      });
    }
  }, [patient, isEdit, reset]);

  const allergyIds = watch('allergyIds') || [];
  const conditionIds = watch('conditionIds') || [];

  return (
    <Box component="form" onSubmit={handleSubmit((d) => mutation.mutate(d))} sx={{ maxWidth: 600 }}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <TextField
          fullWidth
          label="Patient Code"
          {...register('code')}
          error={!!errors.code}
          helperText={errors.code?.message}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Full Name"
          {...register('fullName')}
          error={!!errors.fullName}
          helperText={errors.fullName?.message}
          sx={{ mb: 2 }}
        />
        <Box sx={{ mb: 2 }}>
          <DatePicker
            label="Date of Birth"
            value={watch('dateOfBirth') ? dayjs(watch('dateOfBirth')) : null}
            onChange={(d) => setValue('dateOfBirth', d?.format('YYYY-MM-DD') ?? '')}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Box>
        <FormControl sx={{ mb: 2, display: 'block' }}>
          <RadioGroup row {...register('gender')}>
            <FormControlLabel value="male" control={<Radio />} label="Male" />
            <FormControlLabel value="female" control={<Radio />} label="Female" />
          </RadioGroup>
        </FormControl>
        <TextField
          fullWidth
          label="Phone"
          {...register('phone')}
          error={!!errors.phone}
          helperText={errors.phone?.message}
          sx={{ mb: 2 }}
        />
        <TextField fullWidth label="Address" {...register('address')} sx={{ mb: 2 }} />
        <TextField fullWidth label="Insurance No." {...register('insuranceNumber')} sx={{ mb: 2 }} />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Status</InputLabel>
          <Select {...register('status')} label="Status">
            <MenuItem value="examining">Examining</MenuItem>
            <MenuItem value="admitted">Admitted</MenuItem>
            <MenuItem value="discharged">Discharged</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Drug Allergies</InputLabel>
          <Select
            multiple
            value={allergyIds}
            label="Drug Allergies"
            onChange={(e) => setValue('allergyIds', e.target.value as string[])}
          >
            {allergiesCatalog.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Conditions</InputLabel>
          <Select
            multiple
            value={conditionIds}
            label="Conditions"
            onChange={(e) => setValue('conditionIds', e.target.value as string[])}
          >
            {conditionsCatalog.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </LocalizationProvider>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button type="submit" variant="contained" disabled={mutation.isPending}>
          {isEdit ? 'Update' : 'Create'}
        </Button>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
