/**
 * API Client – calls real backend (Spring Boot) via apiFetch.
 * Falls back to mock data when backend is unreachable.
 */

import type {
  Patient,
  Prescription,
  PrescriptionItem,
  Medication,
  MedicationBatch,
  InventoryRecord,
  Message,
  Conversation,
  Allergy,
  Condition,
  User,
} from '@/types';
import { apiFetch } from './apiFetch';
import {
  mockPatients,
  mockPrescriptions,
  mockMedications,
  mockBatches,
  mockLocations,
  mockMessages,
  mockConversations,
  mockUsers,
  drugInteractions,
} from './mockData';

// ── Adapter helpers ──────────────────────────────────────────────────

interface BackendPatient {
  id: number;
  patientId: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber?: string;
  insuranceId?: string;
}

interface BackendAllergy {
  id: number;
  allergenName: string;
  reaction?: string;
  firstOccurred?: string;
}

interface BackendCondition {
  id: number;
  conditionName: string;
  severity?: string;
}

interface BackendMedication {
  id: number;
  medicationId: string;
  tradeName: string;
  activeIngredient: string;
  dosageForm?: string;
  strength: string;
  administrationRoute?: string;
  atcCode?: string;
  drugGroup?: string;
  contraindications?: string;
  active: boolean;
}

interface BackendPrescriptionItem {
  id: number;
  medicationId: number;
  medicationName?: string;
  dose: string;
  frequency: string;
  durationDays: number;
  route: string;
  instructions?: string;
}

interface BackendPrescription {
  id: number;
  prescriptionId: string;
  patientId: number;
  patientName?: string;
  doctorId: number;
  doctorName?: string;
  department: string;
  diagnosis: string;
  clinicalNote?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: BackendPrescriptionItem[];
}

interface BackendInventoryBatch {
  id: number;
  medicationId: number;
  medicationName?: string;
  location: string;
  batchNumber: string;
  expiryDate: string;
  manufactureDate: string;
  quantity: number;
  unitCost?: number;
}

interface BackendMessage {
  id: number;
  prescriptionId: number;
  senderId: number;
  senderName?: string;
  content: string;
  timestamp: string;
  messageType?: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

function toPatient(b: BackendPatient, allergies: Allergy[] = [], conditions: Condition[] = []): Patient {
  return {
    id: String(b.id),
    code: b.patientId,
    fullName: b.fullName,
    dateOfBirth: b.dateOfBirth,
    gender: (b.gender?.toLowerCase() as Patient['gender']) || 'other',
    phone: b.phoneNumber ?? '',
    insuranceNumber: b.insuranceId,
    allergies,
    conditions,
    status: 'admitted',
  };
}

function toAllergy(b: BackendAllergy): Allergy {
  return {
    id: String(b.id),
    name: b.allergenName,
    reaction: b.reaction,
  };
}

function toCondition(b: BackendCondition): Condition {
  return {
    id: String(b.id),
    name: b.conditionName,
    severity: b.severity,
  };
}

function toMedication(b: BackendMedication): Medication {
  return {
    id: String(b.id),
    code: b.medicationId,
    tradeName: b.tradeName,
    activeIngredient: b.activeIngredient,
    form: b.dosageForm ?? 'tablet',
    strength: b.strength,
    route: b.administrationRoute ?? 'oral',
    unit: b.strength,
    atcCode: b.atcCode,
    group: b.drugGroup ?? '',
    contraindications: b.contraindications,
    active: b.active,
  };
}

function toPrescriptionItem(b: BackendPrescriptionItem): PrescriptionItem {
  const doseMatch = b.dose?.match(/^([\d.]+)\s*(.*)$/);
  return {
    id: String(b.id),
    medicationId: String(b.medicationId),
    medicationName: b.medicationName,
    dose: doseMatch ? doseMatch[1] : b.dose,
    unit: doseMatch && doseMatch[2] ? doseMatch[2] : 'mg',
    frequency: b.frequency,
    duration: b.durationDays,
    route: b.route,
    instructions: b.instructions,
  };
}

function toPrescription(b: BackendPrescription): Prescription {
  return {
    id: String(b.id),
    code: b.prescriptionId,
    patientId: String(b.patientId),
    patientName: b.patientName,
    doctorId: String(b.doctorId),
    doctorName: b.doctorName,
    department: b.department,
    diagnosis: b.diagnosis,
    clinicalNotes: b.clinicalNote,
    items: (b.items ?? []).map(toPrescriptionItem),
    status: b.status?.toLowerCase() ?? 'draft',
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

function toBatch(b: BackendInventoryBatch): MedicationBatch {
  return {
    id: String(b.id),
    medicationId: String(b.medicationId),
    medicationName: b.medicationName,
    batchNumber: b.batchNumber,
    manufactureDate: b.manufactureDate,
    expiryDate: b.expiryDate,
    quantity: b.quantity,
    locationId: b.location,
  };
}

function toMessage(b: BackendMessage, prescriptionId?: string): Message {
  return {
    id: String(b.id),
    prescriptionId: prescriptionId ?? String(b.prescriptionId),
    senderId: String(b.senderId),
    senderName: b.senderName,
    content: b.content,
    createdAt: b.timestamp,
    messageType: b.messageType,
  };
}

// ── Mock delay ───────────────────────────────────────────────────────

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const SIMULATE_DELAY = 200;

// ── Patients API ─────────────────────────────────────────────────────

export const patientsApi = {
  getAll: async (params?: { search?: string; department?: string; status?: string }): Promise<Patient[]> => {
    try {
      const page = await apiFetch<PageResponse<BackendPatient>>('/api/patients?size=100');
      const patients = await Promise.all(
        page.content.map(async (bp) => {
          const [allergies, conditionsData] = await Promise.all([
            apiFetch<BackendAllergy[]>(`/api/patients/${bp.id}/allergies`).catch(() => []),
            apiFetch<{ conditions: BackendCondition[] }>(`/api/patients/${bp.id}/conditions`).catch(() => ({ conditions: [] })),
          ]);
          return toPatient(bp, allergies.map(toAllergy), (conditionsData.conditions ?? []).map(toCondition));
        }),
      );

      let list = patients;
      if (params?.search) {
        const s = params.search.toLowerCase();
        list = list.filter(
          (p) =>
            p.fullName.toLowerCase().includes(s) ||
            p.code.toLowerCase().includes(s) ||
            p.phone.includes(params.search!),
        );
      }
      return list;
    } catch {
      await delay(SIMULATE_DELAY);
      let list = [...mockPatients];
      if (params?.search) {
        const s = params.search.toLowerCase();
        list = list.filter(
          (p) =>
            p.fullName.toLowerCase().includes(s) ||
            p.code.toLowerCase().includes(s) ||
            p.phone.includes(params.search!),
        );
      }
      return list;
    }
  },

  getById: async (id: string): Promise<Patient | undefined> => {
    try {
      const bp = await apiFetch<BackendPatient>(`/api/patients/${id}`);
      const [allergies, conditionsData] = await Promise.all([
        apiFetch<BackendAllergy[]>(`/api/patients/${id}/allergies`).catch(() => []),
        apiFetch<{ conditions: BackendCondition[] }>(`/api/patients/${id}/conditions`).catch(() => ({ conditions: [] })),
      ]);
      return toPatient(bp, allergies.map(toAllergy), (conditionsData.conditions ?? []).map(toCondition));
    } catch {
      await delay(SIMULATE_DELAY);
      return mockPatients.find((p) => p.id === id);
    }
  },

  create: async (data: Omit<Patient, 'id'>): Promise<Patient> => {
    try {
      const bp = await apiFetch<BackendPatient>('/api/patients', {
        method: 'POST',
        body: JSON.stringify({
          patientId: data.code || `BN${Date.now()}`,
          fullName: data.fullName,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          phoneNumber: data.phone,
          insuranceId: data.insuranceNumber,
        }),
      });
      return toPatient(bp);
    } catch {
      await delay(SIMULATE_DELAY);
      const id = `p${Date.now()}`;
      const code = data.code || `BN${String(mockPatients.length + 1).padStart(3, '0')}`;
      const patient: Patient = { ...data, id, code };
      mockPatients.push(patient);
      return patient;
    }
  },

  update: async (id: string, data: Partial<Patient>): Promise<Patient> => {
    try {
      const bp = await apiFetch<BackendPatient>(`/api/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          patientId: data.code ?? '',
          fullName: data.fullName ?? '',
          dateOfBirth: data.dateOfBirth ?? '',
          gender: data.gender ?? '',
          phoneNumber: data.phone,
          insuranceId: data.insuranceNumber,
        }),
      });
      return toPatient(bp);
    } catch {
      await delay(SIMULATE_DELAY);
      const idx = mockPatients.findIndex((p) => p.id === id);
      if (idx < 0) throw new Error('Patient not found');
      mockPatients[idx] = { ...mockPatients[idx], ...data };
      return mockPatients[idx];
    }
  },
};

// ── Prescriptions API ────────────────────────────────────────────────

export const prescriptionsApi = {
  getAll: async (params?: { doctorId?: string; status?: string }): Promise<Prescription[]> => {
    try {
      const page = await apiFetch<PageResponse<BackendPrescription>>('/api/prescriptions/my?size=100');
      let list = page.content.map(toPrescription);
      if (params?.status) {
        list = list.filter((p) => p.status === params.status);
      }
      return list;
    } catch {
      await delay(SIMULATE_DELAY);
      let list = [...mockPrescriptions];
      if (params?.doctorId) list = list.filter((p) => p.doctorId === params.doctorId);
      if (params?.status) list = list.filter((p) => p.status === params.status);
      return list.map((p) => ({
        ...p,
        patient: mockPatients.find((pt) => pt.id === p.patientId),
        doctor: mockUsers.find((u) => u.id === p.doctorId),
      }));
    }
  },

  getById: async (id: string): Promise<Prescription | undefined> => {
    try {
      const bp = await apiFetch<BackendPrescription>(`/api/prescriptions/${id}`);
      return toPrescription(bp);
    } catch {
      await delay(SIMULATE_DELAY);
      const rx = mockPrescriptions.find((p) => p.id === id);
      if (!rx) return undefined;
      return {
        ...rx,
        patient: mockPatients.find((pt) => pt.id === rx.patientId),
        doctor: mockUsers.find((u) => u.id === rx.doctorId),
        items: rx.items.map((item) => ({
          ...item,
          medication: mockMedications.find((m) => m.id === item.medicationId),
        })),
      };
    }
  },

  create: async (data: Omit<Prescription, 'id' | 'code' | 'createdAt' | 'updatedAt'>): Promise<Prescription> => {
    try {
      const bp = await apiFetch<BackendPrescription>('/api/prescriptions', {
        method: 'POST',
        body: JSON.stringify({
          patientId: Number(data.patientId),
          department: data.department,
          diagnosis: data.diagnosis,
          clinicalNote: data.clinicalNotes,
          items: data.items.map((i) => ({
            medicationId: Number(i.medicationId),
            dose: i.dose,
            frequency: i.frequency,
            durationDays: i.duration,
            route: i.route,
            instructions: i.instructions,
          })),
        }),
      });
      return toPrescription(bp);
    } catch {
      await delay(SIMULATE_DELAY);
      const id = `rx${Date.now()}`;
      const code = `RX${String(mockPrescriptions.length + 1).padStart(3, '0')}`;
      const now = new Date().toISOString();
      const prescription: Prescription = { ...data, id, code, createdAt: now, updatedAt: now };
      mockPrescriptions.push(prescription);
      return prescription;
    }
  },

  update: async (id: string, data: Partial<Prescription>): Promise<Prescription> => {
    try {
      if (data.status === 'submitted') {
        const bp = await apiFetch<BackendPrescription>(`/api/prescriptions/${id}/submit`, { method: 'PUT' });
        return toPrescription(bp);
      }
      if (data.status === 'reviewed') {
        const bp = await apiFetch<BackendPrescription>(`/api/prescriptions/${id}/review`, { method: 'PUT' });
        return toPrescription(bp);
      }
      if (data.status === 'approved') {
        const bp = await apiFetch<BackendPrescription>(`/api/prescriptions/${id}/approve`, { method: 'PUT' });
        return toPrescription(bp);
      }
      if (data.status === 'dispensed') {
        const bp = await apiFetch<BackendPrescription>(`/api/prescriptions/${id}/dispense`, { method: 'PUT' });
        return toPrescription(bp);
      }
      if (data.items) {
        const bp = await apiFetch<BackendPrescription>(`/api/prescriptions/${id}/items`, {
          method: 'PUT',
          body: JSON.stringify(
            data.items.map((i) => ({
              medicationId: Number(i.medicationId),
              dose: i.dose,
              frequency: i.frequency,
              durationDays: i.duration,
              route: i.route,
              instructions: i.instructions,
            })),
          ),
        });
        return toPrescription(bp);
      }
      throw new Error('Unsupported update');
    } catch {
      await delay(SIMULATE_DELAY);
      const idx = mockPrescriptions.findIndex((p) => p.id === id);
      if (idx < 0) throw new Error('Prescription not found');
      const now = new Date().toISOString();
      mockPrescriptions[idx] = { ...mockPrescriptions[idx], ...data, updatedAt: now };
      return mockPrescriptions[idx];
    }
  },

  getQueue: async (): Promise<Prescription[]> => {
    try {
      const page = await apiFetch<PageResponse<BackendPrescription>>('/api/prescriptions/queue?size=100');
      return page.content.map(toPrescription);
    } catch {
      await delay(SIMULATE_DELAY);
      return mockPrescriptions
        .filter((p) => p.status === 'submitted' || p.status === 'reviewed')
        .map((p) => ({
          ...p,
          patient: mockPatients.find((pt) => pt.id === p.patientId),
          doctor: mockUsers.find((u) => u.id === p.doctorId),
        }));
    }
  },
};

// ── Medications API ──────────────────────────────────────────────────

export const medicationsApi = {
  getAll: async (params?: { search?: string; group?: string }): Promise<Medication[]> => {
    try {
      const q = params?.search ? `&q=${encodeURIComponent(params.search)}` : '';
      const page = await apiFetch<PageResponse<BackendMedication>>(`/api/medications?size=200${q}`);
      let list = page.content.map(toMedication);
      if (params?.group) {
        list = list.filter((m) => m.group === params.group);
      }
      return list;
    } catch {
      await delay(SIMULATE_DELAY);
      let list = [...mockMedications];
      if (params?.search) {
        const s = params.search.toLowerCase();
        list = list.filter(
          (m) =>
            m.tradeName.toLowerCase().includes(s) ||
            m.code.toLowerCase().includes(s) ||
            m.activeIngredient.toLowerCase().includes(s),
        );
      }
      if (params?.group) {
        list = list.filter((m) => m.group === params.group);
      }
      return list;
    }
  },

  getById: async (id: string): Promise<Medication | undefined> => {
    try {
      const bm = await apiFetch<BackendMedication>(`/api/medications/${id}`);
      return toMedication(bm);
    } catch {
      await delay(SIMULATE_DELAY);
      return mockMedications.find((m) => m.id === id);
    }
  },

  create: async (data: Omit<Medication, 'id'>): Promise<Medication> => {
    try {
      const bm = await apiFetch<BackendMedication>('/api/medications', {
        method: 'POST',
        body: JSON.stringify({
          medicationId: data.code,
          tradeName: data.tradeName,
          activeIngredient: data.activeIngredient,
          dosageForm: data.form,
          strength: data.strength,
          administrationRoute: data.route,
          atcCode: data.atcCode,
          drugGroup: data.group,
          contraindications: data.contraindications,
          active: data.active ?? true,
        }),
      });
      return toMedication(bm);
    } catch {
      await delay(SIMULATE_DELAY);
      const id = `m${Date.now()}`;
      const medication: Medication = { ...data, id };
      mockMedications.push(medication);
      return medication;
    }
  },

  update: async (id: string, data: Partial<Medication>): Promise<Medication> => {
    await delay(SIMULATE_DELAY);
    const idx = mockMedications.findIndex((m) => m.id === id);
    if (idx < 0) throw new Error('Medication not found');
    mockMedications[idx] = { ...mockMedications[idx], ...data };
    return mockMedications[idx];
  },
};

// ── Inventory API ────────────────────────────────────────────────────

export const inventoryApi = {
  getByLocation: async (locationId: string): Promise<InventoryRecord[]> => {
    try {
      const locationName = locationId === 'loc1' ? 'Central Pharmacy' : locationId;
      const batches = await apiFetch<BackendInventoryBatch[]>(
        `/api/inventory/${encodeURIComponent(locationName)}`,
      );
      const mapped = batches.map(toBatch);

      const byMed = new Map<string, MedicationBatch[]>();
      for (const b of mapped) {
        const existing = byMed.get(b.medicationId) ?? [];
        existing.push(b);
        byMed.set(b.medicationId, existing);
      }

      const records: InventoryRecord[] = [];
      for (const [medId, medBatches] of byMed) {
        const totalQty = medBatches.reduce((s, b) => s + b.quantity, 0);
        const nearest = medBatches.map((b) => b.expiryDate).sort()[0];
        records.push({
          medicationId: medId,
          locationId,
          totalQuantity: totalQty,
          batches: medBatches,
          nearestExpiry: nearest,
          alertLevel:
            totalQty < 50
              ? 'low'
              : new Date(nearest) < new Date(Date.now() + 90 * 86400000)
                ? 'expiring'
                : 'ok',
        });
      }
      return records;
    } catch {
      await delay(SIMULATE_DELAY);
      const records: InventoryRecord[] = [];
      const batchesAtLocation = mockBatches.filter((b) => b.locationId === locationId);
      const medIds = [...new Set(batchesAtLocation.map((b) => b.medicationId))];
      medIds.forEach((medId) => {
        const medBatches = batchesAtLocation.filter((b) => b.medicationId === medId);
        const totalQty = medBatches.reduce((s, b) => s + b.quantity, 0);
        const nearest = medBatches.map((b) => b.expiryDate).sort()[0];
        const medication = mockMedications.find((m) => m.id === medId);
        records.push({
          medicationId: medId,
          medication,
          locationId,
          totalQuantity: totalQty,
          batches: medBatches,
          nearestExpiry: nearest,
          alertLevel:
            totalQty < 50
              ? 'low'
              : new Date(nearest) < new Date(Date.now() + 90 * 86400000)
                ? 'expiring'
                : 'ok',
        });
      });
      return records;
    }
  },

  getMedicationBatches: async (medicationId: string, locationId?: string): Promise<MedicationBatch[]> => {
    try {
      const batches = await apiFetch<BackendInventoryBatch[]>(`/api/inventory/medication/${medicationId}`);
      let mapped = batches.map(toBatch);
      if (locationId) {
        mapped = mapped.filter((b) => b.locationId === locationId);
      }
      return mapped;
    } catch {
      await delay(SIMULATE_DELAY);
      return mockBatches.filter(
        (b) => b.medicationId === medicationId && (!locationId || b.locationId === locationId),
      );
    }
  },

  getLocations: async (): Promise<{ id: string; name: string }[]> => {
    return mockLocations;
  },
};

// ── Chat API ─────────────────────────────────────────────────────────

export const chatApi = {
  getConversations: async (userId: string): Promise<Conversation[]> => {
    await delay(SIMULATE_DELAY);
    return mockConversations
      .filter((c) => c.participants.includes(userId))
      .map((c) => ({
        ...c,
        messages: mockMessages.filter((m) => m.conversationId === c.id),
      }));
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    try {
      const msgs = await apiFetch<BackendMessage[]>(
        `/api/prescriptions/${conversationId}/messages`,
      );
      return msgs.map((m) => toMessage(m, conversationId));
    } catch {
      await delay(SIMULATE_DELAY);
      return mockMessages
        .filter((m) => m.conversationId === conversationId)
        .map((m) => ({
          ...m,
          sender: mockUsers.find((u) => u.id === m.senderId),
        }));
    }
  },

  sendMessage: async (conversationId: string, _senderId: string, content: string): Promise<Message> => {
    try {
      const msg = await apiFetch<BackendMessage>(
        `/api/prescriptions/${conversationId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ content, messageType: 'CHAT' }),
        },
      );
      return toMessage(msg, conversationId);
    } catch {
      await delay(SIMULATE_DELAY);
      const msg: Message = {
        id: `msg${Date.now()}`,
        conversationId,
        senderId: _senderId,
        content,
        createdAt: new Date().toISOString(),
      };
      mockMessages.push(msg);
      return msg;
    }
  },

  getOrCreateByPrescription: async (prescriptionId: string, userId: string): Promise<Conversation> => {
    await delay(SIMULATE_DELAY);
    let conv = mockConversations.find((c) => c.prescriptionId === prescriptionId);
    if (!conv) {
      const rx = mockPrescriptions.find((p) => p.id === prescriptionId);
      const participants = rx ? [rx.doctorId, userId] : [userId];
      conv = {
        id: `conv${Date.now()}`,
        prescriptionId,
        participants,
        messages: [],
        lastMessageAt: new Date().toISOString(),
      };
      mockConversations.push(conv);
    }
    return conv;
  },
};

// ── Users API ────────────────────────────────────────────────────────

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    await delay(SIMULATE_DELAY);
    return mockUsers;
  },
};

// ── Drug interaction check (legacy, used by some components) ─────────

export const checkDrugInteraction = (medIds: string[]): [string, string][] => {
  const conflicts: [string, string][] = [];
  drugInteractions.forEach(([a, b]) => {
    if (medIds.includes(a) && medIds.includes(b)) {
      conflicts.push([a, b]);
    }
  });
  return conflicts;
};
