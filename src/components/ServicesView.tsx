import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { Client, Service } from '../types/barbershop';
import { formatCurrency } from '../utils/formatters';

interface ServicesViewProps {
  services: Service[];
  clients: Client[];
  onSaveService: (service: Omit<Service, 'id'> & { id?: string }) => void;
  onToggleServiceActive: (serviceId: string) => void;
}

export function ServicesView({
  services,
  clients,
  onSaveService,
  onToggleServiceActive,
}: ServicesViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Service['category']>('Corte');
  const [durationMinutes, setDurationMinutes] = useState(35);
  const [price, setPrice] = useState(25);
  const [description, setDescription] = useState('');

  const completedStatsByService = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    clients.forEach((client) => {
      client.history.forEach((entry) => {
        if (entry.status !== 'completed') return;
        const current = map.get(entry.serviceId) || { count: 0, revenue: 0 };
        map.set(entry.serviceId, {
          count: current.count + 1,
          revenue: current.revenue + entry.price,
        });
      });
    });
    return map;
  }, [clients]);

  const openCreateForm = () => {
    setEditingId(undefined);
    setName('');
    setCategory('Corte');
    setDurationMinutes(35);
    setPrice(25);
    setDescription('');
    setShowForm(true);
  };

  const openEditForm = (service: Service) => {
    setEditingId(service.id);
    setName(service.name);
    setCategory(service.category);
    setDurationMinutes(service.durationMinutes);
    setPrice(service.price);
    setDescription(service.description);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSaveService({
      id: editingId,
      name: name.trim(),
      category,
      durationMinutes: Number(durationMinutes) || 30,
      price: Number(price) || 20,
      description: description.trim(),
      active: true,
    });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            Catálogo de servicios
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Tarifas, duraciones en silla y rendimiento histórico calculado a partir de citas completadas.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Añadir servicio</span>
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-zinc-200 rounded-lg p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-950">
              {editingId ? 'Editar servicio' : 'Nuevo servicio de barbería'}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              aria-label="Cerrar formulario"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Nombre del servicio
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Corte Clásico + Lavado"
                className="w-full h-9 px-3 text-sm border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Service['category'])}
                className="w-full h-9 px-3 text-sm border border-zinc-300 rounded-md bg-white focus:outline-none focus:border-zinc-900"
              >
                <option value="Corte">Corte</option>
                <option value="Barba">Barba</option>
                <option value="Ritual">Ritual</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Minutos
                </label>
                <input
                  type="number"
                  min={10}
                  max={180}
                  step={5}
                  required
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full h-9 px-3 text-sm font-mono tabular-nums border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Precio (€)
                </label>
                <input
                  type="number"
                  min={5}
                  max={300}
                  step={1}
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full h-9 px-3 text-sm font-mono tabular-nums border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Descripción
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalle breve del servicio incluido en la reserva"
              className="w-full h-9 px-3 text-sm border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800"
            >
              {editingId ? 'Guardar cambios' : 'Crear servicio'}
            </button>
          </div>
        </form>
      )}

      <section className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70 text-xs font-medium text-zinc-500">
                <th className="py-3 pl-5 pr-4 whitespace-nowrap">Servicio</th>
                <th className="py-3 px-4 whitespace-nowrap">Categoría</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Duración</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Tarifa</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Realizados</th>
                <th className="py-3 px-4 whitespace-nowrap">Disponibilidad</th>
                <th className="py-3 pl-4 pr-5 text-right whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 text-sm">
              {services.map((service) => {
                const stats = completedStatsByService.get(service.id) || {
                  count: 0,
                  revenue: 0,
                };

                return (
                  <tr key={service.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3.5 pl-5 pr-4">
                      <p className="font-semibold text-zinc-950">{service.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 max-w-md">
                        {service.description}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 whitespace-nowrap">
                      {service.category}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-zinc-700 whitespace-nowrap">
                      {service.durationMinutes} min
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium tabular-nums text-zinc-950 whitespace-nowrap">
                      {formatCurrency(service.price)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-zinc-700 whitespace-nowrap">
                      {stats.count} ·{' '}
                      <span className="text-zinc-500">{formatCurrency(stats.revenue)}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-xs font-semibold ${
                          service.active ? 'text-emerald-700' : 'text-zinc-400'
                        }`}
                      >
                        {service.active ? 'Activo' : 'Pausado'}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 pr-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(service)}
                          className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md hover:border-zinc-400 hover:text-zinc-950 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleServiceActive(service.id)}
                          className="px-3 py-1.5 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-md hover:border-zinc-400 hover:text-zinc-950 transition-colors"
                        >
                          {service.active ? 'Pausar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
