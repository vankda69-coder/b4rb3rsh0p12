import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BARBERS,
  INITIAL_APPOINTMENTS,
  INITIAL_CLIENTS,
  INITIAL_SERVICES,
} from '../data/seedData';
import type {
  Appointment,
  Client,
  ClientHistoryEntry,
  CreateAppointmentInput,
  Service,
} from '../types/barbershop';

const STORAGE_KEY = 'oficio_barberia_admin_state_v1';

interface PersistedState {
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
}

function loadInitialState(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        appointments: INITIAL_APPOINTMENTS,
        clients: INITIAL_CLIENTS,
        services: INITIAL_SERVICES,
      };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (
      Array.isArray(parsed.appointments) &&
      Array.isArray(parsed.clients) &&
      Array.isArray(parsed.services)
    ) {
      return {
        appointments: parsed.appointments,
        clients: parsed.clients,
        services: parsed.services,
      };
    }
  } catch {
    // Fallback to clean seed state if localStorage is unavailable or corrupted
  }
  return {
    appointments: INITIAL_APPOINTMENTS,
    clients: INITIAL_CLIENTS,
    services: INITIAL_SERVICES,
  };
}

export function useBarbershopStore() {
  const [state, setState] = useState<PersistedState>(() => loadInitialState());
  const stateRef = useRef<PersistedState>(state);
  stateRef.current = state;

  const [recentlyUpdatedClientId, setRecentlyUpdatedClientId] = useState<string | null>(
    null
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota issues gracefully
    }
  }, [state]);

  const approveAppointment = useCallback((appointmentId: string): Appointment | null => {
    const current = stateRef.current.appointments.find((a) => a.id === appointmentId);
    if (!current) return null;

    const nowIso = new Date().toISOString();
    const updatedTarget: Appointment = {
      ...current,
      status: 'confirmed',
      cancellationReason: undefined,
      updatedAt: nowIso,
    };

    setState((prev) => ({
      ...prev,
      appointments: prev.appointments.map((apt) =>
        apt.id === appointmentId ? updatedTarget : apt
      ),
    }));

    return updatedTarget;
  }, []);

  const cancelAppointment = useCallback(
    (appointmentId: string, reason?: string): Appointment | null => {
      const target = stateRef.current.appointments.find((a) => a.id === appointmentId);
      if (!target) return null;

      const nowIso = new Date().toISOString();
      const normalizedReason =
        reason?.trim() || 'Cancelada desde el panel de administración.';

      const cancelledTarget: Appointment = {
        ...target,
        status: 'cancelled',
        cancellationReason: normalizedReason,
        updatedAt: nowIso,
      };

      const historyEntry: ClientHistoryEntry = {
        id: `hist-${target.id}`,
        appointmentId: target.id,
        date: target.date,
        time: target.time,
        serviceId: target.serviceId,
        serviceName: target.serviceName,
        barberId: target.barberId,
        barberName: target.barberName,
        price: target.price,
        durationMinutes: target.durationMinutes,
        status: 'cancelled',
        barberNotes: normalizedReason,
        recordedAt: nowIso,
      };

      setState((prev) => ({
        ...prev,
        appointments: prev.appointments.map((apt) =>
          apt.id === appointmentId ? cancelledTarget : apt
        ),
        clients: prev.clients.map((client) => {
          if (client.id !== target.clientId) return client;
          const filtered = client.history.filter(
            (entry) => entry.appointmentId !== target.id
          );
          return {
            ...client,
            history: [historyEntry, ...filtered],
          };
        }),
      }));

      setRecentlyUpdatedClientId(target.clientId);
      return cancelledTarget;
    },
    []
  );

  const completeAppointment = useCallback(
    (
      appointmentId: string,
      barberNotes?: string
    ): { appointment: Appointment; completedVisitsCount: number } | null => {
      const target = stateRef.current.appointments.find((a) => a.id === appointmentId);
      if (!target) return null;

      const nowIso = new Date().toISOString();
      const finalNotes =
        barberNotes?.trim() ||
        target.barberNotes?.trim() ||
        'Servicio completado según preferencias registradas del cliente.';

      const updatedApt: Appointment = {
        ...target,
        status: 'completed',
        barberNotes: finalNotes,
        completedAt: nowIso,
        updatedAt: nowIso,
      };

      const newHistoryEntry: ClientHistoryEntry = {
        id: `hist-${target.id}`,
        appointmentId: target.id,
        date: target.date,
        time: target.time,
        serviceId: target.serviceId,
        serviceName: target.serviceName,
        barberId: target.barberId,
        barberName: target.barberName,
        price: target.price,
        durationMinutes: target.durationMinutes,
        status: 'completed',
        barberNotes: finalNotes,
        recordedAt: nowIso,
      };

      const existingClient = stateRef.current.clients.find(
        (c) => c.id === target.clientId
      );
      const priorCompletedWithoutDuplicate = (existingClient?.history || []).filter(
        (entry) => entry.appointmentId !== target.id && entry.status === 'completed'
      ).length;
      const completedVisitsCount = priorCompletedWithoutDuplicate + 1;

      setState((prev) => ({
        ...prev,
        appointments: prev.appointments.map((apt) =>
          apt.id === appointmentId ? updatedApt : apt
        ),
        clients: prev.clients.map((client) => {
          if (client.id !== target.clientId) return client;
          const withoutDuplicate = client.history.filter(
            (entry) => entry.appointmentId !== target.id
          );
          return {
            ...client,
            history: [newHistoryEntry, ...withoutDuplicate],
          };
        }),
      }));

      setRecentlyUpdatedClientId(target.clientId);
      return { appointment: updatedApt, completedVisitsCount };
    },
    []
  );

  const reopenAppointment = useCallback((appointmentId: string): Appointment | null => {
    const target = stateRef.current.appointments.find((a) => a.id === appointmentId);
    if (!target) return null;

    const nowIso = new Date().toISOString();
    const reopened: Appointment = {
      ...target,
      status: 'pending',
      cancellationReason: undefined,
      updatedAt: nowIso,
    };

    setState((prev) => ({
      ...prev,
      appointments: prev.appointments.map((apt) =>
        apt.id === appointmentId ? reopened : apt
      ),
      clients: prev.clients.map((client) => {
        if (client.id !== target.clientId) return client;
        return {
          ...client,
          history: client.history.filter(
            (entry) =>
              !(entry.appointmentId === target.id && entry.status === 'cancelled')
          ),
        };
      }),
    }));

    return reopened;
  }, []);

  const createAppointment = useCallback(
    (input: CreateAppointmentInput): Appointment | null => {
      const snapshot = stateRef.current;
      const service = snapshot.services.find((s) => s.id === input.serviceId);
      const barber = BARBERS.find((b) => b.id === input.barberId);
      if (!service || !barber) return null;

      const nowIso = new Date().toISOString();
      const timestampId = Date.now();
      let clientId = input.clientId || '';
      let clientName = '';
      let clientPhone = '';
      let newClientToAdd: Client | null = null;

      if (input.clientMode === 'existing' && input.clientId) {
        const existing = snapshot.clients.find((c) => c.id === input.clientId);
        if (!existing) return null;
        clientId = existing.id;
        clientName = existing.name;
        clientPhone = existing.phone;
      } else {
        const trimmedName = (input.clientName || '').trim();
        const trimmedPhone = (input.clientPhone || '').trim();
        if (!trimmedName || !trimmedPhone) return null;

        clientId = `cli-${timestampId}`;
        clientName = trimmedName;
        clientPhone = trimmedPhone;
        newClientToAdd = {
          id: clientId,
          name: trimmedName,
          phone: trimmedPhone,
          email: (input.clientEmail || '').trim() || 'sin-correo@oficiobarberia.es',
          preferences:
            input.clientNotes.trim() || 'Sin preferencias registradas aún.',
          createdAt: nowIso,
          history: [],
        };
      }

      const created: Appointment = {
        id: `apt-${timestampId}`,
        clientId,
        clientName,
        clientPhone,
        serviceId: service.id,
        serviceName: service.name,
        barberId: barber.id,
        barberName: barber.name,
        date: input.date,
        time: input.time,
        durationMinutes: service.durationMinutes,
        price: service.price,
        status: input.initialStatus,
        clientNotes: input.clientNotes.trim(),
        requestedAt: nowIso,
        updatedAt: nowIso,
      };

      setState((prev) => ({
        ...prev,
        clients: newClientToAdd ? [newClientToAdd, ...prev.clients] : prev.clients,
        appointments: [created, ...prev.appointments],
      }));

      return created;
    },
    []
  );

  const updateClientPreferences = useCallback((clientId: string, preferences: string) => {
    setState((prev) => ({
      ...prev,
      clients: prev.clients.map((client) =>
        client.id === clientId ? { ...client, preferences: preferences.trim() } : client
      ),
    }));
  }, []);

  const saveService = useCallback(
    (serviceData: Omit<Service, 'id'> & { id?: string }) => {
      setState((prev) => {
        if (serviceData.id) {
          return {
            ...prev,
            services: prev.services.map((s) =>
              s.id === serviceData.id ? { ...s, ...serviceData, id: s.id } : s
            ),
          };
        }
        const newService: Service = {
          ...serviceData,
          id: `srv-${Date.now()}`,
        };
        return {
          ...prev,
          services: [...prev.services, newService],
        };
      });
    },
    []
  );

  const toggleServiceActive = useCallback((serviceId: string) => {
    setState((prev) => ({
      ...prev,
      services: prev.services.map((s) =>
        s.id === serviceId ? { ...s, active: !s.active } : s
      ),
    }));
  }, []);

  return {
    appointments: state.appointments,
    clients: state.clients,
    services: state.services,
    barbers: BARBERS,
    recentlyUpdatedClientId,
    clearRecentlyUpdatedClient: () => setRecentlyUpdatedClientId(null),
    approveAppointment,
    cancelAppointment,
    completeAppointment,
    reopenAppointment,
    createAppointment,
    updateClientPreferences,
    saveService,
    toggleServiceActive,
  };
}
