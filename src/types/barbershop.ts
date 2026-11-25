export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type AdminView = 'requests' | 'schedule' | 'clients' | 'services';

export interface Service {
  id: string;
  name: string;
  category: 'Corte' | 'Barba' | 'Ritual';
  durationMinutes: number;
  price: number;
  description: string;
  active: boolean;
}

export interface Barber {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  specialty: string;
}

export interface ClientHistoryEntry {
  id: string;
  appointmentId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  serviceId: string;
  serviceName: string;
  barberId: string;
  barberName: string;
  price: number;
  durationMinutes: number;
  status: 'completed' | 'cancelled';
  barberNotes: string;
  recordedAt: string; // ISO timestamp
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  preferences: string;
  createdAt: string;
  history: ClientHistoryEntry[];
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  barberId: string;
  barberName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  price: number;
  status: AppointmentStatus;
  clientNotes: string;
  barberNotes?: string;
  cancellationReason?: string;
  requestedAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateAppointmentInput {
  clientMode: 'existing' | 'new';
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
  initialStatus: 'pending' | 'confirmed';
  clientNotes: string;
}

export interface ToastNotification {
  id: string;
  title: string;
  description: string;
  tone: 'neutral' | 'success' | 'danger';
  actionLabel?: string;
  actionClientId?: string;
}
