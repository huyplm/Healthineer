import type {
  User,
  Patient,
  Allergy,
  Condition,
  Medication,
  MedicationBatch,
  Prescription,
  InventoryLocation,
  Message,
  Conversation,
} from '@/types';

// Mock users
export const mockUsers: User[] = [
  { id: 'u1', name: 'Dr. John Smith', role: 'doctor', email: 'doctor@hospital.com' },
  { id: 'u2', name: 'Jane Doe, RPh', role: 'pharmacist', email: 'pharmacist@hospital.com' },
  { id: 'u3', name: 'System Admin', role: 'admin' },
];

// Allergies catalog
export const allergiesCatalog: Allergy[] = [
  { id: 'a1', name: 'Penicillin', severity: 'severe' },
  { id: 'a2', name: 'Sulfa', severity: 'moderate' },
  { id: 'a3', name: 'Paracetamol', severity: 'mild' },
  { id: 'a4', name: 'Aspirin' },
  { id: 'a5', name: 'Ibuprofen' },
];

// Conditions catalog
export const conditionsCatalog: Condition[] = [
  { id: 'c1', name: 'Diabetes', icdCode: 'E11' },
  { id: 'c2', name: 'Chronic kidney disease', icdCode: 'N18' },
  { id: 'c3', name: 'Hypertension', icdCode: 'I10' },
  { id: 'c4', name: 'Asthma', icdCode: 'J45' },
];

// Locations
export const mockLocations: InventoryLocation[] = [
  { id: 'loc1', name: 'Central warehouse' },
  { id: 'loc2', name: 'Internal Medicine' },
  { id: 'loc3', name: 'Surgery' },
];

// Medications
export const mockMedications: Medication[] = [
  {
    id: 'm1',
    code: 'AMP-500',
    tradeName: 'Amoxicillin 500mg',
    activeIngredient: 'Amoxicillin',
    form: 'capsule',
    strength: '500mg',
    route: 'oral',
    unit: 'capsule',
    atcCode: 'J01CA04',
    group: 'Antibiotic',
    contraindications: 'Penicillin allergy',
  },
  {
    id: 'm2',
    code: 'PAR-500',
    tradeName: 'Paracetamol 500mg',
    activeIngredient: 'Paracetamol',
    form: 'tablet',
    strength: '500mg',
    route: 'oral',
    unit: 'tablet',
    atcCode: 'N02BE01',
    group: 'Analgesic / Antipyretic',
  },
  {
    id: 'm3',
    code: 'IBU-400',
    tradeName: 'Ibuprofen 400mg',
    activeIngredient: 'Ibuprofen',
    form: 'tablet',
    strength: '400mg',
    route: 'oral',
    unit: 'tablet',
    atcCode: 'M01AE01',
    group: 'NSAID',
  },
  {
    id: 'm4',
    code: 'LOM-10',
    tradeName: 'Loperamide 2mg',
    activeIngredient: 'Loperamide',
    form: 'tablet',
    strength: '2mg',
    route: 'oral',
    unit: 'tablet',
    atcCode: 'A07DA03',
    group: 'GI',
  },
  {
    id: 'm5',
    code: 'OME-20',
    tradeName: 'Omeprazole 20mg',
    activeIngredient: 'Omeprazole',
    form: 'capsule',
    strength: '20mg',
    route: 'oral',
    unit: 'capsule',
    atcCode: 'A02BC01',
    group: 'PPI',
  },
];

// Drug interactions (mock)
export const drugInteractions: [string, string][] = [
  ['m1', 'm3'], // Amoxicillin + Ibuprofen
  ['m2', 'm3'], // Paracetamol + Ibuprofen (moderate)
];

// Patients
export const mockPatients: Patient[] = [
  {
    id: 'p1',
    code: 'BN001',
    fullName: 'Mary Johnson',
    dateOfBirth: '1985-03-15',
    gender: 'female',
    phone: '0901234567',
    address: '123 Main St, City',
    insuranceNumber: 'INS001234567',
    allergies: [allergiesCatalog[0]],
    conditions: [conditionsCatalog[0]],
    department: 'Internal Medicine',
    room: '101',
    status: 'examining',
  },
  {
    id: 'p2',
    code: 'BN002',
    fullName: 'James Wilson',
    dateOfBirth: '1970-07-20',
    gender: 'male',
    phone: '0912345678',
    allergies: [],
    conditions: [conditionsCatalog[2]],
    department: 'Surgery',
    status: 'admitted',
  },
  {
    id: 'p3',
    code: 'BN003',
    fullName: 'Sarah Lee',
    dateOfBirth: '1992-11-08',
    gender: 'female',
    phone: '0987654321',
    allergies: [allergiesCatalog[1]],
    conditions: [],
    status: 'discharged',
  },
];

// Medication batches
export const mockBatches: MedicationBatch[] = [
  { id: 'b1', medicationId: 'm1', batchNumber: 'LOT001', manufactureDate: '2024-01-01', expiryDate: '2026-01-01', quantity: 500, locationId: 'loc1' },
  { id: 'b2', medicationId: 'm2', batchNumber: 'LOT002', manufactureDate: '2024-06-01', expiryDate: '2026-06-01', quantity: 1000, locationId: 'loc1' },
  { id: 'b3', medicationId: 'm3', batchNumber: 'LOT003', manufactureDate: '2024-03-01', expiryDate: '2025-03-01', quantity: 200, locationId: 'loc1' },
];

// Prescriptions
export let mockPrescriptions: Prescription[] = [
  {
    id: 'rx1',
    code: 'RX001',
    patientId: 'p1',
    doctorId: 'u1',
    department: 'Internal Medicine',
    diagnosis: 'Acute pharyngitis',
    clinicalNotes: 'Mild fever, sore throat',
    items: [
      {
        id: 'ri1',
        medicationId: 'm2',
        dose: '500',
        unit: 'mg',
        frequency: '3x',
        duration: 5,
        route: 'oral',
        instructions: 'After meals',
      },
    ],
    status: 'submitted',
    createdAt: '2025-02-18T09:00:00',
    updatedAt: '2025-02-18T10:00:00',
    submittedAt: '2025-02-18T10:00:00',
  },
  {
    id: 'rx2',
    code: 'RX002',
    patientId: 'p2',
    doctorId: 'u1',
    department: 'Surgery',
    diagnosis: 'Digestive disorder',
    items: [
      {
        id: 'ri2',
        medicationId: 'm4',
        dose: '2',
        unit: 'mg',
        frequency: '2x',
        duration: 3,
        route: 'oral',
      },
    ],
    status: 'reviewed',
    createdAt: '2025-02-17T14:00:00',
    updatedAt: '2025-02-18T08:00:00',
  },
];

// Messages
export let mockMessages: Message[] = [
  {
    id: 'msg1',
    conversationId: 'conv1',
    senderId: 'u2',
    content: 'Prescription RX001: Please clarify Paracetamol dose for patient with kidney history.',
    createdAt: '2025-02-18T10:30:00',
  },
  {
    id: 'msg2',
    conversationId: 'conv1',
    senderId: 'u1',
    content: 'Adjusted to 325mg per dose, twice daily.',
    createdAt: '2025-02-18T10:35:00',
  },
];

export let mockConversations: Conversation[] = [
  {
    id: 'conv1',
    prescriptionId: 'rx1',
    participants: ['u1', 'u2'],
    messages: [],
    lastMessageAt: '2025-02-18T10:35:00',
  },
];
