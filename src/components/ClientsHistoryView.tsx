import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, Check, Pencil, Search } from 'lucide-react';
import type { Appointment, Client } from '../types/barbershop';
import {
  formatCurrency,
  formatRelativeTimestamp,
  formatShortDate,
} from '../utils/formatters';
import { Avatar } from './Avatar';

interface ClientsHistoryViewProps {
  clients: Client[];
  appointments: Appointment[];
  selectedClientId: string | null;
  recentlyUpdatedClientId: string | null;
  onSelectClient: (clientId: string) => void;
  onUpdatePreferences: (clientId: string, preferences: string) => void;
  onBookForClient: (clientId: string) => void;
}

export function ClientsHistoryView({
  clients,
  appointments,
  selectedClientId,
  recentlyUpdatedClientId,
  onSelectClient,
  onUpdatePreferences,
  onBookForClient,
}: ClientsHistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPrefs, setEditingPrefs] = useState(false);
  const [prefsDraft, setPrefsDraft] = useState('');

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return clients
      .filter((client) => {
        if (!q) return true;
        return (
          client.name.toLowerCase().includes(q) ||
          client.phone.toLowerCase().includes(q) ||
          client.email.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const aLatest = a.history[0]?.recordedAt || a.createdAt;
        const bLatest = b.history[0]?.recordedAt || b.createdAt;
        return bLatest.localeCompare(aLatest);
      });
  }, [clients, searchQuery]);

  const activeClient = useMemo(() => {
    if (selectedClientId) {
      const found = clients.find((c) => c.id === selectedClientId);
      if (found) return found;
    }
    return filteredClients[0] || clients[0] || null;
  }, [clients, filteredClients, selectedClientId]);

  useEffect(() => {
    setEditingPrefs(false);
    setPrefsDraft(activeClient?.preferences || '');
  }, [activeClient?.id, activeClient?.preferences]);

  const activeClientStats = useMemo(() => {
    if (!activeClient) return null;
    const completed = activeClient.history.filter((h) => h.status === 'completed');
    const cancelled = activeClient.history.filter((h) => h.status === 'cancelled');
    const totalSpent = completed.reduce((sum, h) => sum + h.price, 0);
    const upcoming = appointments
      .filter(
        (a) =>
          a.clientId === activeClient.id &&
          (a.status === 'pending' || a.status === 'confirmed')
      )
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

    return {
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      totalSpent,
      lastVisit: completed[0]?.date || null,
      upcoming,
    };
  }, [activeClient, appointments]);

  const handleSavePrefs = () => {
    if (!activeClient) return;
    onUpdatePreferences(activeClient.id, prefsDraft);
    setEditingPrefs(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
          Clientes e historial de servicios
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Cada cita marcada como completada o cancelada actualiza automáticamente el expediente del cliente.
        </p>
      </div>

      {/* Master-Detail Single-Elevation Container */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        {/* Left Pane: Client Directory */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-zinc-200 flex flex-col">
          <div className="p-4 border-b border-zinc-200">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cliente por nombre o teléfono..."
                aria-label="Buscar clientes"
                className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors"
              />
            </div>
          </div>

          <div className="divide-y divide-zinc-200/80 overflow-y-auto flex-1 max-h-[640px]">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">
                No se encontraron clientes para &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              filteredClients.map((client) => {
                const isSelected = activeClient?.id === client.id;
                const completedVisits = client.history.filter(
                  (h) => h.status === 'completed'
                ).length;
                const lastCompleted = client.history.find((h) => h.status === 'completed');
                const isRecentlyUpdated = recentlyUpdatedClientId === client.id;

                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => onSelectClient(client.id)}
                    className={`w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-zinc-900 ${
                      isSelected ? 'bg-zinc-100/90' : 'hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={client.name} src={client.avatarUrl} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-950 truncate">
                          {client.name}
                        </p>
                        <p className="text-xs text-zinc-500 font-mono tabular-nums truncate">
                          {client.phone}
                        </p>
                        {isRecentlyUpdated && (
                          <p className="mt-0.5 text-[11px] font-medium text-emerald-700">
                            Historial actualizado ahora
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono text-xs font-semibold text-zinc-900 tabular-nums">
                        {completedVisits} {completedVisits === 1 ? 'visita' : 'visitas'}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {lastCompleted ? formatShortDate(lastCompleted.date) : 'Sin visitas'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Client Profile & Automatic History Ledger */}
        <div className="lg:col-span-8 flex flex-col">
          {!activeClient || !activeClientStats ? (
            <div className="flex-1 flex items-center justify-center p-12 text-sm text-zinc-500">
              Selecciona un cliente para consultar su historial de servicios.
            </div>
          ) : (
            <div className="divide-y divide-zinc-200">
              {/* Client Header */}
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar
                    name={activeClient.name}
                    src={activeClient.avatarUrl}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-zinc-950 truncate">
                      {activeClient.name}
                    </h2>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-zinc-500">
                      <span className="font-mono tabular-nums">{activeClient.phone}</span>
                      <span aria-hidden="true">·</span>
                      <span>{activeClient.email}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onBookForClient(activeClient.id)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  <span>Nueva cita</span>
                </button>
              </div>

              {/* Client Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 bg-zinc-50/40">
                <div className="p-4">
                  <p className="text-xs text-zinc-500">Servicios completados</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-zinc-950 tabular-nums">
                    {activeClientStats.completedCount}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-xs text-zinc-500">Facturación acumulada</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-zinc-950 tabular-nums">
                    {formatCurrency(activeClientStats.totalSpent)}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-xs text-zinc-500">Último servicio</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-950">
                    {activeClientStats.lastVisit
                      ? formatShortDate(activeClientStats.lastVisit)
                      : 'Sin registro'}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-xs text-zinc-500">Cancelaciones</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-zinc-950 tabular-nums">
                    {activeClientStats.cancelledCount}
                  </p>
                </div>
              </div>

              {/* Technical Grooming Preferences */}
              <div className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xs font-semibold text-zinc-900">
                    Preferencias técnicas y notas de estilo
                  </h3>
                  {!editingPrefs ? (
                    <button
                      type="button"
                      onClick={() => setEditingPrefs(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 transition-colors whitespace-nowrap"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Editar notas</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPrefs(false);
                          setPrefsDraft(activeClient.preferences);
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-zinc-600 hover:text-zinc-900"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePrefs}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Guardar</span>
                      </button>
                    </div>
                  )}
                </div>

                {editingPrefs ? (
                  <textarea
                    rows={3}
                    value={prefsDraft}
                    onChange={(e) => setPrefsDraft(e.target.value)}
                    placeholder="Indica número de peine, remolinos, productos preferidos o sensibilidad de piel..."
                    className="mt-2.5 w-full p-3 text-sm bg-white border border-zinc-300 rounded-md text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                ) : (
                  <p className="mt-2 text-sm text-zinc-700 leading-relaxed">
                    {activeClient.preferences || 'Sin notas técnicas registradas todavía.'}
                  </p>
                )}

                {activeClientStats.upcoming.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-zinc-200/80 text-xs text-zinc-600">
                    <span className="font-semibold text-zinc-900">Próxima cita activa: </span>
                    <span>
                      {formatShortDate(activeClientStats.upcoming[0].date)} a las{' '}
                      <span className="font-mono tabular-nums">
                        {activeClientStats.upcoming[0].time}
                      </span>{' '}
                      · {activeClientStats.upcoming[0].serviceName} con{' '}
                      {activeClientStats.upcoming[0].barberName} (
                      {activeClientStats.upcoming[0].status === 'pending'
                        ? 'Pendiente de aprobación'
                        : 'Confirmada'}
                      )
                    </span>
                  </div>
                )}
              </div>

              {/* Automatic Chronological Service History */}
              <div className="p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3 className="text-sm font-semibold text-zinc-950">
                    Historial cronológico de servicios
                  </h3>
                  <span className="font-mono text-xs text-zinc-500 tabular-nums">
                    {activeClient.history.length}{' '}
                    {activeClient.history.length === 1 ? 'registro' : 'registros'}
                  </span>
                </div>

                {activeClient.history.length === 0 ? (
                  <div className="py-10 text-center border border-dashed border-zinc-200 rounded-md">
                    <p className="text-sm font-medium text-zinc-900">
                      Este cliente aún no tiene servicios completados
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
                      Cuando marques una de sus citas como completada desde Solicitudes o Agenda, aparecerá aquí automáticamente.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-200 border-t border-zinc-200">
                    {activeClient.history.map((entry) => {
                      const isCompleted = entry.status === 'completed';
                      return (
                        <div key={entry.id} className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span className="text-sm font-semibold text-zinc-950">
                                {entry.serviceName}
                              </span>
                              <span aria-hidden="true" className="text-zinc-300">
                                ·
                              </span>
                              <span
                                className={`text-xs font-semibold ${
                                  isCompleted ? 'text-emerald-700' : 'text-red-700'
                                }`}
                              >
                                {isCompleted ? 'Completado' : 'Cancelado'}
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-zinc-500">
                              {formatShortDate(entry.date)} ·{' '}
                              <span className="font-mono tabular-nums">{entry.time}</span> ·{' '}
                              {entry.barberName} ·{' '}
                              <span className="font-mono tabular-nums">
                                {entry.durationMinutes} min
                              </span>
                            </p>

                            {entry.barberNotes && (
                              <p className="mt-2 text-sm text-zinc-700 leading-relaxed">
                                {entry.barberNotes}
                              </p>
                            )}
                          </div>

                          <div className="sm:text-right shrink-0">
                            <p className="font-mono text-sm font-semibold text-zinc-950 tabular-nums">
                              {isCompleted ? formatCurrency(entry.price) : '—'}
                            </p>
                            <p className="mt-0.5 text-[11px] text-zinc-400 font-mono tabular-nums">
                              Reg. {formatRelativeTimestamp(entry.recordedAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
