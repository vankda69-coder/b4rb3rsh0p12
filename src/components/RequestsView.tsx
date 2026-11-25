import { useMemo, useState } from 'react';
import { Check, CheckCircle2, Search, X } from 'lucide-react';
import type { Appointment, AppointmentStatus, Client } from '../types/barbershop';
import {
  TODAY_ISO,
  TOMORROW_ISO,
  formatCurrency,
  formatShortDate,
  getStatusLabel,
  getStatusTextClass,
} from '../utils/formatters';
import { Avatar } from './Avatar';

interface RequestsViewProps {
  appointments: Appointment[];
  clients: Client[];
  onApprove: (appointmentId: string) => void;
  onOpenDetail: (appointment: Appointment, initialAction?: 'view' | 'complete' | 'cancel') => void;
  onReopen: (appointmentId: string) => void;
  onViewClientHistory: (clientId: string) => void;
  onOpenNewBooking: () => void;
}

type StatusFilter = 'all' | AppointmentStatus;
type DateFilter = 'all' | 'today' | 'tomorrow';

const STATUS_TABS: Array<{ id: StatusFilter; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'confirmed', label: 'Confirmadas' },
  { id: 'completed', label: 'Completadas' },
  { id: 'cancelled', label: 'Canceladas' },
];

export function RequestsView({
  appointments,
  clients,
  onApprove,
  onOpenDetail,
  onReopen,
  onViewClientHistory,
  onOpenNewBooking,
}: RequestsViewProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const clientsById = useMemo(() => {
    const map = new Map<string, Client>();
    clients.forEach((client) => map.set(client.id, client));
    return map;
  }, [clients]);

  const metrics = useMemo(() => {
    const pending = appointments.filter((a) => a.status === 'pending');
    const confirmedToday = appointments.filter(
      (a) => a.status === 'confirmed' && a.date === TODAY_ISO
    );
    const completed = appointments.filter((a) => a.status === 'completed');
    const pendingRevenue = pending.reduce((sum, a) => sum + a.price, 0);
    const completedRevenue = completed.reduce((sum, a) => sum + a.price, 0);
    const totalHistoryVisits = clients.reduce(
      (sum, c) => sum + c.history.filter((h) => h.status === 'completed').length,
      0
    );

    return {
      pendingCount: pending.length,
      pendingRevenue,
      confirmedTodayCount: confirmedToday.length,
      confirmedTodayMinutes: confirmedToday.reduce((sum, a) => sum + a.durationMinutes, 0),
      completedCount: completed.length,
      completedRevenue,
      clientsCount: clients.length,
      totalHistoryVisits,
    };
  }, [appointments, clients]);

  const countsByStatus = useMemo(() => {
    return {
      all: appointments.length,
      pending: appointments.filter((a) => a.status === 'pending').length,
      confirmed: appointments.filter((a) => a.status === 'confirmed').length,
      completed: appointments.filter((a) => a.status === 'completed').length,
      cancelled: appointments.filter((a) => a.status === 'cancelled').length,
    };
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const statusWeight: Record<AppointmentStatus, number> = {
      pending: 0,
      confirmed: 1,
      completed: 2,
      cancelled: 3,
    };

    return appointments
      .filter((apt) => {
        if (statusFilter !== 'all' && apt.status !== statusFilter) return false;
        if (dateFilter === 'today' && apt.date !== TODAY_ISO) return false;
        if (dateFilter === 'tomorrow' && apt.date !== TOMORROW_ISO) return false;
        if (q) {
          const haystack =
            `${apt.clientName} ${apt.clientPhone} ${apt.serviceName} ${apt.barberName} ${apt.clientNotes}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (statusFilter === 'all' && statusWeight[a.status] !== statusWeight[b.status]) {
          return statusWeight[a.status] - statusWeight[b.status];
        }
        const dateCmp = a.date.localeCompare(b.date);
        if (dateCmp !== 0) return dateCmp;
        return a.time.localeCompare(b.time);
      });
  }, [appointments, statusFilter, dateFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
          Solicitudes y control de citas
        </h1>
        <p className="text-sm text-zinc-600">
          Aprueba o cancela reservas entrantes y marca servicios completados para registrar cada visita en el historial del cliente.
        </p>
      </div>

      {/* Full-width KPI Strip (Single elevation surface with hairline dividers) */}
      <section
        aria-label="Resumen operativo"
        className="bg-white border border-zinc-200 rounded-lg grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200"
      >
        <div className="p-5">
          <p className="text-xs font-medium text-zinc-500">Solicitudes pendientes</p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-semibold text-zinc-950 tabular-nums">
              {metrics.pendingCount}
            </span>
            <span className="font-mono text-xs text-zinc-500 tabular-nums">
              {formatCurrency(metrics.pendingRevenue)} est.
            </span>
          </div>
          <p className="mt-1 text-xs text-amber-700">
            {metrics.pendingCount > 0 ? 'Requieren revisión del barbero' : 'Bandeja al día'}
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-zinc-500">Confirmadas hoy</p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-semibold text-zinc-950 tabular-nums">
              {metrics.confirmedTodayCount}
            </span>
            <span className="font-mono text-xs text-zinc-500 tabular-nums">
              {metrics.confirmedTodayMinutes} min en silla
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Listas para atender y completar</p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-zinc-500">Completadas registradas</p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-semibold text-zinc-950 tabular-nums">
              {metrics.completedCount}
            </span>
            <span className="font-mono text-xs text-emerald-700 font-medium tabular-nums">
              {formatCurrency(metrics.completedRevenue)}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Registradas en el historial del cliente</p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-zinc-500">Base de clientes</p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-semibold text-zinc-950 tabular-nums">
              {metrics.clientsCount}
            </span>
            <span className="font-mono text-xs text-zinc-500 tabular-nums">
              {metrics.totalHistoryVisits} visitas totales
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Historial actualizado automáticamente</p>
        </div>
      </section>

      {/* Main Ledger Surface */}
      <section className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        {/* Filter & Search Toolbar */}
        <div className="p-4 border-b border-zinc-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-md overflow-x-auto">
            {STATUS_TABS.map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-zinc-900 ${
                    isActive
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="font-mono text-[11px] tabular-nums text-zinc-400">
                    {countsByStatus[tab.id]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-md self-start sm:self-auto">
              {(
                [
                  { id: 'all', label: 'Todas las fechas' },
                  { id: 'today', label: 'Hoy' },
                  { id: 'tomorrow', label: 'Mañana' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDateFilter(opt.id)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                    dateFilter === opt.id
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cliente, teléfono o servicio..."
                aria-label="Buscar citas"
                className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* High-Density Data Table */}
        {filteredAppointments.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-semibold text-zinc-900">
              No hay citas que coincidan con este filtro
            </p>
            <p className="mt-1 text-sm text-zinc-500 max-w-md mx-auto">
              Ajusta los criterios de búsqueda o registra una nueva solicitud de reserva para comenzar a gestionarla.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              {(statusFilter !== 'all' || dateFilter !== 'all' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('all');
                    setDateFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors whitespace-nowrap"
                >
                  Limpiar filtros
                </button>
              )}
              <button
                type="button"
                onClick={onOpenNewBooking}
                className="px-4 py-2 text-xs font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors whitespace-nowrap"
              >
                Nueva reserva
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/70 text-xs font-medium text-zinc-500">
                  <th className="py-3 pl-5 pr-4 whitespace-nowrap">Fecha y hora</th>
                  <th className="py-3 px-4 whitespace-nowrap">Cliente</th>
                  <th className="py-3 px-4 whitespace-nowrap">Servicio</th>
                  <th className="py-3 px-4 whitespace-nowrap">Barbero</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Importe</th>
                  <th className="py-3 px-4 whitespace-nowrap">Estado</th>
                  <th className="py-3 pl-4 pr-5 text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 text-sm">
                {filteredAppointments.map((apt) => {
                  const client = clientsById.get(apt.clientId);
                  const completedVisits =
                    client?.history.filter((h) => h.status === 'completed').length ?? 0;

                  return (
                    <tr
                      key={apt.id}
                      onClick={() => onOpenDetail(apt, 'view')}
                      className="hover:bg-zinc-50/90 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 pl-5 pr-4 align-middle whitespace-nowrap">
                        <div className="font-mono text-sm font-medium text-zinc-950 tabular-nums">
                          {apt.time}
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {formatShortDate(apt.date)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-3 min-w-[180px]">
                          <Avatar name={apt.clientName} src={client?.avatarUrl} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium text-zinc-950 truncate">
                              {apt.clientName}
                            </p>
                            <p className="text-xs text-zinc-500 font-mono tabular-nums truncate">
                              {apt.clientPhone} ·{' '}
                              <span className="font-sans">
                                {completedVisits === 0
                                  ? 'Primera visita'
                                  : `${completedVisits} ${completedVisits === 1 ? 'visita' : 'visitas'}`}
                              </span>
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-middle">
                        <div className="min-w-[180px] max-w-[260px]">
                          <p className="font-medium text-zinc-900 truncate">
                            {apt.serviceName}
                          </p>
                          <p className="text-xs text-zinc-500 truncate mt-0.5">
                            <span className="font-mono tabular-nums">
                              {apt.durationMinutes} min
                            </span>
                            {apt.clientNotes ? ` · ${apt.clientNotes}` : ''}
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-middle whitespace-nowrap text-zinc-700">
                        {apt.barberName}
                      </td>

                      <td className="py-3.5 px-4 align-middle text-right whitespace-nowrap font-mono font-medium text-zinc-950 tabular-nums">
                        {formatCurrency(apt.price)}
                      </td>

                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <span className={`text-xs font-semibold ${getStatusTextClass(apt.status)}`}>
                          {getStatusLabel(apt.status)}
                        </span>
                      </td>

                      <td
                        className="py-3.5 pl-4 pr-5 align-middle text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-2">
                          {apt.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => onApprove(apt.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Aprobar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenDetail(apt, 'cancel')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-md hover:text-red-700 hover:border-red-200 hover:bg-red-50/50 transition-colors whitespace-nowrap shrink-0"
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>Cancelar</span>
                              </button>
                            </>
                          )}

                          {apt.status === 'confirmed' && (
                            <>
                              <button
                                type="button"
                                onClick={() => onOpenDetail(apt, 'complete')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 rounded-md hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Completar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenDetail(apt, 'cancel')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-md hover:text-red-700 hover:border-red-200 hover:bg-red-50/50 transition-colors whitespace-nowrap shrink-0"
                              >
                                <span>Cancelar</span>
                              </button>
                            </>
                          )}

                          {apt.status === 'completed' && (
                            <button
                              type="button"
                              onClick={() => onViewClientHistory(apt.clientId)}
                              className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md hover:text-zinc-950 hover:border-zinc-400 transition-colors whitespace-nowrap shrink-0"
                            >
                              Ver historial
                            </button>
                          )}

                          {apt.status === 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => onReopen(apt.id)}
                              className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md hover:text-zinc-950 hover:border-zinc-400 transition-colors whitespace-nowrap shrink-0"
                            >
                              Reabrir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
