import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layout/AppLayout';
import { LoginPage } from '@/auth/LoginPage';
import { HomePage } from '@/pages/HomePage';
import { PatientList } from '@/modules/patients/PatientList';
import { PatientDetail } from '@/modules/patients/PatientDetail';
import { PatientForm } from '@/modules/patients/PatientForm';
import { PrescriptionList } from '@/modules/prescriptions/PrescriptionList';
import { CreatePrescription } from '@/modules/prescriptions/CreatePrescription';
import { EditPrescription } from '@/modules/prescriptions/EditPrescription';
import { PrescriptionDetail } from '@/modules/prescriptions/PrescriptionDetail';
import { MedicationCatalog } from '@/modules/medications/MedicationCatalog';
import { InventoryByLocation } from '@/modules/inventory/InventoryByLocation';
import { InventoryDetail } from '@/modules/inventory/InventoryDetail';
import { InventoryAIDashboard } from '@/modules/inventory/InventoryAIDashboard';
import { PrescriptionQueue } from '@/modules/pharmacy/PrescriptionQueue';
import { PrescriptionReview } from '@/modules/pharmacy/PrescriptionReview';
import { DispenseSummary } from '@/modules/pharmacy/DispenseSummary';
import { ChatInbox } from '@/modules/chat/ChatInbox';
import { UserManagement } from '@/modules/admin/UserManagement';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const stored = localStorage.getItem('healthineer_auth');
  const isAuth = stored ? !!JSON.parse(stored).user : false;
  if (!isAuth) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'patients', element: <PatientList /> },
      { path: 'patients/new', element: <PatientForm /> },
      { path: 'patients/:id', element: <PatientDetail /> },
      { path: 'patients/:id/edit', element: <PatientForm /> },
      { path: 'prescriptions', element: <PrescriptionList /> },
      { path: 'prescriptions/new', element: <CreatePrescription /> },
      { path: 'prescriptions/:id/edit', element: <EditPrescription /> },
      { path: 'prescriptions/:id', element: <PrescriptionDetail /> },
      { path: 'medications', element: <MedicationCatalog /> },
      { path: 'inventory', element: <InventoryByLocation /> },
      { path: 'inventory/ai-dashboard', element: <InventoryAIDashboard /> },
      { path: 'inventory/:medicationId', element: <InventoryDetail /> },
      { path: 'pharmacy/queue', element: <PrescriptionQueue /> },
      { path: 'pharmacy/review/:id', element: <PrescriptionReview /> },
      { path: 'pharmacy/dispense/:id', element: <DispenseSummary /> },
      { path: 'chat', element: <ChatInbox /> },
      { path: 'admin/users', element: <UserManagement /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
