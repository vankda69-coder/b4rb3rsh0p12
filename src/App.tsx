import { useCallback, useEffect, useMemo, useState } from 'react';
import { Menu, Plus } from 'lucide-react';
import {
  AppointmentDrawer,
  type DrawerActionMode,
} from './components/AppointmentDrawer';
import { ClientsHistoryView } from './components/ClientsHistoryView';
import { NewBookingDrawer } from './components/NewBookingDrawer';
import { RequestsView } from './components/RequestsView';
import { ScheduleView } from './components/ScheduleView';
import { ServicesView } from './components/ServicesView';
import { Sidebar } from './components/Sidebar';
import { ToastBanner } from './components/ToastBanner';
import { useBarbershopStore } from './hooks/useBarbershopStore';
import type {
  AdminView,
  Appointment,
  CreateAppointmentInput,
  ToastNotification,
} from './types/barbershop';
import { TODAY_ISO, formatShortDate } from './utils/formatters';

const VIEW_BREADCRUMBS: Record<AdminView, string> = {
  requests: 'Solicitudes entrantes',
  schedule: 'Agenda del día',
  clients: 'Clientes e historial',
  services: 'Catálogo de servicios',
};

export default function App() {
  const {
    appointments,
    clients,
    services,
    barbers,
    recentlyUpdatedClientId,
    approveAppointment,
    cancelAppointment,
    completeAppointment,
    reopenAppointment,
    createAppointment,
    updateClientPreferences,
    saveService,
    toggleServiceActive,
  } = useBarbershopStore();

  const [activeView, setActiveView] = useState<AdminView>('requests');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    clients[0]?.id || null
  );
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerActionMode>('view');

  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [bookingPrefillClientId, setBookingPrefillClientId] = useState<string | null>(
    null
  );
  const [bookingPrefillDate, setBookingPrefillDate] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastNotification | null>(null);

  const showToast = useCallback((next: Omit<ToastNotification, 'id'>) => {
    setToast({ ...next, id: `toast-${Date.now()}` });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const pendingCount = useMemo(
    () => appointments.filter((a) => a.status === 'pending').length,
    [appointments]
  );

  const todayConfirmedCount = useMemo(
    () =>
      appointments.filter((a) => a.status === 'confirmed' && a.date === TODAY_ISO).length,
    [appointments]
  );

  const activeAppointment = useMemo(
    () => appointments.find((a) => a.id === activeAppointmentId) || null,
    [appointments, activeAppointmentId]
  );

  const activeAppointmentClient = useMemo(
    () =>
      activeAppointment
        ? clients.find((c) => c.id === activeAppointment.clientId) || null
        : null,
    [activeAppointment, clients]
  );

  const handleOpenDetail = (
    appointment: Appointment,
    initialMode: DrawerActionMode = 'view'
  ) => {
    setActiveAppointmentId(appointment.id);
    setDrawerMode(initialMode);
  };

  const handleApprove = (appointmentId: string) => {
    const target = appointments.find((a) => a.id === appointmentId);
    approveAppointment(appointmentId);
    if (target) {
      showToast({
        title: 'Cita aprobada',
        description: `${target.clientName} · ${target.serviceName} (${formatShortDate(target.date)} a las ${target.time}).`,
        tone: 'success',
      });
    }
  };

  const handleComplete = (appointmentId: string, barberNotes: string) => {
    const target = appointments.find((a) => a.id === appointmentId);
    const clientBefore = target
      ? clients.find((c) => c.id === target.clientId)
      : undefined;
    const nextVisitsCount =
      (clientBefore?.history.filter((h) => h.status === 'completed').length ?? 0) + 1;

    completeAppointment(appointmentId, barberNotes);

    if (target) {
      showToast({
        title: 'Servicio completado',
        description: `Historial de ${target.clientName} actualizado automáticamente (${nextVisitsCount} ${nextVisitsCount === 1 ? 'visita registrada' : 'visitas registradas'}).`,
        tone: 'success',
        actionLabel: 'Ver historial del cliente',
        actionClientId: target.clientId,
      });
    }
  };

  const handleCancel = (appointmentId: string, reason: string) => {
    const target = appointments.find((a) => a.id === appointmentId);
    cancelAppointment(appointmentId, reason);
    if (target) {
      showToast({
        title: 'Cita cancelada',
        description: `La reserva de ${target.clientName} ha sido cancelada y registrada en su expediente.`,
        tone: 'danger',
        actionLabel: 'Ver expediente',
        actionClientId: target.clientId,
      });
    }
  };

  const handleReopen = (appointmentId: string) => {
    const target = appointments.find((a) => a.id === appointmentId);
    reopenAppointment(appointmentId);
    if (target) {
      showToast({
        title: 'Cita reabierta',
        description: `La reserva de ${target.clientName} volvió a la bandeja de solicitudes pendientes.`,
        tone: 'neutral',
      });
    }
  };

  const handleCreateAppointment = (input: CreateAppointmentInput) => {
    const created = createAppointment(input);
    if (created) {
      showToast({
        title:
          created.status === 'pending'
            ? 'Nueva solicitud registrada'
            : 'Cita confirmada en agenda',
        description: `${created.clientName} · ${created.serviceName} (${formatShortDate(created.date)} a las ${created.time}).`,
        tone: 'success',
      });
    }
  };

  const handleViewClientHistory = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveView('clients');
  };

  const openNewBooking = (options?: { clientId?: string; date?: string }) => {
    setBookingPrefillClientId(options?.clientId ?? null);
    setBookingPrefillDate(options?.date ?? null);
    setNewBookingOpen(true);
  };

  return (
    <div className="min-h-screen flex bg-[#F7F7F5] text-zinc-900">
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        pendingCount={pendingCount}
        todayConfirmedCount={todayConfirmedCount}
        activeBarber={barbers[0]}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract: Breadcrumb on left, single primary CTA on right */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-zinc-200 px-4 sm:px-8 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir navegación"
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>

            <nav aria-label="Ruta actual" className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-zinc-500 whitespace-nowrap shrink-0 hidden sm:inline">
                Administración
              </span>
              <span
                aria-hidden="true"
                className="text-zinc-300 hidden sm:inline shrink-0"
              >
                /
              </span>
              <span className="font-semibold text-zinc-950 truncate">
                {VIEW_BREADCRUMBS[activeView]}
              </span>
            </nav>
          </div>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => openNewBooking()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nueva reserva</span>
            </button>
          </div>
        </header>

        {/* Main Workspace Canvas */}
        <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-8 py-6">
          {activeView === 'requests' && (
            <RequestsView
              appointments={appointments}
              clients={clients}
              onApprove={handleApprove}
              onOpenDetail={handleOpenDetail}
              onReopen={handleReopen}
              onViewClientHistory={handleViewClientHistory}
              onOpenNewBooking={() => openNewBooking()}
            />
          )}

          {activeView === 'schedule' && (
            <ScheduleView
              appointments={appointments}
              barbers={barbers}
              clients={clients}
              onApprove={handleApprove}
              onOpenDetail={handleOpenDetail}
              onViewClientHistory={handleViewClientHistory}
              onOpenNewBooking={(date) => openNewBooking({ date })}
            />
          )}

          {activeView === 'clients' && (
            <ClientsHistoryView
              clients={clients}
              appointments={appointments}
              selectedClientId={selectedClientId}
              recentlyUpdatedClientId={recentlyUpdatedClientId}
              onSelectClient={setSelectedClientId}
              onUpdatePreferences={(clientId, prefs) => {
                updateClientPreferences(clientId, prefs);
                showToast({
                  title: 'Notas actualizadas',
                  description: 'Las preferencias técnicas del cliente se han guardado.',
                  tone: 'neutral',
                });
              }}
              onBookForClient={(clientId) => openNewBooking({ clientId })}
            />
          )}

          {activeView === 'services' && (
            <ServicesView
              services={services}
              clients={clients}
              onSaveService={(srv) => {
                saveService(srv);
                showToast({
                  title: srv.id ? 'Servicio actualizado' : 'Servicio creado',
                  description: `${srv.name} está disponible en el catálogo de reservas.`,
                  tone: 'success',
                });
              }}
              onToggleServiceActive={toggleServiceActive}
            />
          )}
        </main>
      </div>

      {/* Appointment Detail / Complete / Cancel Drawer */}
      <AppointmentDrawer
        appointment={activeAppointment}
        client={activeAppointmentClient}
        initialMode={drawerMode}
        onClose={() => setActiveAppointmentId(null)}
        onApprove={handleApprove}
        onComplete={handleComplete}
        onCancel={handleCancel}
        onReopen={handleReopen}
        onOpenClientHistory={handleViewClientHistory}
      />

      {/* New Booking Request Drawer */}
      <NewBookingDrawer
        open={newBookingOpen}
        clients={clients}
        services={services}
        barbers={barbers}
        prefillClientId={bookingPrefillClientId}
        prefillDate={bookingPrefillDate}
        onClose={() => setNewBookingOpen(false)}
        onCreate={handleCreateAppointment}
      />

      {/* Live Action Feedback Toast */}
      <ToastBanner
        toast={toast}
        onDismiss={() => setToast(null)}
        onOpenClientHistory={handleViewClientHistory}
      />
    </div>
  );
}
