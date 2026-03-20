// User & Auth
export type UserRole = 'doctor' | 'pharmacist' | 'nurse' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
}

// Patient
export interface Allergy {
  id: string;
  name: string;
  severity?: 'mild' | 'moderate' | 'severe';
}

export interface Condition {
  id: string;
  name: string;
  icdCode?: string;
}

export interface Patient {
  id: string;
  code: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  address?: string;
  insuranceNumber?: string;
  allergies: Allergy[];
  conditions: Condition[];
  department?: string;
  room?: string;
  status: 'examining' | 'discharged' | 'admitted';
}

export interface VisitRecord {
  id: string;
  patientId: string;
  date: string;
  department: string;
  doctorName: string;
  diagnosis?: string;
}

// Medication
export type MedicationForm = 'tablet' | 'capsule' | 'syrup' | 'injection' | 'cream' | 'drops' | 'suppository';

export type RouteOfAdmin = 'oral' | 'injection' | 'iv' | 'topical' | 'sublingual' | 'rectal';

export interface Medication {
  id: string;
  code: string;
  tradeName: string;
  activeIngredient: string;
  form: MedicationForm;
  strength: string;
  route: RouteOfAdmin;
  unit: string;
  atcCode?: string;
  group: string;
  contraindications?: string;
}

export interface MedicationBatch {
  id: string;
  medicationId: string;
  batchNumber: string;
  manufactureDate: string;
  expiryDate: string;
  quantity: number;
  locationId: string;
}

// Prescription
export type PrescriptionStatus =
  | 'draft'
  | 'submitted'
  | 'reviewed'
  | 'approved'
  | 'dispensed'
  | 'completed';

export type FrequencyType = '1x' | '2x' | '3x' | '4x' | 'prn' | 'custom';

export interface PrescriptionItem {
  id: string;
  medicationId: string;
  medication?: Medication;
  dose: string;
  unit: string;
  frequency: FrequencyType;
  duration: number; // days
  route: RouteOfAdmin;
  instructions?: string;
}

export interface Prescription {
  id: string;
  code: string;
  patientId: string;
  patient?: Patient;
  doctorId: string;
  doctor?: User;
  department: string;
  diagnosis: string;
  clinicalNotes?: string;
  items: PrescriptionItem[];
  status: PrescriptionStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  dispensedAt?: string;
  completedAt?: string;
}

// Inventory
export interface InventoryLocation {
  id: string;
  name: string;
}

export interface InventoryRecord {
  medicationId: string;
  medication?: Medication;
  locationId: string;
  totalQuantity: number;
  batches: MedicationBatch[];
  nearestExpiry?: string;
  alertLevel: 'ok' | 'low' | 'expiring';
}

// Chat
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  prescriptionId?: string;
  participants: string[];
  messages: Message[];
  lastMessageAt: string;
}
