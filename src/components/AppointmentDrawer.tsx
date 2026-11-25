import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, CheckCircle2, RotateCcw, X } from 'lucide-react';
import type { Appointment, Client } from '../types/barbershop';
import {
  formatCurrency,
  formatFullDate,
  formatShortDate,
  getStatusLabel,
  getStatusTextClass,
} from '../utils/formatters';
import { Avatar } from './Avatar';

export type DrawerActionMode = 'view' | 'complete' | 'cancel';

interface AppointmentDrawerProps {
  appointment: Appointment | null;
  client: Client | null;
  initialMode: DrawerActionMode;
  onClose: () => void;
  onApprove: (appointmentId: string) => void;
  onComplete: (appointmentId: string, barberNotes: string) => void;
  onCancel: (appointmentId: string, reason: string) => void;
  onReopen: (appointmentId: string) => void;
  onOpenClientHistory: (clientId: string) => void;
}

const QUICK_CANCEL_REASONS = [
  'Cliente solicitó reprogramar',
  'Conflicto de horario en agenda',
  'Ausencia sin aviso previo',
];

export function AppointmentDrawer({
  appointment,
  client,
  initialMode,
  onClose,
  onApprove,
  onComplete,
  onCancel,
  onReopen,
  onOpenClientHistory,
}: AppointmentDrawerProps) {
  const [mode, setMode] = useState<DrawerActionMode>(initialMode);
  const [barberNotes, setBarberNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    setMode(initialMode);
    setBarberNotes(appointment?.barberNotes || '');
    setCancelReason(appointment?.cancellationReason || '');
  }, [appointment?.id, appointment?.barberNotes, appointment?.cancellationReason, initialMode]);

  useEffect(() => {
    if (!appointment) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appointment, onClose]);

  if (!appointment) return null;

  const completedHistory = (client?.history || []).filter(
    (entry) => entry.status === 'completed'
  );
  const recentHistory = completedHistory.slice(0, 3);

  const handleConfirmComplete = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(appointment.id, barberNotes);
    onClose();
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    onCancel(appointment.id, cancelReason);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="appointment-drawer-title"
    >
      <div
        className="fixed inset-0 bg-zinc-950/30 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg bg-white h-full border-l border-zinc-200 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-200 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs">
              <span className={`font-semibold ${getStatusTextClass(appointment.status)}`}>
                {getStatusLabel(appointment.status)}
              </span>
              <span aria-hidden="true" className="text-zinc-300">
                ·
              </span>
              <span className="font-mono text-zinc-500 tabular-nums">
                {appointment.time}
              </span>
              <span aria-hidden="true" className="text-zinc-300">
                ·
              </span>
              <span className="text-zinc-500">{formatShortDate(appointment.date)}</span>
            </div>
            <h2
              id="appointment-drawer-title"
              className="mt-1 text-lg font-bold text-zinc-950 truncate"
            >
              {appointment.serviceName}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de cita"
            className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-200">
          {/* Client Summary */}
          <div className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <Avatar
                  name={appointment.clientName}
                  src={client?.avatarUrl}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-950 truncate">
                    {appointment.clientName}
                  </p>
                  <p className="text-xs text-zinc-500 font-mono tabular-nums">
                    {appointment.clientPhone}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onOpenClientHistory(appointment.clientId);
                  onClose();
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 hover:text-zinc-950 underline underline-offset-4 whitespace-nowrap shrink-0"
              >
                <span>Ver expediente</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {client?.preferences && (
              <div className="mt-4 pt-3.5 border-t border-zinc-100">
                <p className="text-xs font-medium text-zinc-500">
                  Preferencias guardadas del cliente
                </p>
                <p className="mt-1 text-sm text-zinc-700 leading-relaxed">
                  {client.preferences}
                </p>
              </div>
            )}
          </div>

          {/* Appointment Details Grid */}
          <div className="p-6 space-y-4">
            <h3 className="text-xs font-semibold text-zinc-900">Detalles de la reserva</h3>
            <dl className="grid grid-cols-2 gap-y-3.5 gap-x-4 text-sm">
              <div>
                <dt className="text-xs text-zinc-500">Fecha</dt>
                <dd className="mt-0.5 font-medium text-zinc-900">
                  {formatFullDate(appointment.date)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Horario y duración</dt>
                <dd className="mt-0.5 font-mono font-medium text-zinc-900 tabular-nums">
                  {appointment.time} · {appointment.durationMinutes} min
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Barbero asignado</dt>
                <dd className="mt-0.5 font-medium text-zinc-900">
                  {appointment.barberName}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Importe del servicio</dt>
                <dd className="mt-0.5 font-mono font-semibold text-zinc-950 tabular-nums">
                  {formatCurrency(appointment.price)}
                </dd>
              </div>
            </dl>

            {appointment.clientNotes && (
              <div className="pt-2">
                <p className="text-xs text-zinc-500">Comentario del cliente al reservar</p>
                <p className="mt-1 text-sm text-zinc-800 bg-zinc-50 border border-zinc-200/80 rounded-md p-3 leading-relaxed">
                  {appointment.clientNotes}
                </p>
              </div>
            )}

            {appointment.status === 'completed' && appointment.barberNotes && (
              <div className="pt-2">
                <p className="text-xs text-emerald-700 font-medium">
                  Registrado en el historial del cliente
                </p>
                <p className="mt-1 text-sm text-zinc-800 bg-emerald-50/50 border border-emerald-200/70 rounded-md p-3 leading-relaxed">
                  {appointment.barberNotes}
                </p>
              </div>
            )}

            {appointment.status === 'cancelled' && appointment.cancellationReason && (
              <div className="pt-2">
                <p className="text-xs text-red-700 font-medium">Motivo de cancelación</p>
                <p className="mt-1 text-sm text-zinc-800 bg-red-50/50 border border-red-200/70 rounded-md p-3 leading-relaxed">
                  {appointment.cancellationReason}
                </p>
              </div>
            )}
          </div>

          {/* Complete Action Form */}
          {mode === 'complete' && appointment.status !== 'completed' && (
            <form
              id="complete-appointment-form"
              onSubmit={handleConfirmComplete}
              className="p-6 bg-zinc-50/80 space-y-3"
            >
              <h3 className="text-sm font-semibold text-zinc-950">
                Finalizar servicio y actualizar historial
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Al marcar esta cita como completada, se añadirá automáticamente una entrada en el historial de{' '}
                <span className="font-semibold text-zinc-900">{appointment.clientName}</span>{' '}
                con la tarifa, fecha, barbero y tus notas técnicas.
              </p>

              <div>
                <label
                  htmlFor="barber-completion-notes"
                  className="block text-xs font-medium text-zinc-700 mb-1.5"
                >
                  Notas técnicas del corte o acabado (opcional)
                </label>
                <textarea
                  id="barber-completion-notes"
                  rows={3}
                  value={barberNotes}
                  onChange={(e) => setBarberNotes(e.target.value)}
                  placeholder="Ej. Degradado medio al #1, contorno limpio a navaja, acabado con cera mate..."
                  className="w-full p-3 text-sm bg-white border border-zinc-300 rounded-md text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>
            </form>
          )}

          {/* Cancel Action Form */}
          {mode === 'cancel' && appointment.status !== 'cancelled' && (
            <form
              id="cancel-appointment-form"
              onSubmit={handleConfirmCancel}
              className="p-6 bg-zinc-50/80 space-y-3"
            >
              <h3 className="text-sm font-semibold text-zinc-950">Cancelar cita</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                La cita pasará a estado cancelado y quedará constancia en el historial del cliente.
              </p>

              <div className="flex flex-wrap gap-2">
                {QUICK_CANCEL_REASONS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCancelReason(preset)}
                    className={`px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
                      cancelReason === preset
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div>
                <label
                  htmlFor="cancel-reason-input"
                  className="block text-xs font-medium text-zinc-700 mb-1.5"
                >
                  Motivo de cancelación
                </label>
                <textarea
                  id="cancel-reason-input"
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Describe brevemente el motivo..."
                  className="w-full p-3 text-sm bg-white border border-zinc-300 rounded-md text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>
            </form>
          )}

          {/* Contextual Recent Client History */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-zinc-900">
                Últimas visitas del cliente
              </h3>
              <span className="font-mono text-xs text-zinc-500 tabular-nums">
                {completedHistory.length} completadas
              </span>
            </div>

            {recentHistory.length === 0 ? (
              <p className="text-xs text-zinc-500">
                Sin visitas previas registradas. Esta será la primera entrada en su historial al completarse.
              </p>
            ) : (
              <div className="divide-y divide-zinc-200/80 border-t border-zinc-200/80">
                {recentHistory.map((item) => (
                  <div key={item.id} className="py-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-xs font-semibold text-zinc-900">
                        {item.serviceName}
                      </p>
                      <span className="font-mono text-xs text-zinc-500 tabular-nums">
                        {formatShortDate(item.date)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {item.barberName} ·{' '}
                      <span className="font-mono tabular-nums">
                        {formatCurrency(item.price)}
                      </span>
                    </p>
                    {item.barberNotes && (
                      <p className="mt-1 text-xs text-zinc-600 leading-relaxed">
                        {item.barberNotes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-200 bg-white flex items-center justify-between gap-3">
          {mode === 'complete' ? (
            <>
              <button
                type="button"
                onClick={() => setMode('view')}
                className="px-4 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 whitespace-nowrap"
              >
                Volver
              </button>
              <button
                type="submit"
                form="complete-appointment-form"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-700 rounded-md hover:bg-emerald-800 transition-colors whitespace-nowrap"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirmar y actualizar historial</span>
              </button>
            </>
          ) : mode === 'cancel' ? (
            <>
              <button
                type="button"
                onClick={() => setMode('view')}
                className="px-4 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 whitespace-nowrap"
              >
                Volver
              </button>
              <button
                type="submit"
                form="cancel-appointment-form"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-red-700 rounded-md hover:bg-red-800 transition-colors whitespace-nowrap"
              >
                <X className="h-4 w-4" />
                <span>Confirmar cancelación</span>
              </button>
            </>
          ) : (
            <>
              {appointment.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => setMode('cancel')}
                    className="px-4 py-2 text-xs font-medium text-red-700 bg-white border border-red-200 rounded-md hover:bg-red-50 transition-colors whitespace-nowrap"
                  >
                    Cancelar cita
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onApprove(appointment.id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors whitespace-nowrap"
                  >
                    <Check className="h-4 w-4" />
                    <span>Aprobar reserva</span>
                  </button>
                </>
              )}

              {appointment.status === 'confirmed' && (
                <>
                  <button
                    type="button"
                    onClick={() => setMode('cancel')}
                    className="px-4 py-2 text-xs font-medium text-red-700 bg-white border border-red-200 rounded-md hover:bg-red-50 transition-colors whitespace-nowrap"
                  >
                    Cancelar cita
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('complete')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-700 rounded-md hover:bg-emerald-800 transition-colors whitespace-nowrap"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Marcar completado</span>
                  </button>
                </>
              )}

              {appointment.status === 'completed' && (
                <>
                  <span className="text-xs text-zinc-500">
                    Servicio registrado en historial
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenClientHistory(appointment.clientId);
                      onClose();
                    }}
                    className="px-4 py-2 text-xs font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors whitespace-nowrap"
                  >
                    Ver historial del cliente
                  </button>
                </>
              )}

              {appointment.status === 'cancelled' && (
                <>
                  <span className="text-xs text-zinc-500">Cita cancelada</span>
                  <button
                    type="button"
                    onClick={() => {
                      onReopen(appointment.id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-zinc-900 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors whitespace-nowrap"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reabrir como pendiente</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
