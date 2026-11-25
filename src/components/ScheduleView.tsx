import { useMemo, useState } from 'react';
import { Check, CheckCircle2, Clock } from 'lucide-react';
import type { Appointment, Barber, Client } from '../types/barbershop';
import {
  TODAY_ISO,
  TOMORROW_ISO,
  formatCurrency,
  formatFullDate,
  formatShortDate,
  getStatusLabel,
  getStatusTextClass,
} from '../utils/formatters';
import { Avatar } from './Avatar';

interface ScheduleViewProps {
  appointments: Appointment[];
  barbers: Barber[];
  clients: Client[];
  onApprove: (appointmentId: string) => void;
  onOpenDetail: (appointment: Appointment, initialAction?: 'view' | 'complete' | 'cancel') => void;
  onViewClientHistory: (clientId: string) => void;
  onOpenNewBooking: (prefillDate?: string) => void;
}

export function ScheduleView({
  appointments,
  barbers,
  clients,
  onApprove,
  onOpenDetail,
  onViewClientHistory,
  onOpenNewBooking,
}: ScheduleViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_ISO);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');

  const clientsById = useMemo(() => {
    const map = new Map<string, Client>();
    clients.forEach((c) => map.set(c.id, c));
    return map;
  }, [clients]);

  const availableDates = useMemo(() => {
    const dates = new Set<string>([TODAY_ISO, TOMORROW_ISO]);
    appointments.forEach((a) => dates.add(a.date));
    return Array.from(dates).sort();
  }, [appointments]);

  const dayAppointments = useMemo(() => {
    return appointments
      .filter((apt) => {
        if (apt.date !== selectedDate) return false;
        if (selectedBarberId !== 'all' && apt.barberId !== selectedBarberId) return false;
        return true;
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDate, selectedBarberId]);

  const daySummary = useMemo(() => {
    const active = dayAppointments.filter((a) => a.status !== 'cancelled');
    const confirmed = active.filter((a) => a.status === 'confirmed').length;
    const pending = active.filter((a) => a.status === 'pending').length;
    const completed = active.filter((a) => a.status === 'completed').length;
    const totalMinutes = active.reduce((sum, a) => sum + a.durationMinutes, 0);
    const revenue = active.reduce((sum, a) => sum + a.price, 0);
    return { confirmed, pending, completed, totalMinutes, revenue };
  }, [dayAppointments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            Agenda del día
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {formatFullDate(selectedDate)} · Control cronológico de sillas y cierre de servicios.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-600 font-mono tabular-nums">
          <span>{daySummary.confirmed} confirmadas</span>
          <span aria-hidden="true" className="text-zinc-300">
            /
          </span>
          <span>{daySummary.pending} pendientes</span>
          <span aria-hidden="true" className="text-zinc-300">
            /
          </span>
          <span>{daySummary.completed} completadas</span>
          <span aria-hidden="true" className="text-zinc-300">
            /
          </span>
          <span className="text-zinc-950 font-semibold">
            {formatCurrency(daySummary.revenue)}
          </span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-md overflow-x-auto">
          {availableDates.map((dateIso) => (
            <button
              key={dateIso}
              type="button"
              onClick={() => setSelectedDate(dateIso)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                selectedDate === dateIso
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              {formatShortDate(dateIso)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-md overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedBarberId('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
              selectedBarberId === 'all'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            Todos los barberos
          </button>
          {barbers.map((barber) => (
            <button
              key={barber.id}
              type="button"
              onClick={() => setSelectedBarberId(barber.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                selectedBarberId === barber.id
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              {barber.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chronological Timeline List */}
      <section className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        {dayAppointments.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-semibold text-zinc-900">
              No hay citas programadas para esta fecha
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Puedes agendar una cita manualmente o esperar nuevas solicitudes entrantes.
            </p>
            <button
              type="button"
              onClick={() => onOpenNewBooking(selectedDate)}
              className="mt-5 px-4 py-2 text-xs font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors whitespace-nowrap"
            >
              Registrar cita para {formatShortDate(selectedDate)}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {dayAppointments.map((apt) => {
              const client = clientsById.get(apt.clientId);
              const isCancelled = apt.status === 'cancelled';

              return (
                <div
                  key={apt.id}
                  onClick={() => onOpenDetail(apt, 'view')}
                  className={`p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-zinc-50/80 transition-colors cursor-pointer ${
                    isCancelled ? 'opacity-65' : ''
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-5 min-w-0">
                    <div className="w-20 shrink-0">
                      <p className="font-mono text-base font-semibold text-zinc-950 tabular-nums">
                        {apt.time}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500 font-mono tabular-nums">
                        <Clock className="h-3 w-3 text-zinc-400 shrink-0" />
                        <span>{apt.durationMinutes} min</span>
                      </p>
                    </div>

                    <div className="h-10 w-px bg-zinc-200 hidden sm:block shrink-0" />

                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <Avatar name={apt.clientName} src={client?.avatarUrl} size="md" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                          <span className="text-sm font-semibold text-zinc-950 truncate">
                            {apt.clientName}
                          </span>
                          <span aria-hidden="true" className="text-zinc-300">
                            ·
                          </span>
                          <span
                            className={`text-xs font-semibold ${getStatusTextClass(apt.status)}`}
                          >
                            {getStatusLabel(apt.status)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-zinc-700">
                          {apt.serviceName}{' '}
                          <span className="text-zinc-400">·</span>{' '}
                          <span className="text-zinc-500">{apt.barberName}</span>
                        </p>
                        {apt.clientNotes && (
                          <p className="mt-1 text-xs text-zinc-500 line-clamp-1">
                            Nota del cliente: {apt.clientNotes}
                          </p>
                        )}
                        {apt.status === 'completed' && apt.barberNotes && (
                          <p className="mt-1 text-xs text-zinc-600 line-clamp-1">
                            Registro en historial: {apt.barberNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-between lg:justify-end gap-4 shrink-0 pl-24 sm:pl-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="font-mono text-sm font-semibold text-zinc-950 tabular-nums">
                      {formatCurrency(apt.price)}
                    </span>

                    <div className="flex items-center gap-2">
                      {apt.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onApprove(apt.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors whitespace-nowrap"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Aprobar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenDetail(apt, 'cancel')}
                            className="px-3 py-1.5 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-md hover:text-red-700 hover:border-red-200 transition-colors whitespace-nowrap"
                          >
                            Cancelar
                          </button>
                        </>
                      )}

                      {apt.status === 'confirmed' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onOpenDetail(apt, 'complete')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 rounded-md hover:bg-emerald-800 transition-colors whitespace-nowrap"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Completar servicio</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenDetail(apt, 'cancel')}
                            className="px-3 py-1.5 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-md hover:text-red-700 hover:border-red-200 transition-colors whitespace-nowrap"
                          >
                            Cancelar
                          </button>
                        </>
                      )}

                      {apt.status === 'completed' && (
                        <button
                          type="button"
                          onClick={() => onViewClientHistory(apt.clientId)}
                          className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md hover:text-zinc-950 hover:border-zinc-400 transition-colors whitespace-nowrap"
                        >
                          Ver historial
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
