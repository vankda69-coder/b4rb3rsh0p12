import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type {
  Barber,
  Client,
  CreateAppointmentInput,
  Service,
} from '../types/barbershop';
import { TODAY_ISO, formatCurrency } from '../utils/formatters';

interface NewBookingDrawerProps {
  open: boolean;
  clients: Client[];
  services: Service[];
  barbers: Barber[];
  prefillClientId?: string | null;
  prefillDate?: string | null;
  onClose: () => void;
  onCreate: (input: CreateAppointmentInput) => void;
}

const TIME_SLOTS = [
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
];

export function NewBookingDrawer({
  open,
  clients,
  services,
  barbers,
  prefillClientId,
  prefillDate,
  onClose,
  onCreate,
}: NewBookingDrawerProps) {
  const activeServices = services.filter((s) => s.active);

  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing');
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [serviceId, setServiceId] = useState(activeServices[0]?.id || services[0]?.id || '');
  const [barberId, setBarberId] = useState(barbers[0]?.id || '');
  const [date, setDate] = useState(TODAY_ISO);
  const [time, setTime] = useState('16:30');
  const [initialStatus, setInitialStatus] = useState<'pending' | 'confirmed'>('pending');
  const [clientNotes, setClientNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    if (prefillClientId) {
      setClientMode('existing');
      setClientId(prefillClientId);
    } else if (!clientId && clients[0]) {
      setClientId(clients[0].id);
    }
    if (prefillDate) {
      setDate(prefillDate);
    } else {
      setDate(TODAY_ISO);
    }
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setClientNotes('');
    setInitialStatus('pending');
  }, [open, prefillClientId, prefillDate, clients, clientId]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const selectedService = services.find((s) => s.id === serviceId) || activeServices[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientMode === 'new' && (!clientName.trim() || !clientPhone.trim())) return;
    if (clientMode === 'existing' && !clientId) return;

    onCreate({
      clientMode,
      clientId,
      clientName,
      clientPhone,
      clientEmail,
      serviceId: selectedService?.id || serviceId,
      barberId,
      date,
      time,
      initialStatus,
      clientNotes,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-booking-title"
    >
      <div
        className="fixed inset-0 bg-zinc-950/30 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-lg bg-white h-full border-l border-zinc-200 shadow-2xl flex flex-col"
      >
        <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between gap-4">
          <div>
            <h2 id="new-booking-title" className="text-lg font-bold text-zinc-950">
              Nueva reserva
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Registra una solicitud entrante o agenda una cita confirmada directamente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar formulario de reserva"
            className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Client Mode Switcher */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-2">
              Cliente
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 rounded-md">
              <button
                type="button"
                onClick={() => setClientMode('existing')}
                className={`py-1.5 text-xs font-medium rounded transition-colors ${
                  clientMode === 'existing'
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                Cliente registrado
              </button>
              <button
                type="button"
                onClick={() => setClientMode('new')}
                className={`py-1.5 text-xs font-medium rounded transition-colors ${
                  clientMode === 'new'
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                Nuevo cliente
              </button>
            </div>
          </div>

          {clientMode === 'existing' ? (
            <div>
              <label
                htmlFor="existing-client-select"
                className="block text-xs font-medium text-zinc-700 mb-1.5"
              >
                Seleccionar cliente
              </label>
              <select
                id="existing-client-select"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                className="w-full h-10 px-3 text-sm bg-white border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900"
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.phone})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div>
                <label
                  htmlFor="new-client-name"
                  className="block text-xs font-medium text-zinc-700 mb-1.5"
                >
                  Nombre completo
                </label>
                <input
                  id="new-client-name"
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej. Sergio Navarro"
                  className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="new-client-phone"
                    className="block text-xs font-medium text-zinc-700 mb-1.5"
                  >
                    Teléfono
                  </label>
                  <input
                    id="new-client-phone"
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+34 600 123 456"
                    className="w-full h-10 px-3 text-sm font-mono tabular-nums border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label
                    htmlFor="new-client-email"
                    className="block text-xs font-medium text-zinc-700 mb-1.5"
                  >
                    Correo electrónico (opcional)
                  </label>
                  <input
                    id="new-client-email"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="cliente@correo.es"
                    className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Service & Barber */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="booking-service-select"
                className="block text-xs font-medium text-zinc-700 mb-1.5"
              >
                Servicio
              </label>
              <select
                id="booking-service-select"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                required
                className="w-full h-10 px-3 text-sm bg-white border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900"
              >
                {activeServices.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.name} · {formatCurrency(srv.price)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="booking-barber-select"
                className="block text-xs font-medium text-zinc-700 mb-1.5"
              >
                Barbero
              </label>
              <select
                id="booking-barber-select"
                value={barberId}
                onChange={(e) => setBarberId(e.target.value)}
                required
                className="w-full h-10 px-3 text-sm bg-white border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900"
              >
                {barbers.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="booking-date"
                className="block text-xs font-medium text-zinc-700 mb-1.5"
              >
                Fecha
              </label>
              <input
                id="booking-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 text-sm font-mono tabular-nums border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div>
              <label
                htmlFor="booking-time"
                className="block text-xs font-medium text-zinc-700 mb-1.5"
              >
                Hora
              </label>
              <select
                id="booking-time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Initial Status */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-2">
              Estado inicial de la reserva
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 rounded-md">
              <button
                type="button"
                onClick={() => setInitialStatus('pending')}
                className={`py-1.5 text-xs font-medium rounded transition-colors ${
                  initialStatus === 'pending'
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                Solicitud pendiente
              </button>
              <button
                type="button"
                onClick={() => setInitialStatus('confirmed')}
                className={`py-1.5 text-xs font-medium rounded transition-colors ${
                  initialStatus === 'confirmed'
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                Confirmada directa
              </button>
            </div>
          </div>

          {/* Client Notes */}
          <div>
            <label
              htmlFor="booking-client-notes"
              className="block text-xs font-medium text-zinc-700 mb-1.5"
            >
              Notas o petición del cliente (opcional)
            </label>
            <textarea
              id="booking-client-notes"
              rows={3}
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="Ej. Prefiere fade bajo y perfilado clásico..."
              className="w-full p-3 text-sm border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900"
            />
          </div>

          {selectedService && (
            <div className="pt-3 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-600">
              <span>
                Duración estimada:{' '}
                <strong className="font-mono text-zinc-900 tabular-nums">
                  {selectedService.durationMinutes} min
                </strong>
              </span>
              <span>
                Tarifa:{' '}
                <strong className="font-mono text-sm text-zinc-950 tabular-nums">
                  {formatCurrency(selectedService.price)}
                </strong>
              </span>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-zinc-200 flex items-center justify-end gap-2.5 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 whitespace-nowrap"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            {initialStatus === 'pending' ? 'Registrar solicitud' : 'Confirmar cita'}
          </button>
        </div>
      </form>
    </div>
  );
}
