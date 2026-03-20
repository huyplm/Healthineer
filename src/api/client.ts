/**
 * API Client - Abstraction layer for HTTP calls.
 * Currently uses mock data; swap to fetch/axios for real API.
 */

import type {
  Patient,
  Prescription,
  Medication,
  InventoryRecord,
  Message,
  Conversation,
} from '@/types';
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

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Simulate network delay
const SIMULATE_DELAY = 200;

// Patients API
export const patientsApi = {
  getAll: async (params?: { search?: string; department?: string; status?: string }): Promise<Patient[]> => {
    await delay(SIMULATE_DELAY);
    let list = [...mockPatients];
    if (params?.search) {
      const s = params.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.fullName.toLowerCase().includes(s) ||
          p.code.toLowerCase().includes(s) ||
          p.phone.includes(params.search!)
      );
    }
    if (params?.department) {
      list = list.filter((p) => p.department === params.department);
    }
    if (params?.status) {
      list = list.filter((p) => p.status === params.status);
    }
    return list;
  },
  getById: async (id: string): Promise<Patient | undefined> => {
    await delay(SIMULATE_DELAY);
    return mockPatients.find((p) => p.id === id);
  },
  create: async (data: Omit<Patient, 'id'>): Promise<Patient> => {
    await delay(SIMULATE_DELAY);
    const id = `p${Date.now()}`;
    const code = data.code || `BN${String(mockPatients.length + 1).padStart(3, '0')}`;
    const patient: Patient = { ...data, id, code };
    mockPatients.push(patient);
    return patient;
  },
  update: async (id: string, data: Partial<Patient>): Promise<Patient> => {
    await delay(SIMULATE_DELAY);
    const idx = mockPatients.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error('Patient not found');
    mockPatients[idx] = { ...mockPatients[idx], ...data };
    return mockPatients[idx];
  },
};

// Prescriptions API
export const prescriptionsApi = {
  getAll: async (params?: { doctorId?: string; status?: string }): Promise<Prescription[]> => {
    await delay(SIMULATE_DELAY);
    let list = [...mockPrescriptions];
    if (params?.doctorId) {
      list = list.filter((p) => p.doctorId === params.doctorId);
    }
    if (params?.status) {
      list = list.filter((p) => p.status === params.status);
    }
    return list.map((p) => ({
      ...p,
      patient: mockPatients.find((pt) => pt.id === p.patientId),
      doctor: mockUsers.find((u) => u.id === p.doctorId),
    }));
  },
  getById: async (id: string): Promise<Prescription | undefined> => {
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
  },
  create: async (data: Omit<Prescription, 'id' | 'code' | 'createdAt' | 'updatedAt'>): Promise<Prescription> => {
    await delay(SIMULATE_DELAY);
    const id = `rx${Date.now()}`;
    const code = `ĐT${String(mockPrescriptions.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();
    const prescription: Prescription = {
      ...data,
      id,
      code,
      createdAt: now,
      updatedAt: now,
      ...(data.status === 'submitted' && { submittedAt: now }),
    };
    mockPrescriptions.push(prescription);
    return prescription;
  },
  update: async (id: string, data: Partial<Prescription>): Promise<Prescription> => {
    await delay(SIMULATE_DELAY);
    const idx = mockPrescriptions.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error('Prescription not found');
    const now = new Date().toISOString();
    mockPrescriptions[idx] = {
      ...mockPrescriptions[idx],
      ...data,
      updatedAt: now,
      ...(data.status === 'submitted' && { submittedAt: now }),
      ...(data.status === 'reviewed' && { reviewedAt: now }),
      ...(data.status === 'approved' && { approvedAt: now }),
      ...(data.status === 'dispensed' && { dispensedAt: now }),
      ...(data.status === 'completed' && { completedAt: now }),
    };
    return mockPrescriptions[idx];
  },
  getQueue: async (): Promise<Prescription[]> => {
    await delay(SIMULATE_DELAY);
    return mockPrescriptions
      .filter((p) => p.status === 'submitted' || p.status === 'reviewed')
      .map((p) => ({
        ...p,
        patient: mockPatients.find((pt) => pt.id === p.patientId),
        doctor: mockUsers.find((u) => u.id === p.doctorId),
      }));
  },
};

// Medications API
export const medicationsApi = {
  getAll: async (params?: { search?: string; group?: string }): Promise<Medication[]> => {
    await delay(SIMULATE_DELAY);
    let list = [...mockMedications];
    if (params?.search) {
      const s = params.search.toLowerCase();
      list = list.filter(
        (m) =>
          m.tradeName.toLowerCase().includes(s) ||
          m.code.toLowerCase().includes(s) ||
          m.activeIngredient.toLowerCase().includes(s)
      );
    }
    if (params?.group) {
      list = list.filter((m) => m.group === params.group);
    }
    return list;
  },
  getById: async (id: string): Promise<Medication | undefined> => {
    await delay(SIMULATE_DELAY);
    return mockMedications.find((m) => m.id === id);
  },
  create: async (data: Omit<Medication, 'id'>): Promise<Medication> => {
    await delay(SIMULATE_DELAY);
    const id = `m${Date.now()}`;
    const medication: Medication = { ...data, id };
    mockMedications.push(medication);
    return medication;
  },
  update: async (id: string, data: Partial<Medication>): Promise<Medication> => {
    await delay(SIMULATE_DELAY);
    const idx = mockMedications.findIndex((m) => m.id === id);
    if (idx < 0) throw new Error('Medication not found');
    mockMedications[idx] = { ...mockMedications[idx], ...data };
    return mockMedications[idx];
  },
};

// Inventory API
export const inventoryApi = {
  getByLocation: async (locationId: string): Promise<InventoryRecord[]> => {
    await delay(SIMULATE_DELAY);
    const records: InventoryRecord[] = [];
    const batchesAtLocation = mockBatches.filter((b) => b.locationId === locationId);
    const medIds = [...new Set(batchesAtLocation.map((b) => b.medicationId))];
    medIds.forEach((medId) => {
      const medBatches = batchesAtLocation.filter((b) => b.medicationId === medId);
      const totalQty = medBatches.reduce((s, b) => s + b.quantity, 0);
      const nearest = medBatches
        .map((b) => b.expiryDate)
        .sort()[0];
      const medication = mockMedications.find((m) => m.id === medId);
      records.push({
        medicationId: medId,
        medication,
        locationId,
        totalQuantity: totalQty,
        batches: medBatches,
        nearestExpiry: nearest,
        alertLevel: totalQty < 50 ? 'low' : new Date(nearest) < new Date(Date.now() + 90 * 86400000) ? 'expiring' : 'ok',
      });
    });
    return records;
  },
  getMedicationBatches: async (medicationId: string, locationId?: string): Promise<typeof mockBatches> => {
    await delay(SIMULATE_DELAY);
    return mockBatches.filter(
      (b) => b.medicationId === medicationId && (!locationId || b.locationId === locationId)
    );
  },
  getLocations: async () => mockLocations,
};

// Chat API
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
    await delay(SIMULATE_DELAY);
    return mockMessages
      .filter((m) => m.conversationId === conversationId)
      .map((m) => ({
        ...m,
        sender: mockUsers.find((u) => u.id === m.senderId),
      }));
  },
  sendMessage: async (conversationId: string, senderId: string, content: string): Promise<Message> => {
    await delay(SIMULATE_DELAY);
    const msg: Message = {
      id: `msg${Date.now()}`,
      conversationId,
      senderId,
      content,
      createdAt: new Date().toISOString(),
    };
    mockMessages.push(msg);
    const conv = mockConversations.find((c) => c.id === conversationId);
    if (conv) conv.lastMessageAt = msg.createdAt;
    return msg;
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

// Users API
export const usersApi = {
  getAll: async () => {
    await delay(SIMULATE_DELAY);
    return mockUsers;
  },
};

// Drug interaction check
export const checkDrugInteraction = (medIds: string[]): [string, string][] => {
  const conflicts: [string, string][] = [];
  drugInteractions.forEach(([a, b]) => {
    if (medIds.includes(a) && medIds.includes(b)) {
      conflicts.push([a, b]);
    }
  });
  return conflicts;
};
